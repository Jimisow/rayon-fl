import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { TEAM_MEMBERS, JOURS } from "../constants";
import { sameName } from "../utils/normalize";
import { normalizeHeure } from "../utils/normalizeHeure";
import { toISODate, mondayOfWeek } from "../utils/planningDates";
import { formatDayLabel } from "../utils/formatDayLabel";

// Ordre d'affichage voulu pour la grille (indépendant de l'ordre utilisé ailleurs, ex: écran de connexion).
// Tout prénom absent de cette liste (ajout futur) s'affiche quand même, à la fin.
const GRID_ORDER = ["Jeanlin", "Gregory", "Christophe", "Cécile", "Said", "Jimi"];
const ORDERED_MEMBERS = [
  ...GRID_ORDER.filter((p) => TEAM_MEMBERS.includes(p)),
  ...TEAM_MEMBERS.filter((p) => !GRID_ORDER.includes(p)),
];

const EMPTY_SEGMENT = { heureDebut: "", heureFin: "" };

function formatCourt(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":");
  const hourNum = parseInt(h, 10);
  return m && m !== "00" ? `${hourNum}h${m}` : `${hourNum}h`;
}

function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTotal(totalMinutes) {
  if (totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

// Champ compact : affiche "7h" / "7h30" au repos, mais laisse taper librement
// (chiffres, "h", ":") pendant la saisie, et normalise seulement à la sortie du champ.
function TimeCellInput({ value, placeholder, onCommit }) {
  const [text, setText] = useState(formatCourt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatCourt(value));
  }, [value, focused]);

  return (
    <input
      className="grid-time-input"
      value={text}
      placeholder={placeholder}
      inputMode="numeric"
      onFocus={() => setFocused(true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        setFocused(false);
        const normalized = text.trim() ? normalizeHeure(text) : "";
        setText(formatCourt(normalized));
        onCommit(normalized);
      }}
    />
  );
}

export default function WeeklyGridEditor() {
  const [weekDate, setWeekDate] = useState(() => toISODate(new Date()));
  const monday = useMemo(() => mondayOfWeek(new Date(weekDate)), [weekDate]);
  const days = useMemo(
    () =>
      JOURS.map((jour, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return { jour, iso: toISODate(d), date: d };
      }),
    [monday]
  );

  // cells[`${prenom}|${iso}`] = [{ heureDebut, heureFin }, ...] — plusieurs segments pour une coupure.
  const [cells, setCells] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
    const unsubs = days.map(({ iso }) =>
      onSnapshot(doc(db, "planning", iso), (snap) => {
        const entrees = snap.exists() ? snap.data().entrees || [] : [];
        setCells((prev) => {
          const next = { ...prev };
          TEAM_MEMBERS.forEach((prenom) => {
            const segments = entrees
              .filter((e) => sameName(e.prenom, prenom))
              .map((e) => ({ heureDebut: e.heureDebut, heureFin: e.heureFin }))
              .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
            next[`${prenom}|${iso}`] = segments.length > 0 ? segments : [{ ...EMPTY_SEGMENT }];
          });
          return next;
        });
      })
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [days]);

  function getSegments(prenom, iso) {
    return cells[`${prenom}|${iso}`] || [{ ...EMPTY_SEGMENT }];
  }

  function commitSegment(prenom, iso, segIdx, field, normalizedValue) {
    setCells((prev) => {
      const key = `${prenom}|${iso}`;
      const segments = (prev[key] || [{ ...EMPTY_SEGMENT }]).map((seg, i) =>
        i === segIdx ? { ...seg, [field]: normalizedValue } : seg
      );
      return { ...prev, [key]: segments };
    });
  }

  function addSegment(prenom, iso) {
    setCells((prev) => {
      const key = `${prenom}|${iso}`;
      const segments = prev[key] || [{ ...EMPTY_SEGMENT }];
      return { ...prev, [key]: [...segments, { ...EMPTY_SEGMENT }] };
    });
  }

  function removeSegment(prenom, iso, segIdx) {
    setCells((prev) => {
      const key = `${prenom}|${iso}`;
      const segments = (prev[key] || []).filter((_, i) => i !== segIdx);
      return { ...prev, [key]: segments.length > 0 ? segments : [{ ...EMPTY_SEGMENT }] };
    });
  }

  function weeklyTotalMinutes(prenom) {
    return days.reduce((sum, { iso }) => {
      return (
        sum +
        getSegments(prenom, iso).reduce((daySum, seg) => {
          if (!seg.heureDebut || !seg.heureFin) return daySum;
          return daySum + Math.max(0, toMinutes(seg.heureFin) - toMinutes(seg.heureDebut));
        }, 0)
      );
    }, 0);
  }

  async function handleSave() {
    await Promise.all(
      days.map(({ iso }) => {
        const entrees = [];
        ORDERED_MEMBERS.forEach((prenom) => {
          getSegments(prenom, iso).forEach((seg) => {
            if (seg.heureDebut && seg.heureFin) {
              entrees.push({ prenom, heureDebut: seg.heureDebut, heureFin: seg.heureFin });
            }
          });
        });
        return setDoc(doc(db, "planning", iso), { date: iso, entrees });
      })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="weekly-grid">
      <label className="week-picker-label">
        Semaine à modifier
        <input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} />
      </label>
      <p className="planning-semaine">
        Du {formatDayLabel(days[0].date)} au {formatDayLabel(days[6].date)}
      </p>

      <div className="weekly-grid-scroll">
        <table className="weekly-grid-table">
          <thead>
            <tr>
              <th>Membre</th>
              {days.map(({ jour, date }) => (
                <th key={jour}>
                  {jour.slice(0, 3)}
                  <br />
                  {date.getDate()}/{date.getMonth() + 1}
                </th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ORDERED_MEMBERS.map((prenom) => (
              <tr key={prenom}>
                <td className="weekly-grid-name">{prenom}</td>
                {days.map(({ iso }) => {
                  const segments = getSegments(prenom, iso);
                  return (
                    <td key={iso}>
                      <div className="grid-cell-segments">
                        {segments.map((seg, segIdx) => (
                          <div className="grid-time-pair" key={segIdx}>
                            <TimeCellInput
                              value={seg.heureDebut}
                              placeholder="7h"
                              onCommit={(v) => commitSegment(prenom, iso, segIdx, "heureDebut", v)}
                            />
                            <span>-</span>
                            <TimeCellInput
                              value={seg.heureFin}
                              placeholder="12h"
                              onCommit={(v) => commitSegment(prenom, iso, segIdx, "heureFin", v)}
                            />
                            {segIdx > 0 && (
                              <button
                                className="grid-segment-remove"
                                title="Retirer cette coupure"
                                onClick={() => removeSegment(prenom, iso, segIdx)}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          className="grid-add-segment"
                          title="Ajouter une coupure (ex: 7h-12h puis 13h-16h)"
                          onClick={() => addSegment(prenom, iso)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  );
                })}
                <td className="weekly-grid-total">{formatTotal(weeklyTotalMinutes(prenom))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? "Enregistré ✓" : "Enregistrer le planning"}
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAdmin } from "../context/AdminContext";
import { formatDayLabel } from "../utils/formatDayLabel";
import { toISODate, mondayOfWeek } from "../utils/planningDates";
import { groupEntriesByPerson, computeGroupLabels } from "../utils/groupShifts";
import WeeklyGridEditor from "../components/WeeklyGridEditor";

const BADGE_ICONS = {
  Matin: "🌅",
  "Après-midi": "☀️",
  Fermeture: "🌆",
  Inventaire: "📦",
};

export default function Planning() {
  const { isAdmin } = useAdmin();
  const [dayOffset, setDayOffset] = useState(0);
  const [entriesForDay, setEntriesForDay] = useState([]);

  const displayedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const displayedISO = toISODate(displayedDate);

  useEffect(() => {
    const ref = doc(db, "planning", displayedISO);
    const unsub = onSnapshot(ref, (snap) => {
      const entrees = snap.exists() ? snap.data().entrees || [] : [];
      setEntriesForDay([...entrees].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)));
    });
    return unsub;
  }, [displayedISO]);

  const groupedEntries = groupEntriesByPerson(entriesForDay);

  return (
    <div className="screen planning-screen">
      <h2>Planning</h2>
      <p className="planning-semaine">Semaine du {formatDayLabel(mondayOfWeek(displayedDate))}</p>

      <div className="day-nav">
        <button className="day-arrow" onClick={() => setDayOffset((o) => o - 1)} aria-label="Jour précédent">
          ‹
        </button>
        <div className="day-label">
          <div className="day-name">{formatDayLabel(displayedDate)}</div>
          {dayOffset === 0 ? (
            <span className="today-tag">Aujourd'hui</span>
          ) : (
            <button className="today-btn" onClick={() => setDayOffset(0)}>
              ↩ Revenir à aujourd'hui
            </button>
          )}
        </div>
        <button className="day-arrow" onClick={() => setDayOffset((o) => o + 1)} aria-label="Jour suivant">
          ›
        </button>
      </div>

      <div className="day-shifts">
        {groupedEntries.length === 0 && (
          <p className="empty-state">Personne ne travaille ce jour-là.</p>
        )}
        {groupedEntries.map((group) => {
          const labels = computeGroupLabels(group.segments);
          return (
            <div key={group.prenom} className="shift-card">
              <div className="shift-top">
                <span className="shift-person">{group.prenom}</span>
                <span className="shift-heures">
                  {group.segments.map((seg, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      {seg.heureDebut} - {seg.heureFin}
                    </span>
                  ))}
                </span>
              </div>
              <div className="planning-badges">
                {labels.map((label) => (
                  <span key={label} className={`badge badge-${label}`}>
                    {BADGE_ICONS[label]} {label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="planning-admin">
          <h3>Modifier le planning (admin)</h3>
          <WeeklyGridEditor />
        </div>
      )}
    </div>
  );
}

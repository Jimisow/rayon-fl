import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAdmin } from "../context/AdminContext";
import { JOURS, TEAM_MEMBERS } from "../constants";
import { sameName } from "../utils/normalize";
import { computeLabels } from "../utils/planningLabels";
import { formatDayLabel } from "../utils/formatDayLabel";
import { toISODate, fromISODate, mondayOfWeek } from "../utils/planningDates";
import { extractPlanningFromImage } from "../utils/gemini";
import { normalizeHeure } from "../utils/normalizeHeure";

const BADGE_ICONS = {
  Matin: "🌅",
  "Après-midi": "☀️",
  Fermeture: "🌆",
  Inventaire: "📦",
};

function jourIndex(jour) {
  const idx = JOURS.findIndex((j) => sameName(j, jour));
  return idx === -1 ? 0 : idx;
}

export default function Planning() {
  const { isAdmin } = useAdmin();
  const [dayOffset, setDayOffset] = useState(0);
  const [entriesForDay, setEntriesForDay] = useState([]);
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState(null);
  const [weekStart, setWeekStart] = useState(() => toISODate(mondayOfWeek(new Date())));
  const [error, setError] = useState("");

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

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setImporting(true);
    try {
      const result = await extractPlanningFromImage(file);
      result.entrees = result.entrees.map((entry) => ({
        ...entry,
        heureDebut: normalizeHeure(entry.heureDebut),
        heureFin: normalizeHeure(entry.heureFin),
      }));
      setDraft(result);
    } catch (err) {
      setError(err.message || "Erreur lors de l'analyse de la photo.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function updateDraftEntry(idx, field, value) {
    setDraft((d) => {
      const entrees = [...d.entrees];
      entrees[idx] = { ...entrees[idx], [field]: value };
      return { ...d, entrees };
    });
  }

  function removeDraftEntry(idx) {
    setDraft((d) => ({ ...d, entrees: d.entrees.filter((_, i) => i !== idx) }));
  }

  function addDraftEntry() {
    setDraft((d) => ({
      ...d,
      entrees: [
        ...d.entrees,
        { prenom: TEAM_MEMBERS[0], jour: JOURS[0], heureDebut: "08:00", heureFin: "16:00" },
      ],
    }));
  }

  function dateForDraftEntry(entry) {
    const monday = fromISODate(weekStart);
    const d = new Date(monday);
    d.setDate(d.getDate() + jourIndex(entry.jour));
    return d;
  }

  // Regroupe les créneaux du brouillon par date réelle, puis écrase le planning
  // existant pour ces dates précises (les autres dates déjà enregistrées ne sont pas touchées).
  async function publishDraft() {
    const byDate = {};
    for (const entry of draft.entrees) {
      const iso = toISODate(dateForDraftEntry(entry));
      if (!byDate[iso]) byDate[iso] = [];
      byDate[iso].push({
        prenom: entry.prenom,
        heureDebut: entry.heureDebut,
        heureFin: entry.heureFin,
      });
    }

    await Promise.all(
      Object.entries(byDate).map(([iso, entrees]) =>
        setDoc(doc(db, "planning", iso), { date: iso, entrees })
      )
    );

    setDraft(null);
  }

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
        {entriesForDay.length === 0 && (
          <p className="empty-state">Personne ne travaille ce jour-là.</p>
        )}
        {entriesForDay.map((entry, idx) => {
          const labels = computeLabels(entry.heureDebut, entry.heureFin);
          return (
            <div key={idx} className="shift-card">
              <div className="shift-top">
                <span className="shift-person">{entry.prenom}</span>
                <span className="shift-heures">
                  {entry.heureDebut} - {entry.heureFin}
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
          <h3>Import (admin)</h3>
          <label className="btn btn-primary file-btn">
            {importing ? "Analyse en cours..." : "Importer une photo de planning"}
            <input type="file" accept="image/*" onChange={handleFile} hidden disabled={importing} />
          </label>
          {error && <p className="form-error">{error}</p>}

          {draft && (
            <div className="draft-preview">
              <h4>Aperçu — {draft.semaine}</h4>

              <label className="week-start-label">
                Lundi de cette semaine (à ajuster si besoin)
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </label>

              <p className="draft-count">{draft.entrees.length} créneau(x) détecté(s)</p>

              <div className="draft-list">
                {draft.entrees.map((entry, idx) => (
                  <div key={idx} className="draft-entry-card">
                    <div className="draft-entry-top">
                      <span className="draft-entry-date">{toISODate(dateForDraftEntry(entry))}</span>
                      <button className="draft-remove-btn" onClick={() => removeDraftEntry(idx)}>
                        ✕
                      </button>
                    </div>

                    <div className="draft-entry-row">
                      <select
                        value={entry.prenom}
                        onChange={(e) => updateDraftEntry(idx, "prenom", e.target.value)}
                      >
                        {TEAM_MEMBERS.map((prenom) => (
                          <option key={prenom} value={prenom}>
                            {prenom}
                          </option>
                        ))}
                      </select>
                      <select
                        value={JOURS.find((j) => sameName(j, entry.jour)) || JOURS[0]}
                        onChange={(e) => updateDraftEntry(idx, "jour", e.target.value)}
                      >
                        {JOURS.map((jour) => (
                          <option key={jour} value={jour}>
                            {jour}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="draft-entry-row">
                      <input
                        type="time"
                        value={entry.heureDebut}
                        onChange={(e) => updateDraftEntry(idx, "heureDebut", e.target.value)}
                      />
                      <span className="draft-entry-sep">→</span>
                      <input
                        type="time"
                        value={entry.heureFin}
                        onChange={(e) => updateDraftEntry(idx, "heureFin", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-ghost add-row-btn" onClick={addDraftEntry}>
                + Ajouter une ligne
              </button>

              <p className="draft-hint">
                Les dates déjà renseignées seront écrasées par ce nouvel import ; les autres seront simplement ajoutées.
              </p>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setDraft(null)}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={publishDraft}>
                  Publier ce planning
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

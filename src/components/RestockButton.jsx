import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import RestockModal from "./RestockModal";

export default function RestockButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "reappro"), where("prenom", "==", user));
    const unsub = onSnapshot(q, (snap) => setCount(snap.size));
    return unsub;
  }, [user]);

  return (
    <>
      <button className="restock-btn" onClick={() => setOpen(true)} title="À ramener de la chambre froide">
        🧊
        {count > 0 && <span className="restock-badge">{count}</span>}
      </button>

      {open && <RestockModal onClose={() => setOpen(false)} />}
    </>
  );
}

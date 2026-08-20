import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";

function CompareBar() {
  const { compareList, toggleCompare, clearCompare, MAX_COMPARE } = useCompare();
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, background: "white",
      borderTop: "1px solid var(--border-color)", boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
      padding: "0.75rem 1.5rem", display: "flex", alignItems: "center",
      justifyContent: "space-between", zIndex: 20, flexWrap: "wrap", gap: "0.75rem"
    }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <strong>{compareList.length}/{MAX_COMPARE} selected:</strong>
        {compareList.map((p) => (
          <span key={p.id || p.property_id} className="badge" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {p.title}
            <button
              onClick={() => toggleCompare(p)}
              style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn btn-secondary" onClick={clearCompare}>Clear</button>
        <button
          className="btn btn-primary"
          disabled={compareList.length < 2}
          onClick={() => navigate("/compare")}
        >
          Compare Now
        </button>
      </div>
    </div>
  );
}

export default CompareBar;

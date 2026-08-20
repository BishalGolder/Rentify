import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentlyViewed } from "../hooks/useRecentlyViewed";

function RecentlyViewed() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{ margin: "1.5rem 0" }}>
      <h3 style={{ marginBottom: "0.75rem" }}>Recently Viewed</h3>
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {items.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/properties/${p.id}`)}
            style={{
              minWidth: "180px", cursor: "pointer", border: "1px solid var(--border-color)",
              borderRadius: "8px", overflow: "hidden", background: "white"
            }}
          >
            <img
              src={p.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
              alt={p.title}
              style={{ width: "100%", height: "100px", objectFit: "cover" }}
            />
            <div style={{ padding: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{p.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>${p.price}/night</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentlyViewed;

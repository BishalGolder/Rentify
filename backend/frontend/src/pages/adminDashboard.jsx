import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile-property.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadError, setLoadError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "admin") {
      alert("Admin access only.");
      navigate("/dashboard");
      return;
    }
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoadError("");
    try {
      const res = await fetch("http://localhost:5000/api/properties/admin/pending", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPending(await res.json());
      } else {
        const body = await res.json().catch(() => ({}));
        setLoadError(body.message || `Could not load the pending queue (${res.status}).`);
      }
    } catch (err) {
      setLoadError("Network error while loading the pending queue.");
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id, status, reason = null) => {
    try {
      const res = await fetch(`http://localhost:5000/api/properties/admin/${id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, rejection_reason: reason })
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== id));
        setRejectingId(null);
        setRejectReason("");
      } else {
        const data = await res.json();
        alert(data.message || "Action failed.");
      }
    } catch (err) {
      alert("Network error.");
    }
  };

  if (loading) return <div className="dashboard-container">Loading pending properties...</div>;

  return (
    <div className="dashboard-container">
      <div className="ui-card">
        <h2>Property Verification Queue</h2>

        {loadError && (
          <p style={{ color: "var(--danger-color)" }}>{loadError}</p>
        )}
        {!loadError && pending.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No properties awaiting review.</p>
        ) : (
          !loadError && (
            <div className="property-grid">
              {pending.map((prop) => (
                <div key={prop.id} className="property-card">
                  <img
                    src={prop.image_urls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
                    alt={prop.title}
                    className="property-img"
                  />
                  <div className="property-info">
                    <div>
                      <span className="badge">{prop.property_type}</span>
                      <div className="property-title">{prop.title}</div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        📍 {prop.location} {prop.district ? `— ${prop.district}` : ""}
                      </p>
                      <p style={{ fontSize: "0.9rem" }}>{prop.description}</p>
                      <div className="property-price">${prop.price} / night</div>
                    </div>

                    {rejectingId === prop.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <textarea
                          placeholder="Reason for rejection"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-danger"
                            disabled={!rejectReason.trim()}
                            onClick={() => decide(prop.id, "rejected", rejectReason.trim())}
                          >
                            Confirm Reject
                          </button>
                          <button className="btn btn-secondary" onClick={() => setRejectingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="property-actions">
                        <button className="btn btn-primary" onClick={() => decide(prop.id, "verified")}>
                          Approve
                        </button>
                        <button className="btn btn-danger" onClick={() => setRejectingId(prop.id)}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
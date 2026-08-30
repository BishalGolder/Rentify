import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import "../styles/profile-property.css";

const API_BASE = "http://localhost:5000/api";

function HostRevenue() {

    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [range, setRange] = useState("last7Days");

    useEffect(() => {

        const load = async () => {

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {

                const res = await fetch(`${API_BASE}/bookings/host/revenue`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to load revenue.");
                }

                setSummary(data);

            } catch (err) {
                setError(err.message || "Failed to load revenue.");
            } finally {
                setLoading(false);
            }

        };

        load();

    }, [navigate]);

    if (loading) return <div className="dashboard-container">Loading revenue…</div>;

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="ui-card">
                    <p style={{ color: "var(--danger-color)" }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="ui-card">
                <h2>Revenue</h2>

                <div style={{ display: "flex", gap: "1.5rem", margin: "1rem 0 2rem" }}>
                    <div className="ui-card" style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                            ৳{summary.totalRevenue}
                        </div>
                        <div style={{ color: "var(--text-muted)" }}>Total Revenue</div>
                    </div>
                    <div className="ui-card" style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                            {summary.totalBookings}
                        </div>
                        <div style={{ color: "var(--text-muted)" }}>Completed Bookings</div>
                    </div>
                </div>

                <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>By Property</h3>

                {summary.perProperty.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>You don't have any properties yet.</p>
                ) : (
                    summary.perProperty.map((p) => (
                        <div key={p.property_id} className="block-list-item">
                            <span>
                                <strong>{p.title}</strong> — {p.bookingCount} booking(s)
                            </span>
                            <span style={{ fontWeight: 700 }}>৳{p.revenue}</span>
                        </div>
                    ))
                )}

                {/* Revenue Over Time Chart */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1.5rem 0 0.75rem" }}>
                    <h3 style={{ fontSize: "1rem", margin: 0 }}>Revenue Over Time</h3>
                    <div>
                        <button
                            className={range === "last7Days" ? "btn btn-primary" : "btn btn-secondary"}
                            style={{ marginRight: "0.5rem", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                            onClick={() => setRange("last7Days")}
                        >
                            Last 7 Days
                        </button>
                        <button
                            className={range === "thisMonth" ? "btn btn-primary" : "btn btn-secondary"}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                            onClick={() => setRange("thisMonth")}
                        >
                            This Month
                        </button>
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={summary[range]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>

                <h3 style={{ fontSize: "1rem", margin: "1.5rem 0 0.75rem" }}>Recent Bookings</h3>

                {summary.recentBookings.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>No bookings yet.</p>
                ) : (
                    summary.recentBookings.map((b) => (
                        <div key={b.id} className="host-booking-item">
                            <span>
                                <strong>{b.check_in}</strong> → <strong>{b.check_out}</strong>
                                {" "}— ৳{b.total_price}
                            </span>
                            <span className={`booking-status-badge ${b.status}`}>{b.status}</span>
                        </div>
                    ))
                )}

            </div>
        </div>
    );

}

export default HostRevenue;
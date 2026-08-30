import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile-property.css";
 
const API = "http://localhost:5000/api";
 
function Wallet() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [requests, setRequests] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
 
    const token = localStorage.getItem("token");
 
    useEffect(() => { loadAll(); }, []);
 
    const loadAll = async () => {
        setLoading(true);
        try {
            const [profileRes, requestsRes, txRes] = await Promise.all([
                fetch(`${API}/profiles/me`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/wallet/recharge-requests`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const profile = await profileRes.json();
            setBalance(profile.wallet_balance || 0);
            setRequests(requestsRes.ok ? await requestsRes.json() : []);
            setTransactions(txRes.ok ? await txRes.json() : []);
        } catch (error) {
            console.error("Wallet load error:", error);
        } finally {
            setLoading(false);
        }
    };
 
    const handleRecharge = async (e) => {
        e.preventDefault();
        setMessage("");
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/wallet/recharge-requests`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ amount: Number(amount) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Request failed.");
            setMessage("Recharge request submitted — waiting for admin approval.");
            setAmount("");
            await loadAll();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSubmitting(false);
        }
    };
 
    if (loading) return <div className="dashboard-container">Loading wallet...</div>;
 
    return (
        <div className="dashboard-container">
            <div className="ui-card">
                <button className="btn btn-secondary" onClick={() => navigate("/dashboard")} style={{ marginBottom: "1rem" }}>
                    ← Back to Dashboard
                </button>
 
                <h2>My Wallet</h2>
                <div style={{ fontSize: "2rem", fontWeight: 700, margin: "0.5rem 0 1.5rem" }}>
                    ৳{balance}
                </div>
 
                <form onSubmit={handleRecharge} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    <input
                        type="number" min="1" step="0.01" required
                        placeholder="Amount to recharge"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={{ flex: 1, padding: "10px" }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Submitting..." : "Request Recharge"}
                    </button>
                </form>
                {message && <p>{message}</p>}
 
                <h3 style={{ fontSize: "1rem", margin: "1.5rem 0 0.75rem" }}>Recharge Requests</h3>
                {requests.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>No recharge requests yet.</p>
                ) : requests.map((r) => (
                    <div key={r.id} className="block-list-item">
                        <span>৳{r.amount} — {new Date(r.created_at).toLocaleDateString()}</span>
                        <span className={`booking-status-badge ${r.status}`}>{r.status}</span>
                    </div>
                ))}
 
                <h3 style={{ fontSize: "1rem", margin: "1.5rem 0 0.75rem" }}>Transaction History</h3>
                {transactions.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>No transactions yet.</p>
                ) : transactions.map((t) => (
                    <div key={t.id} className="block-list-item">
                        <span>{t.type.replace("_", " ")} — {new Date(t.created_at).toLocaleDateString()}</span>
                        <span style={{ fontWeight: 700, color: t.amount < 0 ? "var(--danger-color)" : "var(--success-color)" }}>
                            {t.amount < 0 ? "" : "+"}{t.amount}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
 
export default Wallet;

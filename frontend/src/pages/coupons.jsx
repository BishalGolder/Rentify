import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/profile-property.css";
import "../styles/coupons.css";

const API_BASE = "http://localhost:5000/api";

const EMPTY_FORM = {
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_discount_amount: "",
    min_booking_amount: "",
    usage_limit: "",
    per_user_limit: "1",
    property_id: "",
    valid_until: ""
};

function Coupons() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [properties, setProperties] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [formMessage, setFormMessage] = useState("");
    const [formError, setFormError] = useState("");


    /*
    =====================================================
    LOAD USER + DATA
    =====================================================
    */

    useEffect(() => {

        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/login");
            return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (parsedUser.role !== "host" && parsedUser.role !== "admin") {
            navigate("/dashboard");
            return;
        }

        setUser(parsedUser);

    }, [navigate]);


    const fetchCoupons = async (role) => {

        const token = localStorage.getItem("token");

        const endpoint = role === "admin"
            ? `${API_BASE}/coupons/admin/all`
            : `${API_BASE}/coupons/mine`;

        const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load coupons.");
        }

        return data;

    };


    const fetchProperties = async (role) => {

        const token = localStorage.getItem("token");

        const endpoint = role === "admin"
            ? `${API_BASE}/properties/admin/all`
            : `${API_BASE}/properties/host/my-properties`;

        const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load properties.");
        }

        return data;

    };


    useEffect(() => {

        if (!user) return;

        const loadAll = async () => {

            try {

                setLoading(true);
                setError("");

                const [couponData, propertyData] = await Promise.all([
                    fetchCoupons(user.role),
                    fetchProperties(user.role)
                ]);

                setCoupons(Array.isArray(couponData) ? couponData : []);
                setProperties(Array.isArray(propertyData) ? propertyData : []);

            } catch (err) {

                console.error("Load coupons error:", err);
                setError(err.message || "Failed to load coupons.");

            } finally {

                setLoading(false);

            }

        };

        loadAll();

    }, [user]);


    /*
    =====================================================
    CREATE COUPON
    =====================================================
    */

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateCoupon = async (e) => {

        e.preventDefault();

        setFormMessage("");
        setFormError("");

        if (!formData.code.trim()) {
            setFormError("Please enter a coupon code.");
            return;
        }

        if (!formData.discount_value || Number(formData.discount_value) <= 0) {
            setFormError("Please enter a valid discount amount.");
            return;
        }

        if (user.role === "host" && !formData.property_id) {
            setFormError("Please choose which of your properties this coupon applies to.");
            return;
        }

        try {

            setCreating(true);

            const token = localStorage.getItem("token");

            const payload = {
                code: formData.code.trim(),
                description: formData.description.trim() || undefined,
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                max_discount_amount: formData.max_discount_amount
                    ? Number(formData.max_discount_amount) : undefined,
                min_booking_amount: formData.min_booking_amount
                    ? Number(formData.min_booking_amount) : undefined,
                usage_limit: formData.usage_limit
                    ? Number(formData.usage_limit) : undefined,
                per_user_limit: formData.per_user_limit
                    ? Number(formData.per_user_limit) : undefined,
                property_id: formData.property_id || undefined,
                valid_until: formData.valid_until
                    ? new Date(formData.valid_until).toISOString() : undefined
            };

            const response = await fetch(`${API_BASE}/coupons`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create coupon.");
            }

            setFormMessage(`✓ Coupon "${data.coupon.code}" created.`);
            setFormData(EMPTY_FORM);
            setCoupons((prev) => [data.coupon, ...prev]);

        } catch (err) {

            console.error("Create coupon error:", err);
            setFormError(err.message || "Failed to create coupon.");

        } finally {

            setCreating(false);

        }

    };


    /*
    =====================================================
    TOGGLE ACTIVE / DELETE
    =====================================================
    */

    const handleToggleActive = async (coupon) => {

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/coupons/${coupon.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !coupon.is_active })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update coupon.");
            }

            setCoupons((prev) =>
                prev.map((c) => (c.id === coupon.id ? { ...c, is_active: data.coupon.is_active } : c))
            );

        } catch (err) {

            console.error("Toggle coupon error:", err);
            alert(err.message || "Failed to update coupon.");

        }

    };


    const handleDelete = async (coupon) => {

        if (!window.confirm(`Delete coupon "${coupon.code}"? This can't be undone.`)) {
            return;
        }

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE}/coupons/${coupon.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete coupon.");
            }

            setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));

        } catch (err) {

            console.error("Delete coupon error:", err);
            alert(err.message || "Failed to delete coupon.");

        }

    };


    if (!user) {
        return null;
    }


    return (
        <div className="dashboard-container coupons-page">

            <div className="ui-card">

                <h2>🏷️ Coupons &amp; Discounts</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    {user.role === "admin"
                        ? "Create and manage discount codes across the platform."
                        : "Create discount codes guests can apply when booking your properties."}
                </p>

                {/* ============================= CREATE FORM ============================= */}

                <form onSubmit={handleCreateCoupon} className="coupon-form">

                    <div className="coupon-form-grid">

                        <div className="form-group">
                            <label>Coupon Code</label>
                            <input
                                type="text"
                                placeholder="e.g. SUMMER25"
                                value={formData.code}
                                onChange={(e) => handleFormChange("code", e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Applies To</label>
                            <select
                                value={formData.property_id}
                                onChange={(e) => handleFormChange("property_id", e.target.value)}
                            >
                                <option value="">
                                    {user.role === "admin" ? "All properties (site-wide)" : "Select a property"}
                                </option>
                                {properties.map((p) => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Discount Type</label>
                            <select
                                value={formData.discount_type}
                                onChange={(e) => handleFormChange("discount_type", e.target.value)}
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (৳)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                Discount Value
                                {formData.discount_type === "percentage" ? " (%)" : " (৳)"}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.discount_value}
                                onChange={(e) => handleFormChange("discount_value", e.target.value)}
                            />
                        </div>

                        {formData.discount_type === "percentage" && (
                            <div className="form-group">
                                <label>Max Discount (৳, optional)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="No cap"
                                    value={formData.max_discount_amount}
                                    onChange={(e) => handleFormChange("max_discount_amount", e.target.value)}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Minimum Booking Amount (৳)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={formData.min_booking_amount}
                                onChange={(e) => handleFormChange("min_booking_amount", e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Total Usage Limit (optional)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Unlimited"
                                value={formData.usage_limit}
                                onChange={(e) => handleFormChange("usage_limit", e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Limit Per Guest</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.per_user_limit}
                                onChange={(e) => handleFormChange("per_user_limit", e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Expires On (optional)</label>
                            <input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => handleFormChange("valid_until", e.target.value)}
                            />
                        </div>

                        <div className="form-group coupon-form-description">
                            <label>Description (optional)</label>
                            <input
                                type="text"
                                placeholder="Shown to guests, e.g. Summer sale"
                                value={formData.description}
                                onChange={(e) => handleFormChange("description", e.target.value)}
                            />
                        </div>

                    </div>

                    {formError && <p className="coupon-form-error">{formError}</p>}
                    {formMessage && <p className="coupon-form-success">{formMessage}</p>}

                    <button type="submit" className="btn btn-primary" disabled={creating}>
                        {creating ? "Creating…" : "Create Coupon"}
                    </button>

                </form>

            </div>

            {/* ============================= LIST ============================= */}

            <div className="ui-card" style={{ marginTop: "1.5rem" }}>

                <h3>Your Coupons</h3>

                {loading ? (
                    <p>Loading coupons…</p>
                ) : error ? (
                    <p className="coupon-form-error">{error}</p>
                ) : coupons.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>No coupons yet — create one above.</p>
                ) : (
                    <div className="coupon-table-wrap">
                        <table className="coupon-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th>Scope</th>
                                    <th>Used</th>
                                    <th>Expires</th>
                                    <th>Status</th>
                                    {user.role === "admin" && <th>Created By</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td>
                                            <strong>{coupon.code}</strong>
                                            {coupon.description && (
                                                <div className="coupon-description">{coupon.description}</div>
                                            )}
                                        </td>
                                        <td>
                                            {coupon.discount_type === "percentage"
                                                ? `${coupon.discount_value}%`
                                                : `৳${coupon.discount_value}`}
                                        </td>
                                        <td>{coupon.properties?.title || "All properties"}</td>
                                        <td>
                                            {coupon.times_used}
                                            {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                                        </td>
                                        <td>
                                            {coupon.valid_until
                                                ? new Date(coupon.valid_until).toLocaleDateString()
                                                : "Never"}
                                        </td>
                                        <td>
                                            <span className={`coupon-status ${coupon.is_active ? "active" : "inactive"}`}>
                                                {coupon.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        {user.role === "admin" && (
                                            <td>{coupon.profiles?.full_name || "—"}</td>
                                        )}
                                        <td className="coupon-actions">
                                            <button
                                                className="btn-link"
                                                onClick={() => handleToggleActive(coupon)}
                                            >
                                                {coupon.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                            <button
                                                className="btn-link danger"
                                                onClick={() => handleDelete(coupon)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

        </div>
    );

}

export default Coupons;

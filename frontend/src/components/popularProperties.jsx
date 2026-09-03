import { useEffect, useState } from "react";
import PropertyCard from "./propertyCard";
import "../styles/popularProperties.css";

const API_BASE = "http://localhost:5000/api";

function PopularProperties({ limit = 8 }) {

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const fetchPopular = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await fetch(`${API_BASE}/properties/popular?limit=${limit}`);

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load popular properties.");
                }

                setProperties(Array.isArray(data) ? data : []);

            } catch (err) {

                console.error("Fetch popular properties error:", err);
                setError(err.message || "Failed to load popular properties.");

            } finally {

                setLoading(false);

            }

        };

        fetchPopular();

    }, [limit]);

    if (loading) {
        return (
            <section className="popular-properties">
                <h2>🔥 Popular Accommodations</h2>
                <p className="popular-properties-status">Loading popular stays…</p>
            </section>
        );
    }

    if (error || properties.length === 0) {
        // Fail quietly — this is a supplementary section, not core content.
        return null;
    }

    return (
        <section className="popular-properties">
            <div className="popular-properties-header">
                <h2>🔥 Popular Accommodations</h2>
                <p>Top-rated stays picked by guests like you.</p>
            </div>

            <div className="popular-properties-scroll">
                {properties.map((property) => (
                    <div className="popular-properties-item" key={property.id}>
                        <PropertyCard property={property} />
                    </div>
                ))}
            </div>
        </section>
    );

}

export default PopularProperties;

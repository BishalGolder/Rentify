import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles/profile-property.css";

const PIN_ICON = L.divIcon({
    className: "",
    html: `<div style="
        width:22px;height:22px;border-radius:50%;
        background:#ef4444;border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);">
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
});

const PROPERTY_ICON = L.divIcon({
    className: "",
    html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:#10b981;border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);">
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});

const DHAKA_CENTER = [23.8103, 90.4125];

function ClickHandler({ onPick }) {
    useMapEvents({
        click(e) { onPick(e.latlng); }
    });
    return null;
}

function MapSearch() {
    const navigate = useNavigate();
    const [pin, setPin] = useState(null);
    const [radius, setRadius] = useState(5);
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const handlePick = async (latlng) => {
        setPin(latlng);
        setSearching(true);
        try {
            const res = await fetch(
                `http://localhost:5000/api/properties/nearby?lat=${latlng.lat}&lng=${latlng.lng}&radius=${radius}`
            );
            setResults(res.ok ? await res.json() : []);
        } catch (error) {
            console.error("Nearby search error:", error);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="ui-card">
                <h2>Search Properties on the Map</h2>
                <p style={{ color: "var(--text-muted)" }}>
                    Click anywhere on the map to drop a pin — properties within {radius} km will be listed below.
                </p>

                <label style={{ display: "block", margin: "0.5rem 0 1rem" }}>
                    Radius: {radius} km{" "}
                    <input
                        type="range" min="1" max="20" value={radius}
                        onChange={(e) => {
                            setRadius(Number(e.target.value));
                            if (pin) handlePick(pin);
                        }}
                    />
                </label>

                <div style={{ height: "420px", borderRadius: "10px", overflow: "hidden" }}>
                    <MapContainer center={DHAKA_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ClickHandler onPick={handlePick} />

                        {pin && (
                            <>
                                <Marker position={[pin.lat, pin.lng]} icon={PIN_ICON} />
                                <Circle center={[pin.lat, pin.lng]} radius={radius * 1000} />
                            </>
                        )}

                        {results.map((prop) => (
                            <Marker key={prop.id} position={[prop.latitude, prop.longitude]} icon={PROPERTY_ICON}>
                                <Popup>
                                    <strong>{prop.title}</strong><br />
                                    ৳{prop.price}/night<br />
                                    <button onClick={() => navigate(`/properties/${prop.id}`)}>
                                        View Details
                                    </button>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <h3 style={{ margin: "1.5rem 0 0.75rem" }}>
                    {pin ? `${results.length} propert${results.length === 1 ? "y" : "ies"} found` : "Click the map to search"}
                </h3>

                {searching ? (
                    <p>Searching...</p>
                ) : (
                    <div className="property-grid">
                        {results.map((prop) => (
                            <div
                                key={prop.id}
                                className="property-card"
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate(`/properties/${prop.id}`)}
                            >
                                <img
                                    src={prop.image_urls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
                                    alt={prop.title}
                                    className="property-img"
                                />
                                <div className="property-info">
                                    <div className="property-title">{prop.title}</div>
                                    <div className="property-price">৳{prop.price}/night</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MapSearch;
import { useState, useEffect } from "react";
import "../styles/profile-property.css";

function PropertyMarketplace() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProperties();
  }, []);

  const fetchPublicProperties = async () => {
    try {
      // Hits your public getAllProperties backend endpoint
      const response = await fetch("http://localhost:5000/api/properties");
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Error pulling marketplace properties:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-container">Loading available properties...</div>;

  return (
    <div className="dashboard-container" style={{ maxWidth: "1200px" }}>
      
      {/* Marketplace Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: 0, color: "var(--text-main)" }}>Explore Available Rentals</h2>
        <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 0 0" }}>
          Find your perfect stay with transparent rates and available services.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="ui-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", margin: 0 }}>
            No properties are currently listed.
          </p>
        </div>
      ) : (
        /* The Property Grid showing details & services */
        <div className="property-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {properties.map((property) => (
            <div key={property.id} className="property-card">
              
              {/* Property Cover Image */}
              <img 
                src={property.image_urls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"} 
                alt={property.title} 
                className="property-img" 
              />
              
              <div className="property-info">
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge">{property.property_type}</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>📍 {property.location}</span>
                  </div>
                  
                  <div className="property-title" style={{ marginTop: "0.5rem" }}>{property.title}</div>
                  
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.4", margin: "0.5rem 0" }}>
                    {property.description}
                  </p>
                  
                  {/* Services / Features Available */}
                  <div style={{ margin: "1rem 0 0.5rem 0" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                      Available Services:
                    </div>
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((service, index) => (
                        <span key={index} className="badge" style={{ background: "#f3f4f6", color: "#374151" }}>
                          ✓ {service}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Standard features included</span>
                    )}
                  </div>
                </div>

                {/* Pricing / Rate Section */}
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>RATE</span>
                    <span className="property-price">
                      ${property.price} <span style={{ fontSize: "0.8rem", fontWeight: "normal", color: "var(--text-muted)" }}>/ night</span>
                    </span>
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }} 
                    onClick={() => alert(`Booking process for "${property.title}" coming soon!`)}
                  >
                    Book Stay
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PropertyMarketplace;
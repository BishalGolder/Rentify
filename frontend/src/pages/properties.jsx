import { useState, useEffect } from "react";
import "../styles/profile-property.css";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [userRole, setUserRole] = useState("user");

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    property_type: "Apartment",
    price: "",
    amenities: "",
    image_url: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Check role from stored user profile
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed?.user_metadata?.role || "user");
    }

    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // If Host, fetch their specific properties, otherwise public feed[cite: 9]
      const endpoint = userRole === "host" 
        ? "http://localhost:5000/api/properties/host/my-properties" 
        : "http://localhost:5000/api/properties";

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(endpoint, { headers });
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (err) {
      console.error("Error fetching properties", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convert comma-separated string to arrays
    const formattedData = {
      ...formData,
      price: parseFloat(formData.price),
      amenities: formData.amenities.split(",").map(i => i.trim()),
      image_urls: formData.image_url ? [formData.image_url] : []
    };

    try {
      const response = await fetch("http://localhost:5000/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      });

      if (response.ok) {
        alert("Property Listed Successfully!");
        setIsAdding(false);
        setFormData({ title: "", description: "", location: "", property_type: "Apartment", price: "", amenities: "", image_url: "" });
        fetchProperties(); // Refresh list
      } else {
        const errData = await response.json();
        alert(errData.message || "Failed to list property");
      }
    } catch (err) {
      alert("Network Error listing property.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/properties/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert("Property deleted!");
        fetchProperties(); // Refresh lists
      }
    } catch (err) {
      alert("Error deleting property");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        
        {/* Left Column: List Property form (Only visible to Hosts) */}
        {userRole === "host" && (
          <div className="ui-card">
            <h2>{isAdding ? "Cancel Listing" : "List a Property"}</h2>
            {!isAdding ? (
              <div>
                <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                  Ready to make some passive income? List your rental details here.
                </p>
                <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                  Create New Listing
                </button>
              </div>
            ) : (
              <form className="ui-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Property Type</label>
                  <select name="property_type" value={formData.property_type} onChange={handleInputChange}>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Condo">Condo</option>
                    <option value="Studio">Studio</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (per Night/Month)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Amenities (Comma Separated)</label>
                  <input type="text" name="amenities" placeholder="Wifi, Pool, Parking, AC" value={formData.amenities} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Cover Image URL</label>
                  <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="https://..." />
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary">Post Listing</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Right Column (or Full Screen if Guest): Properties Display Feed */}
        <div className="ui-card" style={{ gridColumn: userRole !== "host" ? "1 / -1" : "" }}>
          <h2>{userRole === "host" ? "My Listings" : "Explore Properties"}</h2>
          {loading ? (
            <p>Loading properties...</p>
          ) : properties.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No properties posted yet.</p>
          ) : (
            <div className="property-grid">
              {properties.map((prop) => (
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
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.5rem 0" }}>
                        📍 {prop.location}
                      </p>
                      <p style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                        {prop.description}
                      </p>
                      <div style={{ margin: "0.5rem 0" }}>
                        {prop.amenities?.map((amenity, index) => (
                          <span key={index} className="badge" style={{ background: "#f3f4f6", color: "#374151" }}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="property-price">${prop.price} <span style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>val / period</span></div>
                      {userRole === "host" && (
                        <div className="property-actions">
                          <button onClick={() => handleDelete(prop.id)} className="btn btn-danger" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", width: "100%" }}>
                            Delete Listing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Properties;
import { useState, useEffect } from "react";
import "../styles/profile-property.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    role: "user"
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/profiles/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          role: data.role || "user"
        });
      } else {
        // If not found, they likely need to create one
        setProfile(null);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
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

    const method = profile ? "PUT" : "POST";
    const url = profile 
      ? "http://localhost:5000/api/profiles/me" 
      : "http://localhost:5000/api/profiles";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (response.ok) {
        alert("Profile saved successfully!");
        setProfile(result.profile);
        setIsEditing(false);
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch (err) {
      alert("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-container">Loading Profile...</div>;

  return (
    <div className="dashboard-container">
      <div className="ui-card">
        <h2>User Profile</h2>

        {(!profile || isEditing) ? (
          <form className="ui-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Avatar/Profile Picture URL</label>
              <input
                type="text"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="form-group">
              <label>Account Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange}>
                <option value="user">Guest (Booker)</option>
                <option value="host">Host (Lister)</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button type="submit" className="btn btn-primary">Save Profile</button>
              {profile && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="profile-view">
            <div className="avatar-wrapper">
              <img 
                src={profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                alt="Profile Avatar" 
              />
            </div>
            <h3>{profile.full_name}</h3>
            
            <div className="profile-details">
              <div className="profile-field">
                <span className="label">Phone:</span>
                <span className="val">{profile.phone || "Not set"}</span>
              </div>
              <div className="profile-field">
                <span className="label">Role:</span>
                <span className="val" style={{ textTransform: "capitalize" }}>
                  {profile.role}
                </span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ marginTop: "1.5rem", width: "100%" }}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
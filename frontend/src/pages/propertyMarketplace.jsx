import { useState, useEffect } from "react";
import PropertyCard from "../components/propertyCard";
import "../styles/propertyMarketplace.css";

function PropertyMarketplace() {
    // 1. Manage properties dynamically from your live backend instead of hardcoded data
    const [propertiesList, setPropertiesList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // 2. Fetch properties from the backend based on search terms
    useEffect(() => {
        const fetchFilteredProperties = async () => {
            try {
                setLoading(true);
                // Hits your new backend search endpoint
                const response = await fetch(`http://localhost:5000/api/properties/search?q=${searchQuery}`);
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    setPropertiesList(data);
                }
            } catch (error) {
                console.error("Error fetching filtered properties:", error);
            } finally {
                setLoading(false);
            }
        };

        // Optional: Simple 300ms debounce to avoid overwhelming your backend database while typing
        const delayDebounceFn = setTimeout(() => {
            fetchFilteredProperties();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    return (
        <div className="marketplace">
            <h1>Available Properties</h1>
            <p>Find your perfect stay.</p>

            {/* 3. The Live Search Bar Input Component */}
            <div className="search-container" style={{ margin: "20px 0", width: "100%", maxWidth: "400px" }}>
                <input
                    type="text"
                    placeholder="Search by title, location, type, district..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: "16px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        boxSizing: "border-box"
                    }}
                />
            </div>

            {/* 4. Conditional UI Rendering for data state changes */}
            {loading ? (
                <p>Searching database...</p>
            ) : propertiesList.length === 0 ? (
                <p>No properties match your search parameters.</p>
            ) : (
                <div className="property-grid">
                    {propertiesList.map((property) => (
                        <PropertyCard
                            key={property.id || property.property_id} // Fallback to whatever unique primary key column your teammate used
                            property={property}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default PropertyMarketplace;
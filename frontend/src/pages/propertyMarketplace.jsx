import { useState, useEffect } from "react";
import PropertyCard from "../components/propertyCard";
import "../styles/propertyMarketplace.css";

function PropertyMarketplace() {
    // State
    const [propertiesList, setPropertiesList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [district, setDistrict] = useState("");
    const [propertyType, setPropertyType] = useState(""); // NEW
    const [sort, setSort] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch properties
    useEffect(() => {
        const fetchFilteredProperties = async () => {
            try {
                setLoading(true);

                const response = await fetch(
                    `http://localhost:5000/api/properties/search?q=${searchQuery}&district=${district}&propertyType=${propertyType}&sort=${sort}`
                );

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

        const delayDebounceFn = setTimeout(() => {
            fetchFilteredProperties();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, district, propertyType, sort]); // UPDATED

    return (
        <div className="marketplace">
            <h1>Available Properties</h1>
            <p>Find your perfect stay.</p>

            {/* Search Bar */}
            <div
                className="search-container"
                style={{
                    margin: "20px 0",
                    width: "100%",
                    maxWidth: "400px",
                }}
            >
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
                        boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Filter & Sort Section */}
            <div
                style={{
                    display: "flex",
                    gap: "15px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                }}
            >
                {/* District Filter */}
                <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{
                        padding: "10px",
                        borderRadius: "6px",
                    }}
                >
                    <option value="">All Districts</option>
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chattogram">Chattogram</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barishal">Barishal</option>
                </select>

                {/* Property Type Filter */}
                <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    style={{
                        padding: "10px",
                        borderRadius: "6px",
                    }}
                >
                    <option value="">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Hotel">Hotel</option>
                </select>

                {/* Sort */}
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{
                        padding: "10px",
                        borderRadius: "6px",
                    }}
                >
                    <option value="">Newest</option>
                    <option value="price_low">
                        Price: Low → High
                    </option>
                    <option value="price_high">
                        Price: High → Low
                    </option>
                </select>
            </div>

            {/* Property List */}
            {loading ? (
                <p>Searching database...</p>
            ) : propertiesList.length === 0 ? (
                <p>No properties match your search parameters.</p>
            ) : (
                <div className="property-grid">
                    {propertiesList.map((property) => (
                        <PropertyCard
                            key={property.id || property.property_id}
                            property={property}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default PropertyMarketplace;
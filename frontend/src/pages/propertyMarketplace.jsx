import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../components/propertyCard";
import "../styles/propertyMarketplace.css";
import RecentlyViewed from "../components/recentlyViewed";
import CompareBar from "../components/compareBar";

function PropertyMarketplace() {
    // Existing State
    const [propertiesList, setPropertiesList] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [district, setDistrict] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [sort, setSort] = useState("");
    const [loading, setLoading] = useState(true);

    // Filter States
    const [minBedrooms, setMinBedrooms] = useState("");
    const [minBathrooms, setMinBathrooms] = useState("");
    const [minGuests, setMinGuests] = useState("");

    const navigate = useNavigate();

    // Fetch properties
    useEffect(() => {
        const fetchFilteredProperties = async () => {
            try {
                setLoading(true);

                const response = await fetch(
                    `http://localhost:5000/api/properties/search?q=${searchQuery}&district=${district}&propertyType=${propertyType}&sort=${sort}&minBedrooms=${minBedrooms}&minBathrooms=${minBathrooms}&minGuests=${minGuests}`
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
    }, [
        searchQuery, 
        district, 
        propertyType, 
        sort, 
        minBedrooms, 
        minBathrooms, 
        minGuests
    ]);

    return (
        <div className="marketplace">
            <h1>Available Properties</h1>
            <p>Find your perfect stay.</p>
            <RecentlyViewed />

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
                    alignItems: "center"
                }}
            >
                {/* District Filter */}
                <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px" }}
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
                    style={{ padding: "10px", borderRadius: "6px" }}
                >
                    <option value="">All Types</option>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Villa">Villa</option>
                    <option value="Hotel">Hotel</option>
                </select>

                {/* Min Bedrooms Filter */}
                <select
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px" }}
                >
                    <option value="">Any Bedrooms</option>
                    <option value="1">1+ Bedroom</option>
                    <option value="2">2+ Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                </select>

                {/* Min Bathrooms Filter */}
                <select
                    value={minBathrooms}
                    onChange={(e) => setMinBathrooms(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px" }}
                >
                    <option value="">Any Bathrooms</option>
                    <option value="1">1+ Bathroom</option>
                    <option value="2">2+ Bathrooms</option>
                    <option value="3">3+ Bathrooms</option>
                </select>

                {/* Min Guests Filter */}
                <select
                    value={minGuests}
                    onChange={(e) => setMinGuests(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px" }}
                >
                    <option value="">Any Guests</option>
                    <option value="2">2+ Guests</option>
                    <option value="4">4+ Guests</option>
                    <option value="6">6+ Guests</option>
                </select>

                {/* Sort (Added Top Rated option here) */}
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px" }}
                >
                    <option value="">Newest</option>
                    <option value="top_rated">Top Rated ⭐</option>
                    <option value="price_low">Price: Low → High</option>
                    <option value="price_high">Price: High → Low</option>
                </select>

                {/* Map Search Button */}
<button
    onClick={() => navigate("/map-search")}
    style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--primary-color)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "0.6rem 1.2rem",
        fontSize: "1rem",
        fontWeight: 600,
        cursor: "pointer"
    }}
>
    📍 Search on Map
</button>

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

            <CompareBar />
        </div>
    );
}

export default PropertyMarketplace;
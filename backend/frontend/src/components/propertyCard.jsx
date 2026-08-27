import "../styles/propertyCard.css";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { checkWishlist, addToWishlist, removeFromWishlist } from "../hooks/useWishlist";
import { useCompare } from "../context/CompareContext";

function PropertyCard({ property }) {
      const navigate = useNavigate();
    const [inWishlist, setInWishlist] = useState(false);
    const [wishlistId, setWishlistId] = useState(null);
    const isLoggedIn = !!localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const isGuest = isLoggedIn && storedUser?.role === "guest";
    const { isComparing, toggleCompare } = useCompare();
    const propId = property.id || property.property_id;
 
    useEffect(() => {
        if (!isGuest) return;
        checkWishlist(propId).then((res) => {

            setInWishlist(res.inWishlist);
            setWishlistId(res.wishlistId);
        });
    }, [property]);

    const toggleWishlist = async (e) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            alert("Please log in to save properties.");
            return;
        }
        if (!isGuest) {
            alert("Wishlist is only available for guest accounts.");
            return;
        }

        if (inWishlist) {
            const ok = await removeFromWishlist(wishlistId);
            if (ok) { setInWishlist(false); setWishlistId(null); }
        } else {
            const ok = await addToWishlist(propId);
            if (ok) {
                setInWishlist(true);
                const res = await checkWishlist(propId);
                setWishlistId(res.wishlistId);
            }
        }
    };

    return (
        <div className="property-card" style={{ position: "relative" }}>

             {isGuest && (
                <button
                    onClick={toggleWishlist}
                    style={{
                        position: "absolute", top: "10px", right: "10px", zIndex: 2,
                        border: "none", background: "rgba(255,255,255,0.9)", borderRadius: "50%",
                        width: "34px", height: "34px", cursor: "pointer", fontSize: "1.1rem"
                    }}
                    aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                    {inWishlist ? "❤️" : "🤍"}
                </button>
            )}


            <img
                src={property.image}
                alt={property.title}
            />

            <div className="property-content">

                <h3>{property.title}</h3>

                <p className="location">
                    📍 {property.location}
                </p>

                <div className="rating">
                    ⭐ {property.rating}
                </div>

                <div className="details">

                    <span>{property.bedrooms} Bedroom</span>

                    <span>{property.bathrooms} Bathroom</span>

                    <span>{property.guests} Guests</span>

                </div>

                <div className="amenities">

                    {property.amenities.map((item) => (

                        <span key={item}>
                            {item}
                        </span>

                    ))}

                </div>

                <div className="bottom">

                    <h2>৳ {property.price}/night</h2>

                    <button onClick={() => navigate(`/properties/${propId}`)}>
                        View Details
                    </button>

                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "0.85rem" }}>
                    <input
                        type="checkbox"
                        checked={isComparing(propId)}
                        onChange={() => toggleCompare(property)}
                    />
                    Add to Compare
                </label>

            </div>

        </div>
    );
}

export default PropertyCard;
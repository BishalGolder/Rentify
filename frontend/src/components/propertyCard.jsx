import "../styles/PropertyCard.css";

function PropertyCard({ property }) {

    return (

        <div className="property-card">

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

                    <button>
                        View Details
                    </button>

                </div>

            </div>

        </div>

    );

}

export default PropertyCard;
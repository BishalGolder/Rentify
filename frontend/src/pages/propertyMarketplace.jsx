import properties from "../data/properties";
import PropertyCard from "../components/propertyCard";
import "../styles/propertyMarketplace.css";

function PropertyMarketplace(){

    return(

        <div className="marketplace">

            <h1>Available Properties</h1>

            <p>Find your perfect stay.</p>

            <div className="property-grid">

                {properties.map(property=>(
                    <PropertyCard
                        key={property.id}
                        property={property}
                    />
                ))}

            </div>

        </div>

    )

}

export default PropertyMarketplace;
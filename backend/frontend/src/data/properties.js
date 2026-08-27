import room1 from "../assets/properties/room1.jpg";
import room2 from "../assets/properties/room2.jpg";
import room3 from "../assets/properties/room3.png";
import room4 from "../assets/properties/room4.jpg";

const properties = [

    {
        id: 1,
        title: "Luxury Deluxe Room",
        location: "Dhanmondi, Dhaka",
        price: 4500,
        rating: 4.8,
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        image: room1,
        amenities: [
            "WiFi",
            "AC",
            "TV",
            "Breakfast",
            "Parking",
            "Coffee"
        ]
    },

    {
        id: 2,
        title: "Modern Family Suite",
        location: "Gulshan, Dhaka",
        price: 6200,
        rating: 4.9,
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        image: room2,
        amenities: [
            "WiFi",
            "Kitchen",
            "Parking",
            "Pool",
            "Window-View"
        ]
    },

    {
        id: 3,
        title: "Premium City View Apartment",
        location: "Banani, Dhaka",
        price: 6000,
        rating: 5.0,
        guests: 2,
        bedrooms: 2,
        bathrooms: 2,
        image: room3,
        amenities: [
            "WiFi",
            "AC",
            "Balcony",
            "Gym"
        ]
    },

    {
        id: 4,
        title: "Executive Business Room",
        location: "Uttara, Dhaka",
        price: 3700,
        rating: 4.6,
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        image: room4,
        amenities: [
            "WiFi",
            "Workspace",
            "Parking"
        ]
    }

];

export default properties;
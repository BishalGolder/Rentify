import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/addProperty.css";


function AddProperty() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        house_no: "",
        road: "",
        upazila: "",
        district: "",
        property_type: "",
        price: "",
        bedrooms: "",
        bathrooms: "",
        living_rooms: "",
        kitchens: "",
        maximum_guests: "",
        amenities: []
    });

    const [images, setImages] = useState([]);


    /*
    =====================================================
    HANDLE INPUT CHANGE
    =====================================================
    */

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

    };


    /*
    =====================================================
    HANDLE AMENITIES
    =====================================================
    */

    const handleAmenityChange = (e) => {

        const { value, checked } = e.target;

        setFormData((previous) => {

            if (checked) {

                return {
                    ...previous,

                    amenities: [
                        ...previous.amenities,
                        value
                    ]
                };

            }

            return {
                ...previous,

                amenities:
                    previous.amenities.filter(
                        (amenity) =>
                            amenity !== value
                    )
            };

        });

    };


    /*
    =====================================================
    HANDLE IMAGES
    =====================================================
    */

    const handleImagesChange = (e) => {

        const selectedFiles =
            Array.from(e.target.files);

        if (selectedFiles.length === 0) {
            return;
        }


        if (selectedFiles.length > 10) {

            alert(
                "You can upload a maximum of 10 images."
            );

            e.target.value = "";

            return;
        }


        setImages(selectedFiles);

    };


    /*
    =====================================================
    SUBMIT PROPERTY
    =====================================================
    */

    const handleSubmit = async (e) => {

        e.preventDefault();


        /*
        =================================================
        CHECK LOGIN
        =================================================
        */

        const token =
            localStorage.getItem("token");

        const storedUser =
            localStorage.getItem("user");


        if (!token || !storedUser) {

            alert(
                "Your session has expired. Please login again."
            );

            navigate("/login");

            return;
        }


        /*
        =================================================
        CHECK HOST ROLE
        =================================================
        */

        try {

            const user =
                JSON.parse(storedUser);

            if (user.role !== "host") {

                alert(
                    "Only hosts can add properties."
                );

                navigate("/dashboard");

                return;
            }

        } catch (error) {

            console.error(
                "User information error:",
                error
            );

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login");

            return;
        }


        /*
        =================================================
        CHECK IMAGES
        =================================================
        */

        if (images.length === 0) {

            alert(
                "Please upload at least one property image."
            );

            return;
        }


        try {

            setLoading(true);


            /*
            =================================================
            CREATE FORM DATA
            =================================================
            */

            const data =
                new FormData();


            /*
            =================================================
            PROPERTY INFORMATION
            =================================================
            */

            data.append(
                "title",
                formData.title
            );

            data.append(
                "description",
                formData.description
            );

            data.append(
                "house_no",
                formData.house_no
            );

            data.append(
                "road",
                formData.road
            );

            data.append(
                "upazila",
                formData.upazila
            );

            data.append(
                "district",
                formData.district
            );

            data.append(
                "property_type",
                formData.property_type
            );

            data.append(
                "price",
                formData.price
            );

            data.append(
                "bedrooms",
                formData.bedrooms
            );

            data.append(
                "bathrooms",
                formData.bathrooms
            );

            data.append(
                "living_rooms",
                formData.living_rooms
            );

            data.append(
                "kitchens",
                formData.kitchens
            );

            data.append(
                "maximum_guests",
                formData.maximum_guests
            );


            /*
            =================================================
            AMENITIES
            =================================================
            */

            data.append(
                "amenities",
                JSON.stringify(
                    formData.amenities
                )
            );


            /*
            =================================================
            IMAGES
            =================================================
            */

            images.forEach((image) => {

                data.append(
                    "images",
                    image
                );

            });


            /*
            =================================================
            SEND PROPERTY REQUEST
            =================================================
            */

            const response =
                await fetch(
                    "http://localhost:5000/api/properties",
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body: data
                    }
                );


            /*
            =================================================
            READ RESPONSE SAFELY
            =================================================
            */

            let result = {};

            const responseText =
                await response.text();


            try {

                result =
                    responseText
                        ? JSON.parse(responseText)
                        : {};

            } catch (error) {

                console.error(
                    "Invalid server response:",
                    responseText
                );

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            /*
            =================================================
            CHECK SERVER ERROR
            =================================================
            */

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Failed to submit property."
                );

            }


            /*
            =================================================
            SUCCESS
            =================================================
            */

            alert(
                "Property submitted successfully! Your property is now pending admin verification."
            );


            navigate(
                "/dashboard",
                {
                    replace: true
                }
            );


        } catch (error) {

            console.error(
                "Add property error:",
                error
            );


            alert(
                error.message ||
                "Something went wrong while adding the property."
            );


        } finally {

            setLoading(false);

        }

    };


    /*
    =====================================================
    CANCEL
    =====================================================
    */

    const handleCancel = () => {

        navigate(
            "/dashboard"
        );

    };


    /*
    =====================================================
    UI
    =====================================================
    */

    return (

        <div className="add-property-page">

            <div className="add-property-container">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="add-property-header">

                    <button
                        type="button"
                        className="back-button"
                        onClick={handleCancel}
                    >

                        ← Back to Dashboard

                    </button>


                    <h1>
                        Add Your Property
                    </h1>


                    <p>
                        Provide the details of your property
                        so guests can find it on Rentify.
                    </p>

                </div>


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    className="add-property-form"
                    onSubmit={handleSubmit}
                >


                    {/* =================================================
                        BASIC INFORMATION
                    ================================================= */}

                    <div className="form-section">

                        <h2>
                            Basic Information
                        </h2>


                        <div className="form-group">

                            <label>
                                Property Title *
                            </label>

                            <input
                                type="text"
                                name="title"
                                placeholder="Example: Beautiful Apartment in Dhanmondi"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Description
                            </label>

                            <textarea
                                name="description"
                                placeholder="Describe your property..."
                                value={formData.description}
                                onChange={handleChange}
                                rows="5"
                            />

                        </div>


                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Property Type *
                                </label>

                                <select
                                    name="property_type"
                                    value={formData.property_type}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select property type
                                    </option>

                                    <option value="apartment">
                                        Apartment
                                    </option>

                                    <option value="house">
                                        House
                                    </option>

                                    <option value="villa">
                                        Villa
                                    </option>

                                    <option value="hotel">
                                        Hotel
                                    </option>

                                </select>

                            </div>


                            <div className="form-group">

                                <label>
                                    Price Per Night (৳) *
                                </label>

                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    placeholder="5000"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        LOCATION
                    ================================================= */}

                    <div className="form-section">

                        <h2>
                            Property Location
                        </h2>


                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    House No.
                                </label>

                                <input
                                    type="text"
                                    name="house_no"
                                    placeholder="House 12"
                                    value={formData.house_no}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Road
                                </label>

                                <input
                                    type="text"
                                    name="road"
                                    placeholder="Road 5"
                                    value={formData.road}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>


                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Upazila
                                </label>

                                <input
                                    type="text"
                                    name="upazila"
                                    placeholder="Example: Savar"
                                    value={formData.upazila}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    District *
                                </label>

                                <select
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        Select district
                                    </option>

                                    <option value="Dhaka">
                                        Dhaka
                                    </option>

                                    <option value="Chattogram">
                                        Chattogram
                                    </option>

                                    <option value="Cox's Bazar">
                                        Cox's Bazar
                                    </option>

                                    <option value="Sylhet">
                                        Sylhet
                                    </option>

                                    <option value="Rajshahi">
                                        Rajshahi
                                    </option>

                                    <option value="Khulna">
                                        Khulna
                                    </option>

                                    <option value="Barishal">
                                        Barishal
                                    </option>

                                    <option value="Rangpur">
                                        Rangpur
                                    </option>

                                    <option value="Mymensingh">
                                        Mymensingh
                                    </option>

                                    <option value="Cumilla">
                                        Cumilla
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        PROPERTY CAPACITY
                    ================================================= */}

                    <div className="form-section">

                        <h2>
                            Property Capacity
                        </h2>


                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Bedrooms *
                                </label>

                                <input
                                    type="number"
                                    name="bedrooms"
                                    min="1"
                                    placeholder="2"
                                    value={formData.bedrooms}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Bathrooms *
                                </label>

                                <input
                                    type="number"
                                    name="bathrooms"
                                    min="1"
                                    placeholder="2"
                                    value={formData.bathrooms}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Living Rooms
                                </label>

                                <input
                                    type="number"
                                    name="living_rooms"
                                    min="0"
                                    placeholder="1"
                                    value={formData.living_rooms}
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Kitchens
                                </label>

                                <input
                                    type="number"
                                    name="kitchens"
                                    min="0"
                                    placeholder="1"
                                    value={formData.kitchens}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>


                        <div className="form-group">

                            <label>
                                Maximum Guests *
                            </label>

                            <input
                                type="number"
                                name="maximum_guests"
                                min="1"
                                placeholder="4"
                                value={formData.maximum_guests}
                                onChange={handleChange}
                                required
                            />

                        </div>

                    </div>


                    {/* =================================================
                        AMENITIES
                    ================================================= */}

                    <div className="form-section">

                        <h2>
                            Amenities
                        </h2>


                        <p className="section-description">
                            Select the facilities available
                            at your property.
                        </p>


                        <div className="amenities-grid">


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="WiFi"
                                    checked={
                                        formData.amenities.includes(
                                            "WiFi"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    WiFi
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="Air Conditioning"
                                    checked={
                                        formData.amenities.includes(
                                            "Air Conditioning"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    Air Conditioning
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="Parking"
                                    checked={
                                        formData.amenities.includes(
                                            "Parking"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    Parking
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="Swimming Pool"
                                    checked={
                                        formData.amenities.includes(
                                            "Swimming Pool"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    Swimming Pool
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="Kitchen"
                                    checked={
                                        formData.amenities.includes(
                                            "Kitchen"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    Kitchen
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="TV"
                                    checked={
                                        formData.amenities.includes(
                                            "TV"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    TV
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="Washer"
                                    checked={
                                        formData.amenities.includes(
                                            "Washer"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    Washer
                                </span>

                            </label>


                            <label className="amenity-option">

                                <input
                                    type="checkbox"
                                    value="Breakfast"
                                    checked={
                                        formData.amenities.includes(
                                            "Breakfast"
                                        )
                                    }
                                    onChange={handleAmenityChange}
                                />

                                <span>
                                    Breakfast
                                </span>

                            </label>

                        </div>

                    </div>


                    {/* =================================================
                        IMAGES
                    ================================================= */}

                    <div className="form-section">

                        <h2>
                            Property Images
                        </h2>


                        <p className="section-description">
                            Upload at least one image of your
                            property. You can upload up to 10
                            images.
                        </p>


                        <div className="image-upload-box">

                            <input
                                type="file"
                                id="property-images"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                            />


                            <label
                                htmlFor="property-images"
                                className="image-upload-label"
                            >

                                📷

                                <strong>
                                    Choose Property Images
                                </strong>

                                <span>
                                    JPG, JPEG, PNG or WEBP
                                </span>

                            </label>

                        </div>


                        {images.length > 0 && (

                            <div className="selected-images">

                                <p>

                                    {images.length} image
                                    {images.length > 1 ? "s" : ""}
                                    {" "}selected

                                </p>


                                <div className="selected-image-list">

                                    {images.map(
                                        (image, index) => (

                                            <div
                                                className="selected-image"
                                                key={`${image.name}-${index}`}
                                            >

                                                <img
                                                    src={
                                                        URL.createObjectURL(
                                                            image
                                                        )
                                                    }
                                                    alt={
                                                        `Property ${index + 1}`
                                                    }
                                                />

                                                <span>
                                                    {image.name}
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        )}

                    </div>


                    {/* =================================================
                        VERIFICATION NOTICE
                    ================================================= */}

                    <div className="verification-notice">

                        <strong>
                            ⏳ Admin Verification
                        </strong>

                        <p>

                            After you submit your property,
                            it will be sent to the admin for
                            verification.

                            Your property will remain
                            <strong> pending </strong>
                            until the admin accepts it.

                        </p>

                    </div>


                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <div className="form-actions">

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >

                            {loading
                                ? "Submitting..."
                                : "Submit Property"}

                        </button>

                    </div>


                </form>

            </div>

        </div>

    );

}


export default AddProperty;
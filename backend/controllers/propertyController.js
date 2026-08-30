import * as PropertyModel from "../models/propertyModel.js";
import { createNotification } from "../models/notificationModel.js";
import supabase from "../config/supabaseClient.js";


/*
=====================================================
SUPABASE STORAGE CONFIGURATION
=====================================================
*/

const PROPERTY_BUCKET =
    process.env.SUPABASE_PROPERTY_BUCKET ||
    "property-images";


/*
=====================================================
CREATE PROPERTY
=====================================================

Host submits property.

Flow:

Host
 ↓
Upload images
 ↓
Create property
 ↓
Save image URLs
 ↓
verification_status = pending
 ↓
Admin verifies
=====================================================
*/

export const createProperty = async (req, res) => {

    try {

        /*
        ==============================================
        HOST
        ==============================================
        */

        const hostId =
            req.user.id;


        /*
        ==============================================
        FORM DATA
        ==============================================
        */

        let {

            title,
            description,

            house_no,
            road,
            upazila,
            district,

            latitude,
            longitude,

            property_type,

            price,
            bedrooms,
            bathrooms,
            living_rooms,
            kitchens,
            maximum_guests,

            amenities,
            image_urls

        } = req.body;


        /*
        ==============================================
        BASIC VALIDATION
        ==============================================
        */

        if (!title) {

            return res.status(400).json({

                message:
                    "Property title is required."

            });

        }


        if (!description) {

            return res.status(400).json({

                message:
                    "Property description is required."

            });

        }


        if (!district) {

            return res.status(400).json({

                message:
                    "District is required."

            });

        }


        if (!property_type) {

            return res.status(400).json({

                message:
                    "Property type is required."

            });

        }


        if (
            price === undefined ||
            price === null ||
            price === ""
        ) {

            return res.status(400).json({

                message:
                    "Price is required."

            });

        }


        if (!bedrooms) {

            return res.status(400).json({

                message:
                    "Number of bedrooms is required."

            });

        }


        if (!bathrooms) {

            return res.status(400).json({

                message:
                    "Number of bathrooms is required."

            });

        }


        if (!maximum_guests) {

            return res.status(400).json({

                message:
                    "Maximum guests is required."

            });

        }


        /*
        ==============================================
        LOCATION
        ==============================================
        */

        const locationParts = [

            house_no,
            road,
            upazila,
            district

        ]
            .map(value => {

                if (
                    value === undefined ||
                    value === null
                ) {

                    return "";

                }

                return String(value).trim();

            })
            .filter(
                value => value !== ""
            );


        const location =
            locationParts.join(", ");


        if (!location) {

            return res.status(400).json({

                message:
                    "Property location is required."

            });

        }


        /*
        ==============================================
        AMENITIES
        ==============================================
        */

        if (
            typeof amenities === "string"
        ) {

            try {

                amenities =
                    JSON.parse(
                        amenities
                    );

            } catch (error) {

                console.error(
                    "Amenities parse error:",
                    error
                );

                return res.status(400).json({

                    message:
                        "Invalid amenities format."

                });

            }

        }


        if (
            !Array.isArray(
                amenities
            )
        ) {

            amenities = [];

        }


        /*
        ==============================================
        EXISTING IMAGE URLS
        ==============================================
        */

        if (
            typeof image_urls === "string"
        ) {

            try {

                image_urls =
                    JSON.parse(
                        image_urls
                    );

            } catch {

                image_urls = [];

            }

        }


        if (
            !Array.isArray(
                image_urls
            )
        ) {

            image_urls = [];

        }


        /*
        ==============================================
        CHECK UPLOADED FILES
        ==============================================
        */

        const uploadedFiles =
            req.files || [];


        console.log(
            "Number of uploaded images:",
            uploadedFiles.length
        );


        if (
            uploadedFiles.length === 0 &&
            image_urls.length === 0
        ) {

            return res.status(400).json({

                message:
                    "Please upload at least one property image."

            });

        }


        /*
        ==============================================
        UPLOAD IMAGES TO SUPABASE STORAGE
        ==============================================
        */

        const uploadedImageUrls = [];


        for (
            const file of uploadedFiles
        ) {

            try {

                /*
                Unique file name
                */

                const fileExtension =
                    file.originalname
                        .split(".")
                        .pop()
                        .toLowerCase();


                const fileName =

                    `${hostId}/` +

                    `${Date.now()}-` +

                    `${Math.random()
                        .toString(36)
                        .substring(2, 10)}` +

                    `.${fileExtension}`;


                console.log(
                    "Uploading image:",
                    fileName
                );


                /*
                Upload to Supabase Storage
                */

                const {
                    error:
                        uploadError
                } =

                    await supabase
                        .storage
                        .from(
                            PROPERTY_BUCKET
                        )
                        .upload(

                            fileName,

                            file.buffer,

                            {

                                contentType:
                                    file.mimetype,

                                upsert:
                                    false

                            }

                        );


                if (
                    uploadError
                ) {

                    console.error(

                        "Supabase Storage Upload Error:",

                        uploadError

                    );


                    return res.status(400).json({

                        message:
                            `Image upload failed: ${uploadError.message}`

                    });

                }


                /*
                ==========================================
                GET PUBLIC URL
                ==========================================
                */

                const {
                    data:
                        publicUrlData
                } =

                    supabase
                        .storage
                        .from(
                            PROPERTY_BUCKET
                        )
                        .getPublicUrl(
                            fileName
                        );


                const publicUrl =
                    publicUrlData?.publicUrl;


                if (
                    !publicUrl
                ) {

                    return res.status(400).json({

                        message:
                            "Could not generate image URL."

                    });

                }


                console.log(
                    "Image URL:",
                    publicUrl
                );


                uploadedImageUrls.push(
                    publicUrl
                );


            } catch (imageError) {

                console.error(
                    "Image processing error:",
                    imageError
                );


                return res.status(500).json({

                    message:
                        "Failed to upload property image.",

                    error:
                        imageError.message

                });

            }

        }


        /*
        ==============================================
        COMBINE IMAGE URLS
        ==============================================
        */

        const finalImageUrls = [

            ...uploadedImageUrls,

            ...image_urls

        ];


        /*
        ==============================================
        PROPERTY DATA
        ==============================================
        */

        const propertyData = {

            host_id:
                hostId,

            title:
                title.trim(),

            description:
                description.trim(),

            location:
                location,

            house_no:
                house_no || null,

            road:
                road || null,

            upazila:
                upazila || null,

            district:
                district,

            latitude:
                latitude
                    ? Number(latitude)
                    : null,

            longitude:
                longitude
                    ? Number(longitude)
                    : null,

            property_type:
                property_type,

            price:
                Number(price),

            bedrooms:
                Number(bedrooms),

            bathrooms:
                Number(bathrooms),

            living_rooms:
                Number(
                    living_rooms || 1
                ),

            kitchens:
                Number(
                    kitchens || 1
                ),

            maximum_guests:
                Number(
                    maximum_guests
                ),

            amenities:
                amenities,

            /*
            IMPORTANT
            This now contains the actual
            Supabase Storage URLs.
            */

            image_urls:
                finalImageUrls,

            average_rating:
                0,

            verification_status:
                "pending"

        };


        /*
        ==============================================
        DEBUG
        ==============================================
        */

        console.log(
            "Creating property..."
        );

        console.log(
            "Location:",
            propertyData.location
        );

        console.log(
            "Amenities:",
            propertyData.amenities
        );

        console.log(
            "Image URLs:",
            propertyData.image_urls
        );


        /*
        ==============================================
        CREATE PROPERTY
        ==============================================
        */

        const {
            data,
            error
        } =
            await PropertyModel.createProperty(
                propertyData
            );


        if (error) {

            console.error(
                "Create Property Error:",
                error
            );

            return res.status(400).json({

                message:
                    error.message

            });

        }


        /*
        ==============================================
        OPTIONAL PROPERTY_IMAGES TABLE
        ==============================================
        
        Your existing search code already looks in
        property_images.

        Therefore we also insert the URLs there
        when that table exists.
        ==============================================
        */

        if (
            finalImageUrls.length > 0
        ) {

            const imageRows =
                finalImageUrls.map(
                    imageUrl => ({

                        property_id:
                            data.id,

                        image_url:
                            imageUrl

                    })
                );


            const {
                error:
                    imageTableError
            } =

                await supabase
                    .from(
                        "property_images"
                    )
                    .insert(
                        imageRows
                    );


            /*
            Do not fail the property creation if
            property_images table has a problem.

            The URLs are already stored in
            properties.image_urls.
            */

            if (
                imageTableError
            ) {

                console.error(

                    "Property images table error:",

                    imageTableError

                );

            }

        }


        /*
        ==============================================
        SUCCESS
        ==============================================
        */

        return res.status(201).json({

            message:
                "Property submitted successfully and is pending admin verification.",

            property:
                data

        });


    } catch (error) {

        console.error(
            "Create Property Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to create property.",

            error:
                error.message

        });

    }

};


/*
=====================================================
GET ALL VERIFIED PROPERTIES
=====================================================
*/

export const getAllProperties = async (
    req,
    res
) => {

    try {

        const {
            data,
            error
        } =
            await PropertyModel.getAllProperties();


        if (error) {

            return res.status(400).json({

                message:
                    error.message

            });

        }


        return res.json(
            data || []
        );


    } catch (error) {

        console.error(
            "Get All Properties Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to load properties."

        });

    }

};


/*
=====================================================
GET PROPERTY BY ID
=====================================================
*/

export const getPropertyById = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            data,
            error
        } =
            await PropertyModel.getPropertyById(
                id
            );


        if (error) {

            console.error(
                "Get Property Error:",
                error
            );

            return res.status(404).json({

                message:
                    "Property not found."

            });

        }


        return res.json(
            data
        );


    } catch (error) {

        console.error(
            "Get Property By ID Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to load property."

        });

    }

};


/*
=====================================================
GET HOST PROPERTIES
=====================================================
*/

export const getHostProperties = async (
    req,
    res
) => {

    try {

        const hostId =
            req.user.id;


        const {
            data,
            error
        } =
            await PropertyModel.getHostProperties(
                hostId
            );


        if (error) {

            console.error(
                "Get Host Properties Error:",
                error
            );

            return res.status(400).json({

                message:
                    error.message

            });

        }


        return res.json(
            data || []
        );


    } catch (error) {

        console.error(
            "Get Host Properties Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to load your properties."

        });

    }

};


/*
=====================================================
UPDATE PROPERTY
=====================================================
*/

export const updateProperty = async (
    req,
    res
) => {

    try {

        const hostId =
            req.user.id;

        const {
            id
        } = req.params;


        const {
            data,
            error
        } =
            await PropertyModel.updateProperty(
 
                id,
 
                hostId,
 
                req.body,
 
                req.supabase
 
            );



        if (error) {

            return res.status(400).json({

                message:
                    error.message

            });

        }


        return res.json({

            message:
                "Property updated successfully.",

            property:
                data

        });


    } catch (error) {

        console.error(
            "Update Property Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to update property."

        });

    }

};


/*
=====================================================
DELETE PROPERTY
=====================================================
*/

export const deleteProperty = async (
    req,
    res
) => {

    try {

        const hostId =
            req.user.id;

        const {
            id
        } = req.params;


        const {
            data,
            error
        } =
            await PropertyModel.deleteProperty(
                id,
                hostId,
                req.supabase


            );


        if (error) {

            return res.status(400).json({

                message:
                    error.message

            });

        }


        return res.json({

            message:
                "Property deleted successfully.",

            property:
                data

        });


    } catch (error) {

        console.error(
            "Delete Property Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to delete property."

        });

    }

};

/*
=====================================================
CANCEL PENDING PROPERTY REQUEST
=====================================================

Host can cancel their own property request only
while verification_status = pending.
=====================================================
*/

export const cancelPendingProperty = async (
    req,
    res
) => {

    try {

        const hostId =
            req.user.id;

        const {
            id
        } = req.params;


        /*
        ==============================================
        CANCEL PROPERTY
        ==============================================
        */

        const {
            data,
            error
        } =
            await PropertyModel.cancelPendingProperty(
                id,
                hostId
            );


        /*
        ==============================================
        ERROR
        ==============================================
        */

        if (error) {

            console.error(
                "Cancel Property Error:",
                error
            );

            return res.status(400).json({

                message:
                    "Property request could not be cancelled. It may have already been reviewed."

            });

        }


        /*
        ==============================================
        SUCCESS
        ==============================================
        */

        return res.json({

            message:
                "Property request cancelled successfully.",

            property:
                data

        });


    } catch (error) {

        console.error(
            "Cancel Property Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to cancel property request."

        });

    }

};

/*
=====================================================
GET PENDING PROPERTIES
=====================================================
*/

export const getPendingProperties = async (
    req,
    res
) => {

    try {

        const {
            data,
            error
        } =
            await PropertyModel.getPendingProperties();


        if (error) {

            return res.status(400).json({

                message:
                    error.message

            });

        }


        return res.json(
            data || []
        );


    } catch (error) {

        console.error(
            "Get Pending Properties Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to load pending properties."

        });

    }

};


/*
=====================================================
VERIFY PROPERTY
=====================================================
*/

export const verifyProperty = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            status,
            rejection_reason
        } = req.body;


        if (
            status !== "verified" &&
            status !== "rejected"
        ) {

            return res.status(400).json({

                message:
                    "Status must be verified or rejected."

            });

        }


        if (
            status === "rejected" &&
            !rejection_reason
        ) {

            return res.status(400).json({

                message:
                    "Rejection reason is required."

            });

        }


    const { data, error } = await PropertyModel.setVerificationStatus(
        id,
        status,
        status === "rejected" ? rejection_reason : null,
        req.supabase
    );
 
    if (error) {
        return res.status(409).json({
            message: "This property has already been reviewed, or does not exist."
        });
    }



        /*
        ==============================================
        HOST NOTIFICATION
        ==============================================
        */

        try {

            await createNotification({

                user_id:
                    data.host_id,

                type:
                    status === "verified"
                        ? "property_approved"
                        : "property_rejected",

                title:
                    status === "verified"
                        ? "Property Approved"
                        : "Property Rejected",

                message:
                    status === "verified"

                        ? `Your property "${data.title}" has been approved and is now visible to guests.`

                        : `Your property "${data.title}" was rejected. Reason: ${rejection_reason}`,

                related_entity_type:
                    "property",

                related_entity_id:
                    data.id

            });

        } catch (notificationError) {

            console.error(
                "Notification creation error:",
                notificationError
            );

        }


        return res.json({

            message:
                status === "verified"

                    ? "Property verified successfully."

                    : "Property rejected successfully.",

            property:
                data

        });


    } catch (error) {

        console.error(
            "Verify Property Error:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to verify property.",

            error:
                error.message

        });

    }

};


/*
=====================================================
GET NEARBY PROPERTIES
=====================================================

Fetches properties within a radius (in km) of a
given latitude/longitude.

Requires a PostGIS function `get_nearby_properties`
defined in the database.

Query parameters:
- lat: latitude (required)
- lng: longitude (required)
- radius: radius in km (optional, defaults to 5)
=====================================================
*/

export const getNearbyProperties = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
 
        if (!lat || !lng) {
            return res.status(400).json({ message: "lat and lng are required." });
        }
 
        const { data, error } = await supabase.rpc("get_nearby_properties", {
            p_lat: Number(lat),
            p_lng: Number(lng),
            p_radius_km: radius ? Number(radius) : 5
        });
 
        if (error) return res.status(400).json({ message: error.message });
 
        res.json(data || []);
    } catch (error) {
        console.error("Get Nearby Properties Error:", error);
        res.status(500).json({ message: "Failed to search nearby properties." });
    }
};

/*
=====================================================
ADMIN DELETE PROPERTY (Hard delete)
=====================================================

Admin can permanently delete any property.
=====================================================
*/

export const adminDeleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
 
        const { data, error } = await req.supabase
            .from("properties")
            .delete()
            .eq("id", id)
            .select()
            .single();
 
        if (error) {
            return res.status(400).json({ message: error.message });
        }
 
        return res.json({
            message: "Property deleted successfully.",
            property: data
        });
    } catch (error) {
        console.error("Admin Delete Property Error:", error);
        return res.status(500).json({ message: "Failed to delete property." });
    }
};

/*
=====================================================
ADMIN TOGGLE PROPERTY LOCK
=====================================================

Admin can lock/unlock a property.
Locked properties are hidden from search and booking.
=====================================================
*/

export const adminTogglePropertyLock = async (req, res) => {
    try {
        const { id } = req.params;
        const { lock } = req.body;
 
        if (typeof lock !== "boolean") {
            return res.status(400).json({ message: "lock must be true or false." });
        }
 
        const { data, error } = await req.supabase.rpc(
            "admin_toggle_property_lock",
            { p_property_id: id, p_lock: lock }
        );
 
        if (error) {
            return res.status(400).json({ message: error.message });
        }
 
        const result = Array.isArray(data) ? data[0] : data;
 
        // Notify the host
        await import("../models/notificationModel.js").then(({ createNotification }) =>
            createNotification({
                user_id: result.host_id,
                type: lock ? "property_locked" : "property_unlocked",
                title: lock ? "Property Locked" : "Property Unlocked",
                message: lock
                    ? `Your property "${result.title}" has been locked by an admin and is no longer visible to guests.`
                    : `Your property "${result.title}" has been unlocked and is now visible again.`,
                related_entity_type: "property",
                related_entity_id: result.id
            }, req.supabase)
        ).catch(() => {});
 
        return res.json({
            message: lock ? "Property locked." : "Property unlocked.",
            property: result
        });
 
    } catch (error) {
        console.error("Admin Toggle Property Lock Error:", error);
        return res.status(500).json({ message: "Failed to update property lock status." });
    }
};

/*
=====================================================
GET ALL PROPERTIES FOR ADMIN
=====================================================

Admin can view all properties (including locked ones)
with basic fields.
=====================================================
*/

export const getAllPropertiesForAdmin = async (req, res) => {
    try {
        const { serviceSupabase } = await import("../config/supabaseClient.js");
 
        if (!serviceSupabase) {
            return res.status(500).json({ message: "Service client not configured." });
        }
 
        const { data, error } = await serviceSupabase
            .from("properties")
            .select("id, title, host_id, verification_status, is_locked, price, location, image_urls")
            .order("created_at", { ascending: false });
 
        if (error) return res.status(400).json({ message: error.message });
 
        return res.json(data || []);
    } catch (error) {
        console.error("Get All Properties For Admin Error:", error);
        return res.status(500).json({ message: "Failed to load properties." });
    }
};

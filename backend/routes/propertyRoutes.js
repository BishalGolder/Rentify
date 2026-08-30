import express from "express";
import dotenv from "dotenv";
import multer from "multer";

import supabase from "../config/supabaseClient.js";

import authMiddleware from "../middleware/authMiddleware.js";
import hostMiddleware from "../middleware/hostMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import adminPropertyMiddleware from "../middleware/adminPropertyMiddleware.js";

import {
    createProperty,
    getAllProperties,
    getPropertyById,
    getHostProperties,
    updateProperty,
    deleteProperty,
    cancelPendingProperty,
    getPendingProperties,
    verifyProperty,
    getNearbyProperties,
    adminDeleteProperty,
    adminTogglePropertyLock,
    getAllPropertiesForAdmin
} from "../controllers/propertyController.js";


dotenv.config();

const router = express.Router();


/*
=====================================================
MULTER
=====================================================
*/

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {

        files: 10,

        fileSize:
            5 * 1024 * 1024

    },

    fileFilter: (
        req,
        file,
        cb
    ) => {

        if (
            file.mimetype &&
            file.mimetype.startsWith("image/")
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only image files are allowed."
                ),
                false
            );

        }

    }

});


/*
=====================================================
GET ALL VERIFIED PROPERTIES
=====================================================

Only verified properties are returned.

Guests and hosts can see
verified properties.

=====================================================
*/

router.get(

    "/",

    getAllProperties

);




/*
=====================================================
SEARCH / FILTER / SORT
=====================================================
*/

router.get(

    "/search",

    async (req, res) => {

        try {

            const searchTerm =
                req.query.q || "";

            const district =
                req.query.district || "";

            const propertyType =
                req.query.propertyType || "";

            const sort =
                req.query.sort || "";

            const minBedrooms =
                req.query.minBedrooms || "";

            const minBathrooms =
                req.query.minBathrooms || "";

            const minGuests =
                req.query.minGuests || "";


            let query =
                supabase
                    .from("properties")
                    .select("*")
                    .eq(
                        "verification_status",
                        "verified"
                    )
                    .or('is_locked.is.null,is_locked.eq.false');


            /*
            SEARCH TERM
            */

            if (
                searchTerm.trim() !== ""
            ) {

                query =
                    query.or(
                        `title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`
                    );

            }


            /*
            DISTRICT
            */

            if (
                district !== ""
            ) {

                query =
                    query.ilike(
                        "district",
                        `%${district}%`
                    );

            }


            /*
            PROPERTY TYPE
            */

            if (
                propertyType !== ""
            ) {

                query =
                    query.ilike(
                        "property_type",
                        `%${propertyType}%`
                    );

            }


            /*
            MINIMUM BEDROOMS
            */

            if (
                minBedrooms !== ""
            ) {

                query =
                    query.gte(
                        "bedrooms",
                        parseInt(
                            minBedrooms,
                            10
                        )
                    );

            }


            /*
            MINIMUM BATHROOMS
            */

            if (
                minBathrooms !== ""
            ) {

                query =
                    query.gte(
                        "bathrooms",
                        parseInt(
                            minBathrooms,
                            10
                        )
                    );

            }


            /*
            MINIMUM GUESTS
            */

            if (
                minGuests !== ""
            ) {

                query =
                    query.gte(
                        "maximum_guests",
                        parseInt(
                            minGuests,
                            10
                        )
                    );

            }


            /*
            SORT
            */

            switch (sort) {

                case "top_rated":

                    query =
                        query.order(
                            "average_rating",
                            {
                                ascending:
                                    false,

                                nullsFirst:
                                    false
                            }
                        );

                    break;


                case "price_low":

                    query =
                        query.order(
                            "price",
                            {
                                ascending:
                                    true
                            }
                        );

                    break;


                case "price_high":

                    query =
                        query.order(
                            "price",
                            {
                                ascending:
                                    false
                            }
                        );

                    break;


                default:

                    query =
                        query.order(
                            "created_at",
                            {
                                ascending:
                                    false
                            }
                        );

            }


            const {

                data:
                    properties,

                error

            } = await query;


            if (error) {

                console.error(
                    "Supabase Property Error:",
                    error
                );

                return res.status(500).json({

                    error:
                        error.message

                });

            }


            /*
            GET PROPERTY IDS
            */

            const propertyIds =
                properties.map(
                    property =>
                        property.id
                );


            let images = [];


            /*
            GET PROPERTY IMAGES
            */

            if (
                propertyIds.length > 0
            ) {

                const {

                    data:
                        imageData

                } =
                    await supabase
                        .from(
                            "property_images"
                        )
                        .select(
                            "property_id, image_url"
                        )
                        .in(
                            "property_id",
                            propertyIds
                        );


                images =
                    imageData || [];

            }


            /*
            FORMAT RESULT
            */

            const result =
                properties.map(
                    property => {

                        const propertyImage =
                            images.find(
                                image =>
                                    image.property_id ===
                                    property.id
                            );


                        return {

                            ...property,

                            image:
                                propertyImage?.image_url ||
                                property.image_urls?.[0] ||
                                null,

                            rating:
                                property.average_rating,

                            guests:
                                property.maximum_guests

                        };

                    }
                );


            res.json(
                result
            );


        } catch (error) {

            console.error(
                "Property Search Error:",
                error
            );


            res.status(500).json({

                error:
                    "Internal server error."

            });

        }

    }

);

/*
=====================================================
GET NEARBY PROPERTIES
=====================================================

Public route to find properties within a radius.

Query parameters:
  - lat (required)
  - lng (required)
  - radius (optional, defaults to 5 km)

=====================================================
*/

router.get("/nearby", getNearbyProperties);


/*
=====================================================
ADMIN
GET PENDING PROPERTIES
=====================================================

Only administrators can access this route.

Flow:

Admin
 ↓
authMiddleware
 ↓
adminMiddleware
 ↓
getPendingProperties()
 ↓
Return pending properties

=====================================================
*/

router.get(

    "/admin/pending",

    authMiddleware,

    adminMiddleware,

    getPendingProperties

);


/*
=====================================================
ADMIN
VERIFY / REJECT PROPERTY
=====================================================

Admin can:

verified
    OR
rejected

Only administrators can access this route.

=====================================================
*/

router.put(

    "/admin/:id/verify",

    authMiddleware,

    adminMiddleware,

    verifyProperty

);


/*
=====================================================
ADMIN
DELETE PROPERTY (Hard delete)
=====================================================

Admin can permanently delete any property.

=====================================================
*/

router.delete(
    "/admin/:id",
    authMiddleware,
    adminPropertyMiddleware,
    adminDeleteProperty
);


/*
=====================================================
ADMIN
LOCK / UNLOCK PROPERTY
=====================================================

Admin can toggle the lock status of a property.
Locked properties are hidden from guest searches.

=====================================================
*/

router.put(
    "/admin/:id/lock",
    authMiddleware,
    adminPropertyMiddleware,
    adminTogglePropertyLock
);


/*
=====================================================
GET HOST PROPERTIES
=====================================================
*/

router.get(

    "/host/my-properties",

    authMiddleware,

    hostMiddleware,

    getHostProperties

);


/*
=====================================================
CREATE PROPERTY
=====================================================

Frontend sends multipart/form-data.

Multer must run BEFORE createProperty.

=====================================================
*/

router.post(

    "/",

    authMiddleware,

    hostMiddleware,

    upload.array(
        "images",
        10
    ),

    createProperty

);


/*
=====================================================
CANCEL PENDING PROPERTY REQUEST
=====================================================

Host can cancel only their own
pending property request.

=====================================================
*/

router.delete(

    "/:id/cancel",

    authMiddleware,

    hostMiddleware,

    cancelPendingProperty

);


/*
=====================================================
GET SINGLE PROPERTY
=====================================================
*/

router.get(

    "/:id",

    getPropertyById

);


/*
=====================================================
UPDATE PROPERTY
=====================================================
*/

router.put(

    "/:id",

    authMiddleware,

    hostMiddleware,

    updateProperty

);


/*
=====================================================
DELETE PROPERTY (Host only)
=====================================================
*/

router.delete(

    "/:id",

    authMiddleware,

    hostMiddleware,

    deleteProperty

);

router.get("/admin/all", authMiddleware, adminPropertyMiddleware, getAllPropertiesForAdmin);


export default router;
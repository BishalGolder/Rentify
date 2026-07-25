import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Search + Filter + Sort Endpoint
router.get("/search", async (req, res) => {
  try {
    // Query Parameters
    const searchTerm = req.query.q || "";
    const district = req.query.district || "";
    const propertyType = req.query.propertyType || "";
    const sort = req.query.sort || "";

    const minBedrooms = req.query.minBedrooms || "";
    const minBathrooms = req.query.minBathrooms || "";
    const minGuests = req.query.minGuests || "";

    // Base Query
    let query = `
      SELECT
        p.*,
        (
          SELECT image_url
          FROM property_images
          WHERE property_id = p.id
          LIMIT 1
        ) AS image,
        p.average_rating AS rating,
        p.maximum_guests AS guests
      FROM properties p
      WHERE 1=1
    `;

    const queryParams = [];
    let index = 1;

    // Search
    if (searchTerm.trim() !== "") {
      query += `
        AND (
          p.title ILIKE $${index}
          OR p.location ILIKE $${index}
          OR p.property_type ILIKE $${index}
          OR p.district ILIKE $${index}
        )
      `;
      queryParams.push(`%${searchTerm}%`);
      index++;
    }

    // District Filter
    if (district !== "") {
      query += ` AND p.district ILIKE $${index}`;
      queryParams.push(`%${district}%`);
      index++;
    }

    // Property Type Filter
    if (propertyType !== "") {
      query += ` AND p.property_type ILIKE $${index}`;
      queryParams.push(`%${propertyType}%`);
      index++;
    }

    // Minimum Bedrooms Filter
    if (minBedrooms !== "") {
      query += ` AND p.bedrooms >= $${index}`;
      queryParams.push(parseInt(minBedrooms, 10));
      index++;
    }

    // Minimum Bathrooms Filter
    if (minBathrooms !== "") {
      query += ` AND p.bathrooms >= $${index}`;
      queryParams.push(parseInt(minBathrooms, 10));
      index++;
    }

    // Minimum Max Guests Capacity Filter
    if (minGuests !== "") {
      query += ` AND p.maximum_guests >= $${index}`;
      queryParams.push(parseInt(minGuests, 10));
      index++;
    }

    // Sorting (Added top_rated case)
    switch (sort) {
      case "top_rated":
        query += ` ORDER BY p.average_rating DESC NULLS LAST`;
        break;

      case "price_low":
        query += ` ORDER BY p.price ASC`;
        break;

      case "price_high":
        query += ` ORDER BY p.price DESC`;
        break;

      default:
        query += ` ORDER BY p.created_at DESC`;
    }

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error("Property Search Error:", error);

    res.status(500).json({
      error: "Internal server error.",
    });
  }
});

export default router;
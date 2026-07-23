import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize the database connection pool using your Supabase connection string
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

    // Sorting
    switch (sort) {
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
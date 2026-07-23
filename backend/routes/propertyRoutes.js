import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize the database connection pool using your Supabase connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for secure connections to Supabase
  }
});

// Search bar endpoint: GET /api/properties/search?q=your_search_term
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q || "";

    let query;
    let queryParams;

    if (searchTerm.trim() === "") {
      // Return all properties when no search term is provided
      query = `
        SELECT p.*,
               (SELECT image_url
                FROM property_images
                WHERE property_id = p.id
                LIMIT 1) AS image,
               p.average_rating AS rating,
               p.maximum_guests AS guests
        FROM properties p
        ORDER BY p.created_at DESC;
      `;
      queryParams = [];
    } else {
      // Search using ILIKE
      query = `
        SELECT p.*,
               (SELECT image_url
                FROM property_images
                WHERE property_id = p.id
                LIMIT 1) AS image,
               p.average_rating AS rating,
               p.maximum_guests AS guests
        FROM properties p
        WHERE p.title ILIKE $1
           OR p.location ILIKE $1
           OR p.property_type ILIKE $1
           OR p.district ILIKE $1
        ORDER BY p.created_at DESC;
      `;
      queryParams = [`%${searchTerm}%`];
    }

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (error) {
    console.error("Database search error detailed log:", error);
    res
      .status(500)
      .json({ error: "Internal server error during search optimization." });
  }
});

export default router;
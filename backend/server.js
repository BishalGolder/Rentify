import express from "express";
import cors from "cors"; // 1. Import CORS
import authRoutes from "./routes/authRoutes.js"; // Adjust relative path to your auth router

const app = express();

// 2. Enable CORS so React can talk to the backend
app.use(cors()); 

app.use(express.json());

// 3. Your routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
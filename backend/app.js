import express from "express";
import cors from "cors";

import propertyRoutes from "./routes/propertyRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/properties", propertyRoutes);
app.use("/api/profiles", profileRoutes);

export default app;
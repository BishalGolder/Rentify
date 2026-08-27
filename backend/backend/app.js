import express from "express";
import cors from "cors";

import propertyRoutes from "./routes/propertyRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/properties", propertyRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/availability", availabilityRoutes);

export default app;
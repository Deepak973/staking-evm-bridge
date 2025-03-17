import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import logger from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import { accessLogger } from "./middleware/accessLogger";
import { csrfProtection } from "./middleware/csrfProtection";
import cookieParser from "cookie-parser";
import { ContractEventService } from "./services/contractEventService";
dotenv.config();
const app: Application = express();

// Add access logging before other middleware
app.use(accessLogger);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000", // Use frontend origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT) || 15,
  message: "Too many requests. Please try again later.",
});
app.use(limiter);

app.use(cookieParser());
// Add after cookie parser and before routes
app.use(csrfProtection);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => logger.info("✅ MongoDB Connected"))
  .catch((err) => logger.error("❌ MongoDB Connection Error: ", err));

// Initialize contract event listener
const contractEventService = new ContractEventService();

// Routes
app.use("/api/auth", authRoutes);

// Global Error Handling
// app.use((err: any, req: any, res: any, next: any) => {
//   logger.error(`❌ Error: ${err.message}`);
//   res.status(500).json({ error: "Something went wrong!" });
// });

app.get("/", (req, res) => {
  res.send("All is well");
});
// Start Server
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

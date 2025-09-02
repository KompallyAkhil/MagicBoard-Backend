// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import solveRoutes from "./routes/solve.js"
import imageRoutes from "./routes/image.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://magic-board-frontend.vercel.app",
  "https://magic-board-chi.vercel.app",
  "https://magicboard.akhilkompally.app",
];

// Middleware
app.use(express.json({ limit: "10mb" }));
app.options("*", cors());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/solve", solveRoutes);
app.use("/generate-image-prompt", imageRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

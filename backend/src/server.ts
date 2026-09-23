import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import kitRoutes from "./routes/kit.routes.js";


dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());


app.use("/api/auth", authRoutes);

app.use("/api/kits", kitRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "trao-interview-kit-api",
  });
});

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

startServer();
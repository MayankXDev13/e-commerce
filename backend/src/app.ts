import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";

const app: Application = express();

// Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

import healthcheckRouter from "./routes/healthcheck.routes"

app.use("/api/v1/healthcheck", healthcheckRouter);


export default app;

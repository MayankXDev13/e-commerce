import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import morganMiddleware from "./logger/morgan.logger";
import { errorHandler } from "./middlewares/error.middlewares";

const app: Application = express();

// Middlewares
app.use(morganMiddleware);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/images", express.static("public/images"));

import healthcheckRouter from "./routes/healthcheck.routes";
import userRouter from "./routes/user.routes";
import categoryRouter from "./routes/category.routes";
import productRouter from "./routes/product.routes";
import addressRouter from "./routes/address.routes";
import cartRouter from "./routes/cart.routes";

app.use("/api/v1/ecommerce/healthcheck", healthcheckRouter);
app.use("/api/v1/ecommerce/users", userRouter);
app.use("/api/v1/ecommerce/categories", categoryRouter);
app.use("/api/v1/ecommerce/products", productRouter);
app.use("/api/v1/ecommerce/addresses", addressRouter);
app.use("/api/v1/ecommerce/cart", cartRouter);

app.use(errorHandler);

export default app;

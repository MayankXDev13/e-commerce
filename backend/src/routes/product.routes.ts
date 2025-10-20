import { Router } from "express";
import {
  createProduct,
  getAllProducts,
} from "../controllers/product.controller";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/multer.middlewares";

const router: Router = Router();

router
  .route("/")
  .get(getAllProducts)
  .post(
    verifyJWT,
    verifyPermission(["ADMIN"]),
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "subImages", maxCount: 5 },
    ]),
    createProduct
  );

export default router;

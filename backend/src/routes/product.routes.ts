import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  removeProductSubImage,
  updateProduct,
} from "../controllers/product.controller";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/multer.middlewares";
import { MAXIMUM_SUB_IMAGE_COUNT } from "../constants";

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

router
  .route("/:productId")
  .get(getProductById)
  .patch(
    verifyJWT,
    verifyPermission(["ADMIN"]),
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "subImages", maxCount: MAXIMUM_SUB_IMAGE_COUNT },
    ]),
    updateProduct
  )
  .delete(verifyJWT, verifyPermission(["ADMIN"]), deleteProduct);

  
router.route("/category/:categoryId").get(getProductsByCategory);

router
  .route("/remove/subimage/:productId/:subImageId")
  .patch(verifyJWT, verifyPermission(["ADMIN"]), removeProductSubImage);

export default router;

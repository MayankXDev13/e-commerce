import { Router } from "express";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares";
import {
  createCategory,
  getAllCategories,
  getCategoriesById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router: Router = Router();

router
  .route("/")
  .post(verifyJWT, verifyPermission(["ADMIN"]), createCategory)
  .get(getAllCategories);

router
  .route("/:categoryId")
  .get(getCategoriesById)
  .delete(verifyJWT, verifyPermission(["ADMIN"]), deleteCategory)
  .patch(verifyJWT, verifyPermission(["ADMIN"]), updateCategory);

export default router;

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import {
  addItemOrUpdateItemQuantity,
  clearCart,
  getUserCart,
  removeItemFromCart,
} from "../controllers/cart.controller";

const router: Router = Router();

router.use(verifyJWT);

router.route("/").get(getUserCart);

router.route("/clear").delete(clearCart);

router
  .route("/item/:productId")
  .post(addItemOrUpdateItemQuantity)
  .delete(removeItemFromCart);

export default router;

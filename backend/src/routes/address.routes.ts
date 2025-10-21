import { Router } from "express";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares";
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getAllAddresses,
  updateAddress,
} from "../controllers/address.controller";

const router: Router = Router();

router.use(verifyJWT);

router.route("/").post(createAddress).get(getAllAddresses);

router
  .route("/:addressId")
  .get(getAddressById)
  .delete(deleteAddress)
  .patch(updateAddress);

export default router;

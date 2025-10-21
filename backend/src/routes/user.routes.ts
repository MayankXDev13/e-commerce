import { Router } from "express";
import {
  assigneRole,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller";
import { verifyJWT, verifyPermission } from "../middlewares/auth.middlewares";

const router: Router = Router();

// Unsecured route
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router.route("/refresh").post(refreshAccessToken);


router.route("/assign-role/:userId").post(verifyJWT, assigneRole);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);

export default router;

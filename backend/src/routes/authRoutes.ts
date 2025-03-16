import express from "express";
import { verifyAuth, signOutUser } from "../controllers/authController";
import { validateAddress } from "../middleware/validation";

const router = express.Router();

router.post("/verify", validateAddress, verifyAuth);
router.post("/signout", signOutUser);

export default router;

import express from "express";
import { getNonce, verifyAuth } from "../controllers/authController";
import { validateAddress } from "../middleware/validation";

const router = express.Router();

router.get("/nonce/:address", validateAddress, getNonce);
router.post("/verify", validateAddress, verifyAuth);

export default router;

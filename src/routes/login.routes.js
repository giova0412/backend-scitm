import { Router } from "express";
import loginController from "../controllers/login.controller.js";

const router = Router();

router.post("/register", loginController.register);
router.post("/login", loginController.login);
router.post("/logout", loginController.logout);
router.post("/recuperar", loginController.recuperarPassword);
router.post("/reset-password", loginController.resetPassword);

export default router;

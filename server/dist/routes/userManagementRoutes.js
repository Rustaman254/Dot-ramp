import express from "express";
import { getUser, listUsers } from "../controller/userManagement";
import { requireAuth } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/users", requireAuth, listUsers);
router.get("/user/:contact", requireAuth, getUser);
export default router;
//# sourceMappingURL=userManagementRoutes.js.map
// routes/authRoutes.ts
import express from 'express';
import { login, recover, register, resetPassword } from '../controller/autController';
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/recover', recover);
router.post('/reset-password', resetPassword);
export default router;
//# sourceMappingURL=authRouter.js.map
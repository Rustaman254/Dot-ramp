import express from 'express';
import { mpesaController } from '../controller/mpesaController.js';
const router = express.Router();
router.post('/stk-push', mpesaController);
export default router;
//# sourceMappingURL=mpesaRoutes.js.map
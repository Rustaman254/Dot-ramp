import express from 'express';
import { mpesaController, callbackUrlController, mpesaStatusController } from '../controller/mpesaController.js';

const router = express.Router();

router.post('/stk-push', mpesaController);
router.post('/callback', callbackUrlController);
router.get("/status", mpesaStatusController);


export default router;
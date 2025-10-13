import express from 'express';
import { mpesaController, callbackUrlController, mpesaStatusController, payout } from '../controller/mpesaController.js';

const router = express.Router();

router.post('/stk-push', mpesaController);
router.post('/callback', callbackUrlController);
router.get("/status", mpesaStatusController);
router.post("/payout", payout);



export default router;
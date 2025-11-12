import express, { Router } from 'express';
import { mpesaController, callbackUrlController, mpesaStatusController, payout } from '../controller/mpesaController.js';

const router: Router = express.Router();

router.post('/stk-push', mpesaController);
router.post('/callback', callbackUrlController);
router.get("/status", mpesaStatusController);
router.post("/payout", payout);

export default router;

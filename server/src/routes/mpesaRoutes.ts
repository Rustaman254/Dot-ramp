import express from 'express';
import { mpesaController, callbackUrlController } from '../controller/mpesaController.js';

const router = express.Router();

router.post('/stk-push', mpesaController);
router.post('/callback', callbackUrlController);


export default router;
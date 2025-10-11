import express from "express";
import { buyStablecoin, sellStablecoin, depositConfirm, fiatConfirm, dispute, resolve, } from "../controller/p2pEscrowController";
const router = express.Router();
router.post("/buy-stablecoin", buyStablecoin);
router.post("/sell-stablecoin", sellStablecoin);
router.post("/:orderId/deposit-confirm", depositConfirm);
router.post("/:orderId/fiat-confirm", fiatConfirm);
router.post("/:orderId/dispute", dispute);
router.post("/:orderId/resolve", resolve);
export default router;
//# sourceMappingURL=p2pEscrowRoutes.js.map
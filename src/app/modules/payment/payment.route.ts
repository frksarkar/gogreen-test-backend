import { Router } from 'express';
import { PaymentController } from './payment.controller';

const route = Router();

route.get('/repayment', PaymentController.repayment);
route.post('/success', PaymentController.paymentSuccess);
route.post('/fail', PaymentController.failPayment);
route.post('/cancel', PaymentController.cancelPayment);
route.get('/bkash/callback', PaymentController.bkashCallback);
export const PaymentRoutes = route;

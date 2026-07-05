import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import { PaymentService } from './payment.service';
import config from '../../config';

const paymentSuccess = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const query = req.query;
	const result = await PaymentService.successPayment(query as Record<string, string>);
	if (result) {
		res.redirect(`${config.ssl.success_frontend_url}?transactionId=${query.transactionId}`);
	}
});
const bkashCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { success, reason } = await PaymentService.bkashCallBack(req.query as Record<string, string>);
	if (success) {
		res.redirect(`${config.ssl.success_frontend_url}`);
	}
	if (!success) {
		if (reason === 'failure') res.redirect(`${config.ssl.fail_frontend_url}`);
		if (reason === 'cancel') res.redirect(`${config.ssl.cancel_frontend_url}`);
	}
});
const failPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const result = await PaymentService.failedPayment(req.query as Record<string, string>);
	if (!result) res.redirect(`${config.ssl.fail_frontend_url}`);
});
const cancelPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const result = await PaymentService.cancelPayment(req.query as Record<string, string>);
	if (!result) res.redirect(`${config.ssl.cancel_frontend_url}`);
});
const repayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { orderId } = req.query;
	const payment_url = await PaymentService.repayment(orderId as string);
	if (payment_url) {
		res.status(200).json({ url: payment_url });
	} else {
		return res.status(400).json({ message: 'Payment Failed' });
	}
});
export const PaymentController = {
	paymentSuccess,
	bkashCallback,
	failPayment,
	cancelPayment,
	repayment,
};

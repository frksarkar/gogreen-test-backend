import { OrderStatus, PayoutStatus } from '@prisma/client';
import httpStatus from 'http-status';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import { orderEmailQueue } from '../../queues/order_email.queue';
import { OrderRewardQueue } from '../../queues/order_reward.queue';
import { prisma } from '../../shared/prisma';
import { BkashService } from '../bkash/bkash.service';
import { SSLService } from '../sslCommerz/sslCommerz.service';

// ─── Shared Helper ────────────────────────────────────────────────────────────

export const completePaymentAndNotify = async (
	paymentIdentifier: string, // the value used to look up the payment record
	orderId: string,
) => {
	console.log('🚀 ~ payment.service.ts:16 ~ completePaymentAndNotify ~ paymentIdentifier:', paymentIdentifier);

	const { mailPayload, pdfPayload, userId } = await prisma.$transaction(async (tnx) => {
		if (paymentIdentifier !== 'COD') {
			await tnx.payment.update({
				where: { transaction_id: paymentIdentifier },
				data: { status: PayoutStatus.COMPLETED },
			});
		}
		const vendorOrders = await tnx.vendorOrder.findMany({
			where: { order_id: orderId },
			select: { id: true },
		});

		const vendorOrderIds = vendorOrders.map((order) => order.id);

		// Now update both using those IDs
		await tnx.vendorOrder.updateMany({
			where: { id: { in: vendorOrderIds } },
			data: { status: OrderStatus.PLACED },
		});

		await tnx.orderStatusLog.createMany({
			data: vendorOrderIds.map((vendorOrderId) => ({
				vendorOrderId,
				status: OrderStatus.PLACED,
			})),
		});
		const orderItems = await tnx.orderItem.findMany({
			where: { order_id: orderId },
			select: {
				product_variant_id: true,
				product_name: true,
				quantity: true,
				price: true,
			},
		});

		const products = orderItems.map((item) => ({
			itemNumber: item.product_variant_id,
			name: item.product_name,
			quantity: item.quantity,
			price: item.price,
		}));

		const order = await tnx.order.findUnique({
			where: { id: orderId },
			select: {
				order_number: true,
				customer_name: true,
				customer_email: true,
				shipping_address: true,
				sub_total: true,
				total_amount: true,
				shipping_cost: true,
				tax: true,
				discount: true,
				userId: {
					select: { id: true, referral_code: true },
				},
			},
		});

		const userAddress = order?.shipping_address
			? await tnx.address.findUnique({
					where: { id: order.shipping_address },
				})
			: null;

		const pdfPayload = {
			company: {
				name: config.company.name,
				address: config.company.address,
				city: config.company.address,
				phone: config.company.phone,
				email: config.company.email,
			},
			recipient: {
				name: order?.customer_name as string,
				address: userAddress?.street_address as string,
				city: userAddress?.division as string,
				phone: userAddress?.contactPhone as string,
				email: order?.customer_email as string,
			},
			order: {
				orderNumber: order?.order_number as string,
				customerNumber: order?.userId.referral_code as string,
				date: new Date().toLocaleDateString(),
			},
			items: products.map((item) => ({
				itemNumber: item.itemNumber,
				description: item.name,
				price: item.price,
				quantity: item.quantity,
			})),
			tax: order?.tax as number,
			total: order?.total_amount as number,
			subtotal: order?.sub_total as number,
			shippingFee: order?.shipping_cost as number,
		};

		return {
			mailPayload: order?.customer_email
				? {
						to: order.customer_email,
						orderId: order.order_number,
						customerName: order.customer_name,
						orderItems: products,
						shippingCost: order.shipping_cost,
						subTotal: order.sub_total,
						totalAmount: order.total_amount,
						tax: order.tax,
						streetAddress: userAddress?.street_address,
						district: userAddress?.district,
						division: userAddress?.division,
					}
				: null,
			pdfPayload,
			userId: order?.userId.id as string,
		};
	});

	await OrderRewardQueue.add('order-reward', { userId });

	await orderEmailQueue.add('order-email', {
		mailPayload,
		pdfPayload,
		orderId,
	});
};

// ─── successPayment (direct/card/other gateways) ──────────────────────────────

const successPayment = async (query: Record<string, string>) => {
	await completePaymentAndNotify(query.transactionId, query.orderId);
	return true;
};

// ─── bkashCallBack ────────────────────────────────────────────────────────────

const bkashCallBack = async (query: Record<string, string>) => {
	const { paymentID, status } = query;

	if (status === 'cancel') {
		await prisma.payment.update({
			where: { transaction_id: paymentID },
			data: { status: 'CANCELLED' },
		});
		return { success: false, reason: status };
	}

	if (status === 'failure') {
		await prisma.payment.update({
			where: { transaction_id: paymentID },
			data: { status: 'FAILED' },
		});
		return { success: false, reason: status };
	}

	// Idempotency guard
	const existing = await prisma.payment.findUnique({
		where: { transaction_id: paymentID },
		select: { status: true },
	});
	if (existing?.status === 'COMPLETED') {
		return { success: true, reason: 'already_completed' };
	}

	// Execute bKash payment with timeout
	const executeData = await Promise.race([BkashService.executePayment(paymentID), new Promise((_, reject) => setTimeout(() => reject(new Error('bKash execute timeout')), 10000))]);

	if (executeData?.statusCode !== '0000') {
		await prisma.payment.update({
			where: { transaction_id: paymentID },
			data: { status: 'FAILED' },
		});
		throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to execute payment');
	}

	const orderId = executeData?.merchantInvoiceNumber;
	if (!orderId) {
		throw new ApiError(httpStatus.BAD_GATEWAY, 'Missing merchant invoice number');
	}

	await completePaymentAndNotify(paymentID, orderId);
	return { success: true, reason: status };
};
const failedPayment = async (query: Record<string, string>) => {
	console.log('🚀 ~ payment.service.ts:202 ~ failedPayment ~ query:', query);

	await prisma.$transaction(async (tnx) => {
		await tnx.payment.update({
			where: {
				transaction_id: query.transactionId,
			},
			data: {
				status: 'FAILED',
			},
		});
		const items = await tnx.orderItem.findMany({
			where: {
				order_id: query.orderId,
			},
		});
		items.map((item) => {
			tnx.productVariant.update({
				where: {
					id: item.product_variant_id,
				},
				data: {
					stock: {
						increment: item.quantity,
					},
				},
			});
		});
	});
	return false;
};
const cancelPayment = async (query: Record<string, string>) => {
	await prisma.$transaction(async (tnx) => {
		await tnx.payment.update({
			where: {
				transaction_id: query.transactionId,
			},
			data: {
				status: 'CANCELLED',
			},
		});
		const items = await tnx.orderItem.findMany({
			where: {
				order_id: query.orderId,
			},
		});

		items.map((item) => {
			tnx.productVariant.update({
				where: {
					id: item.product_variant_id,
				},
				data: {
					stock: {
						increment: item.quantity,
					},
				},
			});
		});
	});
	return false;
};

const repayment = async (orderId: string) => {
	const order = await prisma.order.findUnique({
		where: {
			id: orderId,
		},
		include: {
			address: true,
		},
	});

	if (!order) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
	}

	if (!order.customer_email) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Customer email not found');
	}

	const paymentData = await SSLService.paymentInit({
		amount: order?.total_amount,
		transactionId: order?.id,
		name: order?.customer_name,
		email: order?.customer_email,
		phone: order?.customer_phone,
		address: order?.address?.street_address,
		orderId: order?.id,
		city: order?.address?.district,
		state: order?.address?.division,
		postCode: order?.address?.zipcode || 'N/A',
	});

	const payment_url = paymentData?.GatewayPageURL;
	return payment_url;
};

export const PaymentService = {
	successPayment,
	failedPayment,
	cancelPayment,
	bkashCallBack,
	repayment,
};

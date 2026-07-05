import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { prisma } from '../../shared/prisma';

import { OrderStatus } from '@prisma/client';
import config from '../../config';
import { generateOrderNumber } from '../../utils/order/generateOrderNumber';
import { generateStoreOrderId } from '../../utils/order/generateStoreOrderNumber';
import { TaxService } from '../admin/tax/tax.service';
import { BkashService } from '../bkash/bkash.service';
import { completePaymentAndNotify } from '../payment/payment.service';
import { SSLService } from '../sslCommerz/sslCommerz.service';

const createOrder = async (order: {
	orderItem: {
		variantId: string;
		productId: string;
		quantity: number;
		storeId: string;
		shippingCost: number;
	}[];
	customerNote: string;
	address: string;
	userId: string;
	paymentProvider: string;
	name: string;
	phone: string;
}) => {
	const { orderItem, customerNote, address, userId, paymentProvider, name, phone } = order;

	// ─── Step 1: Validate all items before touching the DB ───
	const validatedItems = [];

	for (const { variantId, productId, quantity, storeId, shippingCost } of orderItem) {
		const variant = await prisma.productVariant.findUnique({
			where: { id: variantId, productId },
		});
		if (!variant) throw new ApiError(httpStatus.NOT_FOUND, `Variant ${variantId} not found`);

		const product = await prisma.product.findUnique({
			where: { id: productId, storeId },
			select: {
				name: true,
				vendorId: true,
			},
		});
		if (!product) throw new ApiError(httpStatus.NOT_FOUND, `Product ${productId} not found in store`);

		if (quantity > variant.stock) throw new ApiError(httpStatus.BAD_REQUEST, `Only ${variant.stock} left in stock for ${product.name}`);

		validatedItems.push({
			variant,
			product,
			vendorId: product?.vendorId,
			quantity,
			storeId,
			shippingCost,
			variantId,
			productId,
		});
	}

	// ─── Step 2: Validate user and address ───
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

	const userAddress = await prisma.address.findUnique({
		where: { id: address, user_id: userId },
	});
	if (!userAddress) throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');

	// ─── Step 3: Calculate totals ───
	let subTotal = validatedItems.reduce((sum, item) => sum + (item.variant.salePrice ? item.variant.salePrice : item.variant.mainPrice) * item.quantity, 0);
	const totalShipping = validatedItems.reduce((sum, item) => sum + item.shippingCost, 0);
	const tax = await TaxService.getAllTax();
	let subTotalWithTax = subTotal;
	let discountAmount = 0;
	// const campaign = await prisma.campaign.findFirst({
	//   where: {
	//     isActive: true,
	//   },
	//   select: {
	//     discountType: true,
	//     discount: true,
	//     maxDiscountAmount: true,
	//     minOrderAmount: true,
	//     maxUsageCount: true,
	//     currentUsageCount: true,
	//     startDate: true,
	//     endDate: true,
	//   },
	// });
	// const { eligible } = isCampaignEligible(campaign as Campaign, subTotal);
	// if (eligible && campaign) {
	//   const discountValue = Number(campaign.discount);

	//   if (campaign.discountType === "PERCENT") {
	//     discountAmount = (subTotal * discountValue) / 100;

	//     // Cap it if maxDiscountAmount is set
	//     if (campaign.maxDiscountAmount) {
	//       const cap = Number(campaign.maxDiscountAmount);
	//       discountAmount = Math.min(discountAmount, cap);
	//     }
	//   } else {
	//     // FIXED — discount can never exceed the subTotal itself
	//     discountAmount = Math.min(discountValue, subTotal);
	//   }

	//   discountAmount = Math.round(discountAmount); // round to avoid floating point mess
	//   subTotal = subTotal - discountAmount;
	// }
	if (tax.length > 0) {
		const taxRate = Number(tax[0].rate) / 100;
		const taxAmount = Math.round(subTotal * taxRate);
		subTotalWithTax = subTotal + taxAmount;
	}
	const totalAmount = subTotalWithTax + totalShipping;

	// ─── Step 4: Group items by storeId ───
	const itemsByStore = validatedItems.reduce(
		(acc, item) => {
			if (!acc[item.storeId]) acc[item.storeId] = [];
			acc[item.storeId].push(item);
			return acc;
		},
		{} as Record<string, typeof validatedItems>,
	);
	// ─── Step 5: Create everything inside a transaction ───
	let payment;
	const placeOrder = await prisma.$transaction(async (tnx) => {
		// 1. Create the main Order
		const newOrder = await tnx.order.create({
			data: {
				user_id: user.id,
				order_number: generateOrderNumber(),
				customer_name: name,
				customer_email: user.email,
				customer_phone: phone,
				shipping_address: userAddress.id,
				customer_note: customerNote,
				sub_total: subTotal,
				shipping_cost: totalShipping,
				total_amount: totalAmount,
				tax: subTotalWithTax - subTotal,
				discount: discountAmount,
			},
		});

		// 2. Create a VendorOrder per store, with its OrderItems
		for (const [storeId, items] of Object.entries(itemsByStore)) {
			const vendorId = items[0].vendorId;
			const storeSubTotal = items.reduce((sum, item) => sum + (item.variant.salePrice ? item.variant.salePrice : item.variant.mainPrice) * item.quantity, 0);
			const storeShipping = items.reduce((sum, item) => sum + item.shippingCost, 0);
			const storeTotalAmount = storeSubTotal + storeShipping;
			const vendorOrder = await tnx.vendorOrder.create({
				data: {
					order_id: newOrder.id,
					store_id: storeId,
					store_order_id: generateStoreOrderId(newOrder.id, storeId),
					sub_total: storeSubTotal,
					total_amount: storeTotalAmount,
					shipping_cost: String(storeShipping),
					status: OrderStatus.PENDING,
					storeId,
					vendorId,
				},
			});
			await tnx.orderStatusLog.create({
				data: {
					vendorOrderId: vendorOrder.id,
					status: OrderStatus.PENDING,
				},
			});
			// 3. Create OrderItems for this VendorOrder
			await tnx.orderItem.createMany({
				data: items.map((item) => ({
					vendor_order_id: vendorOrder.id,
					product_variant_id: item.variantId,
					product_id: item.productId,
					quantity: item.quantity,
					order_id: newOrder.id,
					price: item.variant.salePrice ? item.variant.salePrice : item.variant.mainPrice,
					product_name: item.product.name,
				})),
			});

			// 4. Deduct stock for each item
			for (const item of items) {
				await tnx.productVariant.update({
					where: { id: item.variantId },
					data: { stock: { decrement: item.quantity } },
				});
			}
		}
		if (paymentProvider === 'SSLCOMMERZ') {
			const paymentData = await SSLService.paymentInit({
				amount: totalAmount,
				transactionId: newOrder.id,
				name: name,
				email: user?.email,
				phone: phone,
				address: userAddress.street_address,
				orderId: newOrder.id,
				city: userAddress.district,
				state: userAddress.division,
				postCode: userAddress.zipcode || 'N/A',
			});
			payment = paymentData?.GatewayPageURL;
			await tnx.payment.create({
				data: {
					order_id: newOrder.id,
					payment_provider: 'SSLCOMMERZ',
					amount: totalAmount,
					transaction_id: newOrder.id,
					status: 'PENDING',
				},
			});
		}
		if (paymentProvider === 'BKASH') {
			const bkashPayment = await BkashService.createPayment({
				amount: totalAmount,
				orderID: newOrder.id,
				callbackURL: config.bkash.callback_url,
				payerReference: user.id,
			});
			payment = bkashPayment.bkashURL;
			await tnx.payment.create({
				data: {
					order_id: newOrder.id,
					payment_provider: 'BKASH',
					amount: totalAmount,
					transaction_id: bkashPayment.paymentID,
					status: 'PENDING',
				},
			});
		}
		if (paymentProvider === 'COD') {
			completePaymentAndNotify(paymentProvider, newOrder.id);
			payment = null;
		}
		return newOrder;
	});

	// remove items from cart
	// console.log(userId);
	// orderItem.map((item) => console.log(item.productId));
	const cartData = await prisma.cartWishlist.deleteMany({
		where: {
			userId,
			productId: {
				in: orderItem.map((item) => item.productId),
			},
			type: 'CART',
		},
	});
	// console.log(cartData, "from order service ");
	return {
		order: placeOrder,
		payment,
	};
};

const VENDOR_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
	[OrderStatus.PLACED]: OrderStatus.PROCESSING,
	[OrderStatus.PROCESSING]: OrderStatus.PACKED,
	[OrderStatus.PACKED]: OrderStatus.HANDED_TO_COURIER,
};

const updateVendorOrderStatus = async (vendorOrderId: string, status: OrderStatus) => {
	const vendorOrder = await prisma.vendorOrder.findUnique({
		where: { id: vendorOrderId },
	});

	if (!vendorOrder) throw new ApiError(httpStatus.NOT_FOUND, 'Vendor order not found');

	const currentStatus = vendorOrder.status as OrderStatus;
	const allowedNextStatus = VENDOR_ALLOWED_TRANSITIONS[currentStatus];

	// Current status is beyond vendor's control (e.g. HANDED_TO_COURIER and above)
	// if (!allowedNextStatus)
	//   throw new ApiError(
	//     httpStatus.BAD_REQUEST,
	//     `Order cannot be updated after reaching ${currentStatus.toLowerCase().replace(/_/g, " ")}`,
	//   );

	// Requested status is not the valid next step
	// if (status !== allowedNextStatus)
	//   throw new ApiError(
	//     httpStatus.BAD_REQUEST,
	//     `Order status can only move from ${currentStatus} → ${allowedNextStatus}`,
	//   );

	// ✅ Update vendor order status

	const updatedVendorOrder = await prisma.vendorOrder.update({
		where: { id: vendorOrderId },
		data: {
			status,
			...(status === OrderStatus.DELIVERED && {
				deliveredAt: new Date(),
			}),
		},
	});

	// ✅ Create status log
	await prisma.orderStatusLog.create({
		data: {
			vendorOrderId,
			status,
		},
	});

	// =====================================================
	// ✅  VENDOR WALLET UPDATE (PENDING BALANCE)
	// Only add money when order becomes DELIVERED
	// and prevent duplicate crediting
	// =====================================================
	if (currentStatus !== OrderStatus.DELIVERED && status === OrderStatus.DELIVERED) {
		if (!vendorOrder.vendorId) {
			throw new Error('vendorId is missing');
		}
		await prisma.vendorWallet.upsert({
			where: {
				vendorId: vendorOrder.vendorId as string,
			},
			update: {
				// 🔥 ADD to pending balance
				pendingBalance: {
					increment: Number(vendorOrder.sub_total),
				},

				// 🔥 ADD to total earned
				totalEarned: {
					increment: Number(vendorOrder.sub_total),
				},
			},
			create: {
				vendorId: vendorOrder.vendorId,

				// 🔥 INITIAL WALLET CREATION WITH PENDING BALANCE
				pendingBalance: Number(vendorOrder.sub_total),
				totalEarned: Number(vendorOrder.sub_total),

				currentBalance: 0,
				totalWithdrawn: 0,
				withdrawLimit: 100,
			},
		});
	}

	// =====================================================
	// 🔁 REVERSE: DELIVERED → OTHER STATUS
	// Deduct previously credited amount
	// =====================================================
	if (currentStatus === OrderStatus.DELIVERED && status !== OrderStatus.DELIVERED) {
		if (!vendorOrder.vendorId) {
			throw new Error('vendorId is missing');
		}

		await prisma.vendorWallet.update({
			where: {
				vendorId: vendorOrder.vendorId,
			},
			data: {
				pendingBalance: {
					decrement: Number(vendorOrder.sub_total),
				},
				totalEarned: {
					decrement: Number(vendorOrder.sub_total),
				},
			},
		});
	}

	return updatedVendorOrder;
};

const getAllUserOrders = async (userId: string) => {
	const userOrders = await prisma.order.findMany({
		where: { user_id: userId },
		select: { id: true },
	});

	const orderIds = userOrders.map((o) => o.id);

	// Run total count + status groupBy in parallel
	// Run separately — avoids $transaction union type inference issues
	const totalOrders = await prisma.order.count({
		where: { user_id: userId },
	});

	const statusCounts = await prisma.vendorOrder.groupBy({
		by: ['status'],
		where: { order_id: { in: orderIds } },
		orderBy: { status: 'asc' },
		_count: { _all: true },
	});

	const countByStatus = statusCounts.reduce(
		(acc, curr) => {
			acc[curr.status] = curr._count._all;
			return acc;
		},
		{} as Record<OrderStatus, number>,
	);
	const orders = await prisma.order.findMany({
		where: { user_id: userId },
		select: {
			id: true,
			order_number: true,
			customer_name: true,
			customer_email: true,
			shipping_address: true,
			sub_total: true,
			total_amount: true,
			shipping_cost: true,
			tax: true,
			discount: true,
			createdAt: true,
			payments: {
				select: {
					id: true,
					amount: true,
					status: true,
					payment_provider: true,
					createdAt: true,
				},
			},
			orderItems: {
				select: {
					id: true,
					product_id: true,
					product_name: true,
					quantity: true,
					price: true,
					product_variant_id: true,
					variantId: {
						select: {
							images: {
								select: {
									imageUrl: true,
								},
							},
						},
					},
					vendorOrderId: {
						select: {
							status: true,
						},
					},
				},
			},
		},
	});

	return {
		data: orders,
		meta: {
			totalOrders,
			successful: countByStatus['DELIVERED'] ?? 0,
			pending: countByStatus['PLACED'] ?? 0,
			cancelled: countByStatus['CANCELLED'] ?? 0,
		},
	};
};

const getAllStoreOrders = async (storeId: string) => {
	const orders = await prisma.vendorOrder.findMany({
		where: {
			store_id: storeId,
		},
	});
	return orders;
};

const getAllVendorOrders = async (vendorId: string) => {
	if (!vendorId) {
		throw new Error('Vendor ID is required');
	}
	const orders = await prisma.vendorOrder.findMany({
		where: {
			vendorId: {
				not: null,
				equals: vendorId,
			},
		},

		orderBy: {
			createdAt: 'desc',
		},

		select: {
			id: true,
			store_order_id: true,
			status: true,
			sub_total: true,
			shipping_cost: true,
			total_amount: true,
			createdAt: true,

			store: {
				select: {
					// id: true,
					shopName: true,
				},
			},

			orderItems: {
				select: {
					// id: true,
					product_name: true,
					quantity: true,
					price: true,
				},
			},
		},
	});

	const counts = await prisma.vendorOrder.groupBy({
		by: ['status'],
		where: {
			vendorId,
		},
		_count: {
			status: true,
		},
	});

	const statusCounts = counts.reduce(
		(acc, item) => {
			acc[item.status] = item._count.status;
			return acc;
		},
		{} as Record<string, number>,
	);

	return { orders, statusCounts };
};

const userOrderById = async (id: string) => {
	const order = await prisma.order.findUnique({
		where: {
			id,
		},
	});
	const orderItems = await prisma.orderItem.findMany({
		where: {
			order_id: id,
		},
		include: {
			variantId: {
				include: {
					images: true,
				},
			},
		},
	});
	const vendorOrders = await prisma.vendorOrder.findMany({
		where: {
			order_id: id,
		},
	});
	const orderStatus = await prisma.orderStatusLog.findMany({
		where: {
			vendorOrderId: {
				in: vendorOrders.map((order) => order.id),
			},
		},
	});
	const payments = await prisma.payment.findFirst({
		where: {
			order_id: id,
			status: 'COMPLETED',
		},
	});
	return {
		order,
		orderItems,
		vendorOrders,
		orderStatus,
		payments,
	};
};

const getOrderDetails = async (orderId: string) => {
	const order = await prisma.order.findUnique({
		where: {
			id: orderId,
		},
		include: {
			orderItems: {
				include: {
					vendorOrderId: true,
				},
			},
			payments: true,
		},
	});
	return order;
};

const getAllAdminOrders = async () => {
	// ================================
	// 📦 ORDERS
	// ================================
	const orders = await prisma.vendorOrder.findMany({
		orderBy: {
			createdAt: 'desc',
		},

		select: {
			id: true,
			store_order_id: true,
			status: true,
			sub_total: true,
			shipping_cost: true,
			total_amount: true,
			createdAt: true,
			vendorId: true,

			store: {
				select: {
					shopName: true,
				},
			},

			orderItems: {
				select: {
					product_name: true,
					quantity: true,
					price: true,
				},
			},
		},
	});

	// ================================
	// 📊 STATUS COUNTS
	// ================================
	const counts = await prisma.vendorOrder.groupBy({
		by: ['status'],
		_count: {
			status: true,
		},
	});

	const statusCounts = counts.reduce(
		(acc, item) => {
			acc[item.status] = item._count.status;
			return acc;
		},
		{} as Record<string, number>,
	);

	// ================================
	// 💰 SUMMARY (FIXED PRISMA AGGREGATE)
	// ================================
	// const summary = await prisma.vendorOrder.aggregate({
	//   _sum: {
	//     total_amount: true,
	//     sub_total: true,
	//     shipping_cost: true,
	//   },
	//   _count: {
	//     id: true,
	//   },
	// });

	// ================================
	// 📦 FINAL RESPONSE
	// ================================
	return {
		orders,
		statusCounts,
	};
};

export const OrderService = {
	createOrder,
	updateVendorOrderStatus,
	getAllUserOrders,
	getAllVendorOrders,
	getAllStoreOrders,
	userOrderById,
	getOrderDetails,
	getAllAdminOrders,
};
// 0a4afeed-ca10-437d-ac37-5c3ee7aa41b9

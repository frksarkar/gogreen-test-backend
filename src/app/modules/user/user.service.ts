import { prisma } from '../../shared/prisma';
import ApiError from '../../errors/ApiError';
import config from '../../config';
import bcryptjs from 'bcryptjs';
import { deleteImgFromCloudinary } from '../../config/cloudinary.config';
import { Address, AddressType, Prisma, User } from '@prisma/client';
import httpStatus from 'http-status';
import { paginationHelper } from '../../helper/paginationHelper';
import { userSearchableFields } from './user.constant';
const MAX_ALLOWED_ADDRESS = 3;
const getMe = async (id: string) => {
	let user = await prisma.user.findUnique({
		where: {
			id: id,
		},
		omit: {
			password: true,
		},
		include: {
			vendorStaff: true,
		},
	});

	if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
	const userIsVendor = await prisma.vendor.findUnique({
		where: {
			userId: id,
		},
	});
	if (userIsVendor) {
		user = await prisma.user.findUnique({
			where: {
				id: id,
			},
			omit: {
				password: true,
			},
			include: {
				vendor: true,
				vendorStaff: true,
			},
		});
	}
	const isAdmin = await prisma.userRole.findFirst({
		where: {
			user_id: id,
			role_id: config.super_admin.role,
		},
	});
	if (isAdmin) {
		user = await prisma.user.findUnique({
			where: {
				id: id,
				isDeleted: false,
			},
			omit: {
				password: true,
			},
			include: {
				userRoles: true,
				vendorStaff: true,
			},
		});
	}
	const userRoles = await prisma.userRole.findMany({
		where: {
			user_id: id,
		},
		select: {
			role: {
				select: {
					name: true,
					systemLevel: true,
				},
			},
		},
	});
	return { user, userRoles };
};
const createAddress = async (id: string, address: any) => {
	const addressAllowed = await prisma.address.findMany({
		where: {
			user_id: id,
			NOT: {
				label: AddressType.OLD,
			},
		},
	});
	if (addressAllowed.length >= MAX_ALLOWED_ADDRESS) {
		throw new ApiError(httpStatus.BAD_REQUEST, 'You can create a maximum of 3 addresses');
	}

	return await prisma.address.create({
		data: {
			user_id: id,
			...address,
		},
	});
};
const updateUser = async (id: string, userData: Partial<User>, userAddress: any) => {
	if (userData.password) {
		const newPassword = await bcryptjs.hash(userData.password, config.bcrypt_salt_round);
		userData.password = newPassword;
	}
	return await prisma.$transaction(async (tnx) => {
		const existingUser = await tnx.user.findUnique({
			where: {
				id: id,
			},
		});
		const updatedUser = await tnx.user.update({
			where: {
				id: id,
			},
			data: userData,
		});
		// delete previous profile photo
		if (existingUser?.profile_photo && existingUser.profile_photo !== userData.profile_photo) {
			await deleteImgFromCloudinary(existingUser.profile_photo);
		}

		//create user address
		let userAddresses = null;
		if (userAddress && userAddress.create) {
			if (userAddress.create.length >= MAX_ALLOWED_ADDRESS) {
				throw new ApiError(400, 'You can create a maximum of 3 addresses');
			}
			userAddresses = await tnx.address.findMany({
				where: {
					user_id: id,
				},
			});
			if (userAddresses.length >= MAX_ALLOWED_ADDRESS) {
				throw new ApiError(400, 'You can create a maximum of 3 addresses');
			}
			userAddresses = await tnx.address.createMany({
				data: userAddress.create.map((address: Address) => ({
					user_id: id,
					division: address.division,
					district: address.district,
					street_address: address.street_address,
					area: address.area,
				})),
			});
		}
		if (userAddress && userAddress.update) {
			await Promise.all(
				(userAddresses = userAddress.update.map(({ id, ...data }: Address) => {
					if (!id) {
						throw new ApiError(400, 'Address id is required');
					}

					return tnx.address.update({
						where: { id },
						data,
					});
				})),
			);
		}
		if (userAddress && userAddress.delete) {
			await tnx.address.deleteMany({
				where: {
					id: {
						in: userAddress.delete,
					},
				},
			});
		}
		const { password, ...rest } = updatedUser;
		return { updatedUser: { ...rest }, userAddresses };
	});
};
const getUserAddress = async (id: string) => {
	return await prisma.address.findMany({
		where: {
			user_id: id,
			NOT: {
				label: AddressType.OLD,
			},
		},
		include: {
			user: {
				select: {
					phone: true,
					email: true,
				},
			},
		},
	});
};
const updateUserAddress = async (userId: string, id: string, address: Partial<Address>) => {
	const userExists = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});
	if (!userExists) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	const addressBelongsToUser = await prisma.address.findUnique({
		where: {
			id,
			user_id: userId,
		},
	});
	if (!addressBelongsToUser) throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');
	// const addressInOrder = await prisma.order.findFirst({
	//   where: {
	//     shipping_address: id,
	//   },
	// });
	// if (addressInOrder) {
	//   await prisma.address.update({
	//     where: {
	//       id,
	//     },
	//     data: {
	//       label: AddressType.OLD,
	//     },
	//   });
	//   return await prisma.address.create({
	//     data: { ...addressBelongsToUser, ...address },
	//   });
	// }
	// const updatedAddress = await prisma.address.update({
	//   where: {
	//     id,
	//   },
	//   data: { ...address },
	// });
	const updatedAddress = await prisma.address.update({
		where: {
			id,
		},
		data: {
			...address,
		},
	});
	return updatedAddress;
};
const deleteUserAddress = async (id: string) => {
	if (!id) {
		throw new ApiError(400, 'Address id is required');
	}
	const addressInOrder = await prisma.order.findFirst({
		where: {
			shipping_address: id,
		},
	});
	if (addressInOrder) {
		await prisma.address.update({
			where: {
				id,
			},
			data: {
				label: AddressType.OLD,
			},
		});
		return true;
	}
	return await prisma.address.delete({
		where: {
			id: id,
		},
	});
};
const searchUser = async (search: string) => {
	const user = await prisma.user.findFirst({
		where: {
			OR: [
				{
					name: {
						contains: search,
						mode: 'insensitive',
					},
				},
				{
					email: {
						contains: search,
						mode: 'insensitive',
					},
				},
				{
					referral_code: {
						contains: search,
						mode: 'insensitive',
					},
				},
			],
		},
	});
	return user;
};
const getAllUsers = async (params: any, options: any) => {
	const { skip, page, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
	const { searchTerm, ...filterData } = params;
	const andConditions: Prisma.UserWhereInput[] = [];
	if (searchTerm) {
		andConditions.push({
			OR: userSearchableFields.map((field) => ({
				[field]: { contains: searchTerm, mode: 'insensitive' },
			})),
		});
	}
	if (Object.keys(filterData).length > 0) {
		andConditions.push({
			AND: Object.keys(filterData).map((key) => ({
				[key]: {
					equals: (filterData as any)[key],
				},
			})),
		});
	}
	const whereConditions: Prisma.UserWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};
	const result = await prisma.user.findMany({
		skip,
		take: limit,
		where: whereConditions,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});
	const total = await prisma.user.count({
		where: whereConditions,
	});
	return {
		data: result,
		meta: {
			page,
			limit,
			total,
		},
	};
};
const softDeleteUser = async (id: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id,
		},
	});
	if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	return await prisma.user.update({
		where: {
			id,
		},
		data: {
			isDeleted: true,
		},
	});
};
const restoreUser = async (id: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id,
		},
	});
	if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	return await prisma.user.update({
		where: {
			id,
		},
		data: {
			isDeleted: false,
		},
	});
};
const hardDeleteUser = async (id: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id,
		},
	});
	if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	return await prisma.user.delete({
		where: {
			id,
		},
	});
};
const getUserById = async (id: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: id,
		},
	});
	return user;
};
export const userService = {
	getMe,
	createAddress,
	updateUser,
	getUserAddress,
	updateUserAddress,
	deleteUserAddress,
	searchUser,
	getAllUsers,
	softDeleteUser,
	restoreUser,
	hardDeleteUser,
	getUserById,
};

import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import { TicketPriority, TicketStatus } from "@prisma/client";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const createTicket = async (userId: string, payload: any) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const ticket = await prisma.vendorTicket.create({
    data: { ...payload, vendorId: vendor.id },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    vendor.id,
    undefined,
    VendorActivityActions.TICKET_CREATED,
    `Created support ticket: ${payload.subject || "No subject"} - Priority: ${payload.priority || "NORMAL"}`,
  );

  return ticket;
};

const getVendorTickets = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return await prisma.vendorTicket.findMany({
    where: { vendorId: vendor.id, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
};

const getVendorTicketById = async (userId: string, ticketId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return await prisma.vendorTicket.findFirst({
    where: { id: ticketId, vendorId: vendor.id, isDeleted: false },
  });
};

const updateVendorTicket = async (userId: string, id: string, payload: any) => {
  const ticket = await prisma.vendorTicket.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!ticket) throw new ApiError(404, "Ticket not found or unauthorized");

  if (ticket.status !== "OPEN") {
    throw new ApiError(400, "Cannot update ticket once it is processed");
  }

  const updatedTicket = await prisma.vendorTicket.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    ticket.vendorId,
    undefined,
    VendorActivityActions.TICKET_UPDATED,
    `Updated support ticket: ${ticket.subject || "No subject"} - Changes: ${JSON.stringify(Object.keys(payload))}`,
  );

  return updatedTicket;
};

// Admin Access
const getAllTickets = async () => {
  return await prisma.vendorTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
};

const updateTicket = async (
  id: string,
  payload: { status?: TicketStatus; priority?: TicketPriority },
) => {
  const ticket = await prisma.vendorTicket.findUnique({
    where: { id },
  });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const updatedTicket = await prisma.vendorTicket.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    ticket.vendorId,
    undefined,
    VendorActivityActions.TICKET_UPDATED,
    `Admin updated ticket: ${ticket.subject || "No subject"} - Changes: ${JSON.stringify(payload)}`,
  );

  return updatedTicket;
};

const deleteTicket = async (
  userId: string,
  ticketId: string,
  hardDelete = false,
) => {
  const ticket = await prisma.vendorTicket.findFirst({
    where: { id: ticketId, vendor: { userId }, isDeleted: false },
  });
  if (!ticket) throw new ApiError(404, "Ticket not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorTicket.delete({ where: { id: ticketId } });
  } else {
    result = await prisma.vendorTicket.update({
      where: { id: ticketId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.logVendorActivity(
    ticket.vendorId,
    undefined,
    VendorActivityActions.TICKET_DELETED,
    `${hardDelete ? "Permanently deleted" : "Removed"} support ticket: ${ticket.subject || "No subject"}`,
  );

  return result;
};

export const SupportService = {
  createTicket,
  getVendorTickets,
  getVendorTicketById,
  updateVendorTicket,
  deleteTicket,
  getAllTickets,
  updateTicket,
};

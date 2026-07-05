import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { LogisticsService } from "./logistics.service";

const addShippingRate = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const result = await LogisticsService.addShippingRate(
    userId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Shipping rate added successfully",
    data: result,
  });
});

const updateShippingRate = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await LogisticsService.updateShippingRate(
    userId as string,
    id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping rate updated successfully",
    data: result,
  });
});

const deleteShippingRate = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await LogisticsService.deleteShippingRate(
    userId as string,
    id as string,
    false,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping rate deleted successfully",
    data: result,
  });
});

const hardDeleteShippingRate = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const { id } = req.params;
    const result = await LogisticsService.deleteShippingRate(
      userId as string,
      id as string,
      true,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shipping rate permanently deleted",
      data: result,
    });
  },
);

const getStoreShippingRates = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const storeId = req.query.storeId as string;
    const result = await LogisticsService.getStoreShippingRates(
      userId as string,
      storeId as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shipping rates fetched successfully",
      data: result,
    });
  },
);

const getShippingRateById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const { id } = req.params;
  const result = await LogisticsService.getShippingRateById(
    userId as string,
    id as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping rate details fetched successfully",
    data: result,
  });
});

const createShippingTemplate = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const result = await LogisticsService.createShippingTemplate(
      userId as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Shipping template created successfully",
      data: result,
    });
  },
);

const updateShippingTemplate = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const { id } = req.params;
    const result = await LogisticsService.updateShippingTemplate(
      userId as string,
      id as string,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shipping template updated successfully",
      data: result,
    });
  },
);

const deleteShippingTemplate = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const { id } = req.params;
    const result = await LogisticsService.deleteShippingTemplate(
      userId as string,
      id as string,
      false,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shipping template deleted successfully",
      data: result,
    });
  },
);

const hardDeleteShippingTemplate = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const { id } = req.params;
    const result = await LogisticsService.deleteShippingTemplate(
      userId as string,
      id as string,
      true,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shipping template permanently deleted",
      data: result,
    });
  },
);

const getShippingTemplates = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const storeId = req.query.storeId as string;
  const result = await LogisticsService.getShippingTemplates(
    userId as string,
    storeId as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Shipping templates fetched successfully",
    data: result,
  });
});

const getShippingTemplateById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    const { id } = req.params;
    const result = await LogisticsService.getShippingTemplateById(
      userId as string,
      id as string,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Shipping template details fetched successfully",
      data: result,
    });
  },
);

export const LogisticsController = {
  addShippingRate,
  updateShippingRate,
  deleteShippingRate,
  hardDeleteShippingRate,
  getStoreShippingRates,
  getShippingRateById,
  createShippingTemplate,
  updateShippingTemplate,
  deleteShippingTemplate,
  hardDeleteShippingTemplate,
  getShippingTemplates,
  getShippingTemplateById,
};

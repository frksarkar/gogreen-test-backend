import { NextFunction, Request, Response } from "express";
import { sendSmsToUser } from "./sms.service";

export const sendSms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phoneNumber, messageBody, customCsmsId } = req.body;
        const result = await sendSmsToUser(phoneNumber, messageBody, customCsmsId);
        res.status(200).json({
            success: result.success,
            message: result.success ? "SMS sent successfully" : result.error,
            data: result
        })
    } catch (error) {
        next(error);
    }
}
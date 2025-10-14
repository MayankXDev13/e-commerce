import type { Request, Response } from "express";
import logger from "../logger/winston.logger";


export const healthcheck = (req: Request, res: Response) => {
    logger.info("Health check passed");
    return res.status(200).json({statusCode: 200, data: {}, message: "Health check passed" })
}
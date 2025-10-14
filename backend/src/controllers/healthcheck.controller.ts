import type { Request, Response } from "express";


export const healthcheck = (req: Request, res: Response) => {
    return res.status(200).json({statusCode: 200, data: {}, message: "Health check passed" })
}
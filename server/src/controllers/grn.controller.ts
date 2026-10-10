import { Request, Response, NextFunction } from "express";
import { procurementService } from "../services/procurement.service";
import { CreateGRNSchema } from "./procurement.controller";

export class GRNController {
  async createGRN(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;
      const userId = (req as any).user?._id;

      const grn = await procurementService.createGRN(companyId, userId, req.body);

      res.status(201).json({
        success: true,
        message: "Goods receipt note processed and inventory stock updated successfully",
        data: grn,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const grnController = new GRNController();
export { CreateGRNSchema };
export default grnController;

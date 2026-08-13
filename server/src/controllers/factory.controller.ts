import { Response, NextFunction } from "express";
import { z } from "zod";
import { factoryService } from "../services/factory.service";
import { AuthenticatedRequest } from "../middleware/auth";

export const CreateFactorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Factory name is required"),
    code: z.string().min(1, "Factory code is required"),
    location: z
      .object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .optional(),
    managerId: z.string().optional(),
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    capacity: z.number().positive("Capacity must be a positive number").optional(),
    status: z.enum(["active", "inactive", "maintenance", "closed"]).optional(),
  }),
});

export class FactoryController {
  async createFactory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const factory = await factoryService.createFactory(
        req.companyId!,
        req.user!._id.toString(),
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Factory created successfully",
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const factoryController = new FactoryController();
export default factoryController;

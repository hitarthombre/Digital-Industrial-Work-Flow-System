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

export const UpdateFactorySchema = z.object({
  params: z.object({
    id: z.string().min(1, "Factory ID is required"),
  }),
  body: z.object({
    name: z.string().optional(),
    code: z.string().optional(),
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
    managerId: z.string().nullable().optional(),
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    capacity: z.number().positive("Capacity must be a positive number").optional(),
    status: z.enum(["active", "inactive", "maintenance", "closed"]).optional(),
  }),
});

export const UpdateFactoryStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Factory ID is required"),
  }),
  body: z.object({
    status: z.enum(["active", "inactive", "maintenance", "closed"], {
      required_error: "Status is required",
    }),
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

  async updateFactory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const factory = await factoryService.updateFactory(
        req.params.id,
        req.companyId!,
        req.user!._id.toString(),
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Factory updated successfully",
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFactories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as "asc" | "desc";

      const result = await factoryService.getFactories(req.companyId!, {
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      });

      res.status(200).json({
        success: true,
        message: "Factories retrieved successfully",
        data: result.factories,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFactoryById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const factory = await factoryService.getFactoryById(req.params.id, req.companyId!);

      if (!factory) {
        res.status(404).json({
          success: false,
          message: "Factory not found or access denied",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Factory details retrieved successfully",
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFactory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await factoryService.deleteFactory(
        req.params.id,
        req.companyId!,
        req.user!._id.toString()
      );

      res.status(200).json({
        success: true,
        message: "Factory deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFactoryStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const factory = await factoryService.updateFactoryStatus(
        req.params.id,
        req.companyId!,
        req.user!._id.toString(),
        req.body.status
      );

      res.status(200).json({
        success: true,
        message: `Factory status updated to ${req.body.status}`,
        data: factory,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const factoryController = new FactoryController();
export default factoryController;

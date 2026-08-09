import { Response, NextFunction } from "express";
import { z } from "zod";
import { roleService } from "../services/role.service";
import { AuthenticatedRequest } from "../middleware/auth";

export const CreateRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Role name is required"),
    description: z.string().optional(),
    permissions: z.array(z.string()).min(1, "At least one permission is required"),
  }),
});

export const UpdateRoleSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  }),
});

export class RoleController {
  async getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await roleService.getRoles(req.companyId);

      res.status(200).json({
        success: true,
        message: "Roles retrieved successfully",
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRoleById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.getRoleById(req.params.id, req.companyId);
      if (!role) {
        res.status(404).json({
          success: false,
          message: "Role not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Role retrieved successfully",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, permissions } = req.body;
      const role = await roleService.createRole(req.companyId!, name, description, permissions);

      res.status(201).json({
        success: true,
        message: "Custom role created successfully",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await roleService.updateRole(req.params.id, req.companyId!, req.body);

      res.status(200).json({
        success: true,
        message: "Custom role updated successfully",
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await roleService.deleteRole(req.params.id, req.companyId!);

      res.status(200).json({
        success: true,
        message: "Custom role deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await roleService.getPermissions();

      res.status(200).json({
        success: true,
        message: "System permissions catalog retrieved successfully",
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const roleController = new RoleController();
export default roleController;

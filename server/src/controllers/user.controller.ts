import { Response, NextFunction } from "express";
import { z } from "zod";
import { userService } from "../services/user.service";
import { AuthenticatedRequest } from "../middleware/auth";

export const CreateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    roleId: z.string().optional(),
    departmentId: z.string().optional(),
  }),
});

export const UpdateUserSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    roleId: z.string().optional(),
    departmentId: z.string().optional(),
  }),
});

export const UpdateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(["active", "inactive"]),
  }),
});

export const InviteUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    role: z.string().optional(),
    roleId: z.string().optional(),
    departmentId: z.string().optional(),
  }),
});

export const AcceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Invitation token is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
  }),
});

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const status = req.query.status as string;

      const result = await userService.getUsers(req.companyId!, { page, limit, search, role, status });

      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: result.users,
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

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id, req.companyId!);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found or access denied",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createUser(req.companyId!, req.body);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUser(req.params.id, req.companyId!, req.body);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.updateUserStatus(req.params.id, req.companyId!, req.body.status);

      res.status(200).json({
        success: true,
        message: `User status updated to ${req.body.status}`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await userService.deleteUser(req.params.id, req.companyId!);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async inviteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.inviteUser(req.companyId!, req.user!._id.toString(), req.body);

      res.status(201).json({
        success: true,
        message: `User invitation sent to ${req.body.email}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyInvitation(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitation = await userService.verifyInvitationToken(req.params.token);

      res.status(200).json({
        success: true,
        message: "Invitation token is valid",
        data: invitation,
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.acceptInvitation(req.body);

      res.status(201).json({
        success: true,
        message: "Invitation accepted and account setup completed successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

      const result = await userService.getUserActivity(req.params.id, req.companyId!, { page, limit });

      res.status(200).json({
        success: true,
        message: "User activity history retrieved successfully",
        data: result.activities,
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
}

export const userController = new UserController();
export default userController;

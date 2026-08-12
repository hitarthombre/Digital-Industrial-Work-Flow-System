import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User";
import { Role } from "../models/Role";

export class UserService {
  async getUsers(
    companyId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
    }
  ) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = { companyId };
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("roleId", "name permissions")
        .populate("companyId", "name code"),
      User.countDocuments(filter),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string, companyId: string): Promise<IUser | null> {
    return User.findOne({ _id: userId, companyId })
      .select("-passwordHash")
      .populate("roleId", "name permissions")
      .populate("companyId", "name code");
  }

  async createUser(
    companyId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      phone?: string;
      role?: string;
      roleId?: string;
      departmentId?: string;
    }
  ): Promise<IUser> {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const rawPassword = data.password || "DIWSDefault123!";
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // Resolve Role if roleId or role name provided
    let assignedRoleId = data.roleId;
    let assignedRoleName = data.role || "Employee";

    if (assignedRoleId) {
      const roleObj = await Role.findById(assignedRoleId);
      if (roleObj) {
        assignedRoleName = roleObj.name;
      }
    } else {
      const defaultRoleObj = await Role.findOne({ name: assignedRoleName });
      if (defaultRoleObj) {
        assignedRoleId = (defaultRoleObj._id as any).toString();
      }
    }

    const user = await User.create({
      companyId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: assignedRoleName,
      roleId: assignedRoleId,
      departmentId: data.departmentId,
      status: "active",
      isEmailVerified: false,
    });

    return user;
  }

  async updateUser(
    userId: string,
    companyId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      roleId?: string;
      departmentId?: string;
    }
  ): Promise<IUser | null> {
    const user = await User.findOne({ _id: userId, companyId });
    if (!user) {
      throw new Error("User not found or access denied");
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.departmentId !== undefined) user.departmentId = data.departmentId as any;

    if (data.roleId) {
      const roleObj = await Role.findById(data.roleId);
      if (roleObj) {
        user.roleId = roleObj._id as any;
        user.role = roleObj.name;
      }
    } else if (data.role) {
      user.role = data.role;
    }

    await user.save();
    return User.findById(user._id).select("-passwordHash").populate("roleId", "name permissions");
  }

  async updateUserStatus(userId: string, companyId: string, status: "active" | "inactive"): Promise<IUser | null> {
    const user = await User.findOne({ _id: userId, companyId });
    if (!user) {
      throw new Error("User not found or access denied");
    }

    user.status = status;
    await user.save();
    return User.findById(user._id).select("-passwordHash");
  }

  async deleteUser(userId: string, companyId: string): Promise<boolean> {
    const user = await User.findOne({ _id: userId, companyId });
    if (!user) {
      throw new Error("User not found or access denied");
    }

    await User.deleteOne({ _id: userId });
    return true;
  }

  /**
   * Invite a new user to join a company workspace.
   */
  async inviteUser(
    companyId: string,
    invitedByUserId: string,
    data: {
      email: string;
      role?: string;
      roleId?: string;
      departmentId?: string;
    }
  ) {
    const crypto = await import("crypto");
    const { UserInvitation } = await import("../models/UserInvitation");
    const { auditService } = await import("./audit.service");
    const { notificationService } = await import("./notification.service");
    const { Company } = await import("../models/Company");

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error("User with this email is already registered");
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error("Company workspace not found");
    }

    // Deactivate previous pending invitations for this email
    await UserInvitation.updateMany(
      { companyId, email: data.email.toLowerCase(), status: "pending" },
      { status: "expired" }
    );

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let assignedRoleId = data.roleId;
    let assignedRoleName = data.role || "Employee";

    if (assignedRoleId) {
      const roleObj = await Role.findById(assignedRoleId);
      if (roleObj) {
        assignedRoleName = roleObj.name;
      }
    }

    const invitation = await UserInvitation.create({
      companyId,
      email: data.email.toLowerCase(),
      role: assignedRoleName,
      roleId: assignedRoleId,
      departmentId: data.departmentId,
      invitedBy: invitedByUserId,
      token,
      status: "pending",
      expiresAt,
    });

    // Send invitation email via notification service (using Resend API)
    const appUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

    await notificationService.createNotification(
      companyId,
      invitedByUserId,
      `Workspace Invitation to ${company.name}`,
      `You have been invited to join ${company.name} as ${assignedRoleName}.\n\nClick the link below to set up your account:\n${inviteUrl}`,
      "system_alert",
      data.email
    );

    await auditService.log({
      companyId,
      userId: invitedByUserId,
      action: "user:invite",
      module: "user",
      referenceId: invitation._id.toString(),
      after: { email: data.email, role: assignedRoleName },
    });

    return {
      id: invitation._id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      inviteUrl,
    };
  }

  /**
   * Verify an invitation token.
   */
  async verifyInvitationToken(token: string) {
    const { UserInvitation } = await import("../models/UserInvitation");
    const invitation = await UserInvitation.findOne({ token, status: "pending" })
      .populate("companyId", "name code logo")
      .populate("invitedBy", "firstName lastName email");

    if (!invitation) {
      throw new Error("Invalid or expired invitation token");
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      throw new Error("Invitation token has expired");
    }

    return invitation;
  }

  /**
   * Accept invitation and complete user creation.
   */
  async acceptInvitation(data: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
  }) {
    const { UserInvitation } = await import("../models/UserInvitation");
    const { auditService } = await import("./audit.service");

    const invitation = await UserInvitation.findOne({ token: data.token, status: "pending" });
    if (!invitation) {
      throw new Error("Invalid or expired invitation token");
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      throw new Error("Invitation token has expired");
    }

    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      throw new Error("User account with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      companyId: invitation.companyId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: invitation.email,
      phone: data.phone,
      passwordHash,
      role: invitation.role,
      roleId: invitation.roleId,
      departmentId: invitation.departmentId,
      status: "active",
      isEmailVerified: true,
    });

    invitation.status = "accepted";
    await invitation.save();

    await auditService.log({
      companyId: invitation.companyId.toString(),
      userId: user._id.toString(),
      action: "user:accept_invite",
      module: "user",
      referenceId: user._id.toString(),
      after: { email: user.email, role: user.role },
    });

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  /**
   * Retrieve user activity history timeline from Audit Logs.
   */
  async getUserActivity(
    userId: string,
    companyId: string,
    query: { page?: number; limit?: number }
  ) {
    const { AuditLog } = await import("../models/AuditLog");

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || 15, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {
      userId,
      companyId,
    };

    const [activities, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "firstName lastName email role"),
      AuditLog.countDocuments(filter),
    ]);

    return {
      activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const userService = new UserService();
export default userService;

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
}

export const userService = new UserService();
export default userService;

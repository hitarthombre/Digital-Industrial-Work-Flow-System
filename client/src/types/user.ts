export type UserStatus = "active" | "inactive";

export interface IRole {
  _id: string;
  name: string;
  permissions?: string[];
  description?: string;
}

export interface IDepartment {
  _id: string;
  name: string;
  code?: string;
}

export interface IUser {
  _id: string;
  companyId?: string | { _id: string; name: string; code: string };
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  roleId?: IRole | string | null;
  departmentId?: IDepartment | string | null;
  status: UserStatus;
  isEmailVerified?: boolean;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserInvitation {
  _id: string;
  companyId?: string | { _id: string; name: string; code: string };
  email: string;
  role?: string;
  roleId?: string;
  departmentId?: string;
  invitedBy?: string | { _id: string; firstName: string; lastName: string; email: string };
  token?: string;
  status: "pending" | "accepted" | "expired";
  expiresAt?: string;
  createdAt?: string;
}

export interface IUserActivity {
  _id: string;
  companyId?: string;
  userId?: string | { _id: string; firstName: string; lastName: string; email: string; role?: string };
  action: string;
  module?: string;
  referenceId?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  role?: string;
  roleId?: string;
  departmentId?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  roleId?: string;
  departmentId?: string;
}

export interface InviteUserInput {
  email: string;
  role?: string;
  roleId?: string;
  departmentId?: string;
}

export interface AcceptInvitationInput {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface GetUsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface GetUsersResponse {
  success: boolean;
  message?: string;
  data: IUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

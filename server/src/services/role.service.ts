import { Role, IRole } from "../models/Role";
import { Permission, IPermission } from "../models/Permission";

export const SYSTEM_PERMISSIONS = [
  { code: "company:read", module: "company", description: "View company profile and settings" },
  { code: "company:create", module: "company", description: "Create new company tenant" },
  { code: "company:update", module: "company", description: "Update company details and information" },
  { code: "company:delete", module: "company", description: "Soft delete or deactivate company" },
  { code: "company:settings:read", module: "company", description: "View company settings and configuration" },
  { code: "company:settings:update", module: "company", description: "Update company settings and configuration" },
  { code: "company:branding:update", module: "company", description: "Update company branding and logo" },
  { code: "company:status:update", module: "company", description: "Update company operational status" },
  
  { code: "users:read", module: "users", description: "View company users" },
  { code: "users:create", module: "users", description: "Invite or create new users" },
  { code: "users:update", module: "users", description: "Update user details and status" },
  { code: "users:delete", module: "users", description: "Delete users" },
  
  { code: "roles:read", module: "roles", description: "View role definitions" },
  { code: "roles:manage", module: "roles", description: "Create and modify roles and permissions" },
  
  { code: "inventory:read", module: "inventory", description: "View stock levels and inventory items" },
  { code: "inventory:create", module: "inventory", description: "Add stock in/out and adjustments" },
  { code: "inventory:update", module: "inventory", description: "Modify stock items and locations" },
  
  { code: "production:read", module: "production", description: "View production plans and work orders" },
  { code: "production:create", module: "production", description: "Create production plans and work orders" },
  { code: "production:update", module: "production", description: "Update work order stages and material consumption" },
  
  { code: "procurement:read", module: "procurement", description: "View purchase requests and purchase orders" },
  { code: "procurement:create", module: "procurement", description: "Create purchase requests and orders" },
  { code: "procurement:update", module: "procurement", description: "Update purchase orders and GRN" },
  
  { code: "sales:read", module: "sales", description: "View quotations, sales orders and invoices" },
  { code: "sales:create", module: "sales", description: "Create quotations and sales orders" },
  { code: "sales:update", module: "sales", description: "Update sales orders and invoices" },
  
  { code: "dispatch:read", module: "dispatch", description: "View dispatch orders and tracking" },
  { code: "dispatch:create", module: "dispatch", description: "Create dispatch orders and shipments" },
  { code: "dispatch:update", module: "dispatch", description: "Update shipment status and transport details" },
  
  { code: "documents:read", module: "documents", description: "View uploaded documents and attachments" },
  { code: "documents:create", module: "documents", description: "Upload new documents" },
  { code: "documents:delete", module: "documents", description: "Delete documents" },
  
  { code: "reports:read", module: "reports", description: "View system reports and analytics" },
];

export const DEFAULT_ROLES = [
  {
    name: "Company Owner",
    description: "Full access to all platform features and company settings",
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
    isSystemRole: true,
  },
  {
    name: "Company Admin",
    description: "Full operational and user administrative privileges",
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
    isSystemRole: true,
  },
  {
    name: "Factory Manager",
    description: "Manages factory production plans, stages, and raw material inventory",
    permissions: [
      "inventory:read", "inventory:update",
      "production:read", "production:create", "production:update",
      "documents:read", "reports:read",
    ],
    isSystemRole: true,
  },
  {
    name: "Warehouse Manager",
    description: "Manages warehouse stock movements, adjustments, and dispatching",
    permissions: [
      "inventory:read", "inventory:create", "inventory:update",
      "dispatch:read", "documents:read", "reports:read",
    ],
    isSystemRole: true,
  },
  {
    name: "Production Planner",
    description: "Schedules production plans and work orders",
    permissions: [
      "production:read", "production:create", "production:update",
      "inventory:read", "documents:read", "reports:read",
    ],
    isSystemRole: true,
  },
  {
    name: "Purchase Manager",
    description: "Handles supplier relations, purchase requests, and orders",
    permissions: [
      "procurement:read", "procurement:create", "procurement:update",
      "inventory:read", "documents:read", "reports:read",
    ],
    isSystemRole: true,
  },
  {
    name: "Sales Executive",
    description: "Creates quotations and handles customer orders",
    permissions: [
      "sales:read", "sales:create", "sales:update",
      "inventory:read", "documents:read", "reports:read",
    ],
    isSystemRole: true,
  },
  {
    name: "Dispatch Manager",
    description: "Manages delivery tracking and logistics",
    permissions: [
      "dispatch:read", "dispatch:create", "dispatch:update",
      "inventory:read", "documents:read", "reports:read",
    ],
    isSystemRole: true,
  },
  {
    name: "Employee",
    description: "Standard employee read access to basic operational modules",
    permissions: [
      "inventory:read", "production:read", "procurement:read",
      "sales:read", "dispatch:read", "documents:read",
    ],
    isSystemRole: true,
  },
];

export class RoleService {
  async initDefaultRolesAndPermissions(): Promise<void> {
    try {
      // 1. Seed Permissions Catalog
      for (const perm of SYSTEM_PERMISSIONS) {
        await Permission.updateOne(
          { code: perm.code },
          { $set: perm },
          { upsert: true }
        );
      }

      // 2. Seed Default Roles
      for (const role of DEFAULT_ROLES) {
        await Role.updateOne(
          { name: role.name, companyId: null },
          { $set: role },
          { upsert: true }
        );
      }
      console.log("[RoleService] Default system permissions & roles initialized.");
    } catch (error) {
      console.error("[RoleService Initialization Error]", error);
    }
  }

  async getPermissions(): Promise<IPermission[]> {
    return Permission.find().sort({ module: 1, code: 1 });
  }

  async getRoles(companyId?: string): Promise<IRole[]> {
    return Role.find({
      $or: [{ isSystemRole: true }, { companyId }],
    }).sort({ name: 1 });
  }

  async getRoleById(roleId: string, companyId?: string): Promise<IRole | null> {
    return Role.findOne({
      _id: roleId,
      $or: [{ isSystemRole: true }, { companyId }],
    });
  }

  async createRole(companyId: string, name: string, description: string | undefined, permissions: string[]): Promise<IRole> {
    const existing = await Role.findOne({ name, companyId });
    if (existing) {
      throw new Error(`Role '${name}' already exists in this company`);
    }

    return Role.create({
      companyId,
      name,
      description,
      permissions,
      isSystemRole: false,
    });
  }

  async updateRole(roleId: string, companyId: string, data: { name?: string; description?: string; permissions?: string[] }): Promise<IRole | null> {
    const role = await Role.findOne({ _id: roleId, companyId });
    if (!role) {
      throw new Error("Custom role not found or access denied");
    }

    if (role.isSystemRole) {
      throw new Error("System roles cannot be modified");
    }

    if (data.name) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    if (data.permissions) role.permissions = data.permissions;

    return role.save();
  }

  async deleteRole(roleId: string, companyId: string): Promise<boolean> {
    const role = await Role.findOne({ _id: roleId, companyId });
    if (!role || role.isSystemRole) {
      throw new Error("Role not found or system roles cannot be deleted");
    }

    await Role.deleteOne({ _id: roleId });
    return true;
  }
}

export const roleService = new RoleService();
export default roleService;

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB } from '../config/db';
import { Company } from '../models/Company';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { EmailVerification } from '../models/EmailVerification';
import { PasswordReset } from '../models/PasswordReset';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { Role } from '../models/Role';
import mongoose from 'mongoose';

async function clearCompanyAndUsers() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('\n--- Checking existing record counts ---');
    const companyCountBefore = await Company.countDocuments();
    const userCountBefore = await User.countDocuments();
    const sessionCountBefore = await Session.countDocuments();
    const emailVerificationCountBefore = await EmailVerification.countDocuments();
    const passwordResetCountBefore = await PasswordReset.countDocuments();
    const notificationCountBefore = await Notification.countDocuments();
    const auditLogCountBefore = await AuditLog.countDocuments();
    const customRoleCountBefore = await Role.countDocuments({ isSystemRole: false });

    console.log(`Companies: ${companyCountBefore}`);
    console.log(`Users: ${userCountBefore}`);
    console.log(`Sessions: ${sessionCountBefore}`);
    console.log(`Email Verifications: ${emailVerificationCountBefore}`);
    console.log(`Password Resets: ${passwordResetCountBefore}`);
    console.log(`Notifications: ${notificationCountBefore}`);
    console.log(`Audit Logs: ${auditLogCountBefore}`);
    console.log(`Custom Company Roles: ${customRoleCountBefore}`);

    console.log('\n--- Clearing Companies, Users, and Associated User Data ---');

    const deletedCompanies = await Company.deleteMany({});
    console.log(`✓ Deleted ${deletedCompanies.deletedCount} Companies`);

    const deletedUsers = await User.deleteMany({});
    console.log(`✓ Deleted ${deletedUsers.deletedCount} Users`);

    const deletedSessions = await Session.deleteMany({});
    console.log(`✓ Deleted ${deletedSessions.deletedCount} Sessions`);

    const deletedEmailVerifications = await EmailVerification.deleteMany({});
    console.log(`✓ Deleted ${deletedEmailVerifications.deletedCount} Email Verifications`);

    const deletedPasswordResets = await PasswordReset.deleteMany({});
    console.log(`✓ Deleted ${deletedPasswordResets.deletedCount} Password Resets`);

    const deletedNotifications = await Notification.deleteMany({});
    console.log(`✓ Deleted ${deletedNotifications.deletedCount} Notifications`);

    const deletedAuditLogs = await AuditLog.deleteMany({});
    console.log(`✓ Deleted ${deletedAuditLogs.deletedCount} Audit Logs`);

    const deletedCustomRoles = await Role.deleteMany({ isSystemRole: false });
    console.log(`✓ Deleted ${deletedCustomRoles.deletedCount} Custom Company Roles`);

    console.log('\n✅ Database successfully cleared for Companies and Users!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

clearCompanyAndUsers();

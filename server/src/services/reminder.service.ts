import { Types } from "mongoose";
import { WorkOrder } from "../models/WorkOrder";
import { SalesInvoice } from "../models/SalesInvoice";
import { SalesOrder } from "../models/SalesOrder";
import { PurchaseOrder } from "../models/PurchaseOrder";
import { PurchaseRequest } from "../models/PurchaseRequest";
import { DispatchOrder } from "../models/DispatchOrder";
import { Notification, NotificationType } from "../models/Notification";
import { User } from "../models/User";
import { notificationService } from "./notification.service";
import { salesService } from "./sales.service";
import { logger } from "../config/logger";

interface Reminder {
  companyId: string;
  recipients: Array<string | Types.ObjectId | undefined>;
  title: string;
  message: string;
  link: string;
  key: string;
  type?: NotificationType;
}

const DAY_MS = 86400000;
const day = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Task reminders: periodically scans for work that is overdue or due soon and
 * nudges the responsible users in-app. Each reminder fires at most once per day.
 */
export class ReminderService {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMinutes = Number(process.env.REMINDER_INTERVAL_MINUTES) || 60) {
    if (this.timer) return;
    // First sweep shortly after boot, then on a fixed interval
    setTimeout(() => this.run().catch((e) => logger.warn(`[Reminders] ${e.message}`)), 30000);
    this.timer = setInterval(
      () => this.run().catch((e) => logger.warn(`[Reminders] ${e.message}`)),
      intervalMinutes * 60000
    );
    logger.info(`[Reminders] Task reminder scheduler running every ${intervalMinutes} minutes`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async adminsOf(companyId: string) {
    const admins = await User.find({ companyId, status: "active", role: { $in: ["Company Owner", "Company Admin"] } }).select("_id");
    return admins.map((a) => a._id);
  }

  async collect(companyId?: string): Promise<Reminder[]> {
    const now = new Date();
    const today = day(now);
    const scope: any = { isDeleted: { $ne: true } };
    if (companyId) scope.companyId = companyId;
    const reminders: Reminder[] = [];

    await salesService.markOverdueInvoices(companyId);

    const [workOrders, overdueInvoices, dueSoonInvoices, latePOs, lateDispatches, staleOrders, staleRequests] = await Promise.all([
      WorkOrder.find({ ...scope, status: { $nin: ["Completed", "Cancelled"] }, plannedEndDate: { $lt: now } }).select(
        "companyId workOrderNumber itemName plannedEndDate assignedTo createdBy"
      ),
      SalesInvoice.find({ ...scope, status: "Overdue" }).select("companyId invoiceNumber balanceDue dueDate createdBy"),
      SalesInvoice.find({
        ...scope,
        status: { $in: ["Unpaid", "Partially Paid"] },
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 3 * DAY_MS) },
      }).select("companyId invoiceNumber balanceDue dueDate createdBy"),
      PurchaseOrder.find({
        ...scope,
        status: { $in: ["PO Created", "Issued", "In Transit", "Partial Delivery"] },
        expectedDeliveryDate: { $lt: now },
      }).select("companyId poNumber expectedDeliveryDate issuerId"),
      DispatchOrder.find({
        ...scope,
        status: { $nin: ["Delivered", "Returned", "Cancelled"] },
        estimatedDeliveryDate: { $lt: now },
      }).select("companyId dispatchNumber estimatedDeliveryDate status createdBy"),
      SalesOrder.find({ ...scope, status: "Pending Approval", createdAt: { $lt: new Date(now.getTime() - DAY_MS) } }).select(
        "companyId orderNumber grandTotal"
      ),
      PurchaseRequest.find({ ...scope, status: "Submitted", createdAt: { $lt: new Date(now.getTime() - DAY_MS) } }).select(
        "companyId requestNumber"
      ),
    ]);

    workOrders.forEach((wo) =>
      reminders.push({
        companyId: String(wo.companyId),
        recipients: [wo.assignedTo, wo.createdBy],
        title: `Overdue: work order ${wo.workOrderNumber}`,
        message: `${wo.itemName} was due on ${day(wo.plannedEndDate as Date)} and is not complete yet.`,
        link: `/app/production/work-orders/${wo._id}`,
        key: `wo-overdue:${wo._id}:${today}`,
      })
    );
    overdueInvoices.forEach((inv) =>
      reminders.push({
        companyId: String(inv.companyId),
        recipients: [inv.createdBy],
        title: `Payment overdue: ${inv.invoiceNumber}`,
        message: `${inv.balanceDue.toFixed(2)} was due on ${day(inv.dueDate)}. Follow up with the customer.`,
        link: "/app/sales/invoices",
        key: `invoice-overdue:${inv._id}:${today}`,
      })
    );
    dueSoonInvoices.forEach((inv) =>
      reminders.push({
        companyId: String(inv.companyId),
        recipients: [inv.createdBy],
        title: `Payment due soon: ${inv.invoiceNumber}`,
        message: `${inv.balanceDue.toFixed(2)} is due on ${day(inv.dueDate)}.`,
        link: "/app/sales/invoices",
        // Remind once per invoice in the due-soon window
        key: `invoice-due:${inv._id}`,
      })
    );
    latePOs.forEach((po) =>
      reminders.push({
        companyId: String(po.companyId),
        recipients: [po.issuerId],
        title: `Late delivery: ${po.poNumber}`,
        message: `Supplier delivery was expected on ${day(po.expectedDeliveryDate as Date)}. Chase the supplier or update the PO.`,
        link: `/app/procurement/orders/${po._id}`,
        key: `po-late:${po._id}:${today}`,
      })
    );
    lateDispatches.forEach((d) =>
      reminders.push({
        companyId: String(d.companyId),
        recipients: [d.createdBy],
        title: `Delayed shipment: ${d.dispatchNumber}`,
        message: `Expected delivery was ${day(d.estimatedDeliveryDate as Date)}; shipment is still ${d.status}.`,
        link: `/app/dispatch/${d._id}`,
        key: `dispatch-late:${d._id}:${today}`,
      })
    );

    // Approval queues go to company administrators
    const approvalCompanies = new Set([...staleOrders, ...staleRequests].map((d) => String(d.companyId)));
    const adminMap = new Map<string, Types.ObjectId[]>();
    for (const cid of approvalCompanies) adminMap.set(cid, await this.adminsOf(cid));

    staleOrders.forEach((so) =>
      reminders.push({
        companyId: String(so.companyId),
        recipients: adminMap.get(String(so.companyId)) || [],
        title: `Approval pending: ${so.orderNumber}`,
        message: `Sales order ${so.orderNumber} (${so.grandTotal.toFixed(2)}) has been waiting for approval for over a day.`,
        link: `/app/sales/orders/${so._id}`,
        key: `so-approval:${so._id}:${today}`,
      })
    );
    staleRequests.forEach((pr) =>
      reminders.push({
        companyId: String(pr.companyId),
        recipients: adminMap.get(String(pr.companyId)) || [],
        title: `Approval pending: ${pr.requestNumber}`,
        message: `Purchase request ${pr.requestNumber} has been waiting for review for over a day.`,
        link: "/app/procurement/requests",
        key: `pr-approval:${pr._id}:${today}`,
      })
    );

    return reminders;
  }

  async run(companyId?: string): Promise<{ checked: number; sent: number }> {
    const reminders = await this.collect(companyId);
    let sent = 0;

    for (const reminder of reminders) {
      const recipients = [...new Set(reminder.recipients.filter(Boolean).map(String))];
      for (const userId of recipients) {
        const exists = await Notification.exists({ userId, referenceKey: reminder.key });
        if (exists) continue;
        await notificationService.createNotification(
          reminder.companyId,
          userId,
          reminder.title,
          reminder.message,
          reminder.type || "task_reminder",
          undefined,
          { link: reminder.link, referenceKey: reminder.key }
        );
        sent++;
      }
    }

    if (sent > 0) logger.info(`[Reminders] Sent ${sent} task reminder(s) from ${reminders.length} open item(s)`);
    return { checked: reminders.length, sent };
  }
}

export const reminderService = new ReminderService();
export default reminderService;

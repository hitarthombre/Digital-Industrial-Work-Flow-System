import React, { useEffect, useMemo, useState } from "react";
import { FileText, ShoppingBag, ArrowRightLeft, ShieldCheck, Receipt, Wallet } from "lucide-react";
import { FormModal, Field, inputCls } from "../ops/OpsUI";
import { LineItemsEditor, emptyLine, lineTotal } from "../ops/LineItemsEditor";
import type { LineItemRow } from "../ops/LineItemsEditor";
import { useLookup } from "../../hooks/useLookups";
import { useMutation } from "../../hooks/useApiQuery";
import { salesService } from "../../services/operationsService";
import type { IQuotation, ISalesOrder, ISalesInvoice, PaymentMethod } from "../../types/operations";
import { formatMoney } from "../../utils/format";

interface BaseProps {
  onClose: () => void;
  onSaved: (result?: any) => void;
}

const toPayloadLines = (items: LineItemRow[]) =>
  items.map((i) => ({
    productId: i.productId,
    itemName: i.itemName,
    sku: i.sku,
    quantity: Number(i.quantity),
    unit: i.unit,
    unitPrice: Number(i.unitPrice) || 0,
    discountPercent: Number(i.discountPercent) || 0,
    taxRate: Number(i.taxRate) || 0,
  }));

const TotalsPreview: React.FC<{ items: LineItemRow[]; shippingCost: number }> = ({ items, shippingCost }) => {
  const total = items.reduce((s, i) => s + lineTotal(i), 0) + (Number(shippingCost) || 0);
  return (
    <div className="flex justify-end">
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm">
        <span className="text-slate-500 text-xs uppercase font-bold mr-3">Grand total</span>
        <span className="font-mono font-extrabold text-slate-900">{formatMoney(total)}</span>
      </div>
    </div>
  );
};

// ==========================================
// QUOTATION
// ==========================================

export const QuotationModal: React.FC<BaseProps> = ({ onClose, onSaved }) => {
  const { options: customers } = useLookup("customers");
  const { submitting, error, mutate } = useMutation();
  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<LineItemRow[]>([emptyLine()]);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Prices valid until the date shown. Delivery ex-works unless agreed otherwise.");
  const [sendNow, setSendNow] = useState(false);

  useEffect(() => {
    if (!customerId && customers.length) setCustomerId(customers[0]._id);
  }, [customers, customerId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate(() =>
      salesService.createQuotation({
        customerId,
        validUntil,
        items: toPayloadLines(items),
        shippingCost,
        notes: notes || undefined,
        termsAndConditions: terms || undefined,
        status: sendNow ? "Sent" : "Draft",
      })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title="New Quotation"
      subtitle="Price an offer for a customer; convert it to a sales order once accepted"
      icon={<FileText className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel={sendNow ? "Create & Mark Sent" : "Save Draft"}
      error={error}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Customer" required>
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            {customers.length === 0 && <option value="">No customers — add one first</option>}
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.code ? `(${c.code})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valid Until">
          <input type="date" className={inputCls} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </Field>
        <Field label="Shipping Cost">
          <input type="number" min={0} step="any" className={inputCls} value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} />
        </Field>
      </div>
      <LineItemsEditor items={items} onChange={setItems} />
      <TotalsPreview items={items} shippingCost={shippingCost} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Notes">
          <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Field label="Terms & Conditions">
          <textarea className={inputCls} rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
        Mark as sent to the customer
      </label>
    </FormModal>
  );
};

// ==========================================
// SALES ORDER
// ==========================================

export const SalesOrderModal: React.FC<BaseProps> = ({ onClose, onSaved }) => {
  const { options: customers } = useLookup("customers");
  const { options: warehouses } = useLookup("warehouses");
  const { submitting, error, mutate } = useMutation();
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [customerPoNumber, setCustomerPoNumber] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [items, setItems] = useState<LineItemRow[]>([emptyLine()]);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!customerId && customers.length) setCustomerId(customers[0]._id);
  }, [customers, customerId]);
  useEffect(() => {
    if (!warehouseId && warehouses.length) setWarehouseId(warehouses[0]._id);
  }, [warehouses, warehouseId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate(() =>
      salesService.createOrder({
        customerId,
        warehouseId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        customerPoNumber: customerPoNumber || undefined,
        paymentTerms: paymentTerms || undefined,
        items: toPayloadLines(items),
        shippingCost,
        notes: notes || undefined,
      })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title="New Sales Order"
      subtitle="Orders start as Pending Approval and are fulfilled from the selected warehouse"
      icon={<ShoppingBag className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Submit for Approval"
      error={error}
      size="xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Customer" required>
          <select className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            {customers.length === 0 && <option value="">No customers — add one first</option>}
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.code ? `(${c.code})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fulfilment Warehouse" required>
          <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Expected Delivery">
          <input type="date" className={inputCls} value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
        </Field>
        <Field label="Customer PO #">
          <input className={inputCls} value={customerPoNumber} onChange={(e) => setCustomerPoNumber(e.target.value)} />
        </Field>
        <Field label="Payment Terms" hint="Defaults to the customer's terms">
          <input className={inputCls} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 30" />
        </Field>
        <Field label="Shipping Cost">
          <input type="number" min={0} step="any" className={inputCls} value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} />
        </Field>
      </div>
      <LineItemsEditor items={items} onChange={setItems} />
      <TotalsPreview items={items} shippingCost={shippingCost} />
      <Field label="Notes">
        <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormModal>
  );
};

// ==========================================
// CONVERT QUOTATION
// ==========================================

export const ConvertQuotationModal: React.FC<BaseProps & { quotation: IQuotation }> = ({ quotation, onClose, onSaved }) => {
  const { options: warehouses } = useLookup("warehouses");
  const { submitting, error, mutate } = useMutation();
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [customerPoNumber, setCustomerPoNumber] = useState("");

  useEffect(() => {
    if (!warehouseId && warehouses.length) setWarehouseId(warehouses[0]._id);
  }, [warehouses, warehouseId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate(() =>
      salesService.convertQuotation(quotation._id, {
        warehouseId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        customerPoNumber: customerPoNumber || undefined,
      })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title={`Convert ${quotation.quotationNumber} to Sales Order`}
      subtitle={`${quotation.items.length} line(s), total ${formatMoney(quotation.grandTotal)}`}
      icon={<ArrowRightLeft className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Create Sales Order"
      error={error}
      size="md"
    >
      <Field label="Fulfilment Warehouse" required>
        <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Expected Delivery">
          <input type="date" className={inputCls} value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
        </Field>
        <Field label="Customer PO #">
          <input className={inputCls} value={customerPoNumber} onChange={(e) => setCustomerPoNumber(e.target.value)} />
        </Field>
      </div>
    </FormModal>
  );
};

// ==========================================
// ORDER APPROVAL
// ==========================================

export const OrderApprovalModal: React.FC<BaseProps & { order: ISalesOrder }> = ({ order, onClose, onSaved }) => {
  const { submitting, error, setError, mutate } = useMutation();
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === "Rejected" && !rejectionReason.trim()) return setError("Give a reason for rejecting the order");
    const res = await mutate(() =>
      salesService.approveOrder(order._id, {
        status: decision,
        approvalNotes: approvalNotes || undefined,
        rejectionReason: decision === "Rejected" ? rejectionReason : undefined,
      })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title={`Review ${order.orderNumber}`}
      subtitle={`Order value ${formatMoney(order.grandTotal)} · ${order.items.length} line(s)`}
      icon={<ShieldCheck className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel={decision === "Approved" ? "Approve Order" : "Reject Order"}
      error={error}
      size="md"
    >
      <div className="grid grid-cols-2 gap-2">
        {(["Approved", "Rejected"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDecision(d)}
            className={`rounded-lg border p-3 text-sm font-bold ${
              decision === d
                ? d === "Approved"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-rose-500 bg-rose-50 text-rose-800"
                : "border-slate-200 text-slate-500"
            }`}
          >
            {d === "Approved" ? "Approve" : "Reject"}
          </button>
        ))}
      </div>
      {decision === "Rejected" ? (
        <Field label="Rejection Reason" required>
          <textarea className={inputCls} rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
        </Field>
      ) : (
        <Field label="Approval Notes">
          <textarea className={inputCls} rows={3} value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} />
        </Field>
      )}
    </FormModal>
  );
};

// ==========================================
// INVOICE
// ==========================================

export const InvoiceModal: React.FC<BaseProps & { order: ISalesOrder }> = ({ order, onClose, onSaved }) => {
  const { submitting, error, mutate } = useMutation();
  const defaultDue = useMemo(() => {
    const days = Number((order.paymentTerms || "").match(/\d+/)?.[0] || 30);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }, [order.paymentTerms]);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await mutate(() => salesService.createInvoice({ salesOrderId: order._id, dueDate, notes: notes || undefined }));
    onSaved(res.data);
  };

  return (
    <FormModal
      title={`Invoice ${order.orderNumber}`}
      subtitle={`Bills the full order value of ${formatMoney(order.grandTotal)} (${order.paymentTerms || "Net 30"})`}
      icon={<Receipt className="text-amber-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Create Invoice"
      error={error}
      size="md"
    >
      <Field label="Due Date" required>
        <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </Field>
      <Field label="Notes">
        <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormModal>
  );
};

// ==========================================
// PAYMENT
// ==========================================

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "other", label: "Other" },
];

export const PaymentModal: React.FC<BaseProps & { invoice: ISalesInvoice }> = ({ invoice, onClose, onSaved }) => {
  const { submitting, error, setError, mutate } = useMutation();
  const [amount, setAmount] = useState<number>(invoice.balanceDue);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return setError("Enter a payment amount");
    if (amount > invoice.balanceDue + 0.001) return setError(`Amount exceeds the balance due of ${formatMoney(invoice.balanceDue)}`);
    const res = await mutate(() =>
      salesService.recordPayment(invoice._id, { amount, paymentDate, method, reference: reference || undefined, notes: notes || undefined })
    );
    onSaved(res.data);
  };

  return (
    <FormModal
      title={`Record Payment — ${invoice.invoiceNumber}`}
      subtitle={`Balance due ${formatMoney(invoice.balanceDue)} of ${formatMoney(invoice.grandTotal)}`}
      icon={<Wallet className="text-emerald-600" size={22} />}
      onClose={onClose}
      onSubmit={(e) => submit(e).catch(() => undefined)}
      submitting={submitting}
      submitLabel="Record Payment"
      error={error}
      size="md"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount" required>
          <input type="number" min={0.01} step="any" className={inputCls} value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
        </Field>
        <Field label="Payment Date" required>
          <input type="date" className={inputCls} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        </Field>
        <Field label="Method">
          <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference">
          <input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn / cheque #" />
        </Field>
        <Field label="Notes" className="col-span-2">
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </FormModal>
  );
};

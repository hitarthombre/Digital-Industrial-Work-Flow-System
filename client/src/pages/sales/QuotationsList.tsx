import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, RefreshCw, Send, CheckCircle2, XCircle, ArrowRightLeft, ExternalLink } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader, StatusBadge, LoadingBox, EmptyBox, ErrorBanner, Pager } from "../../components/ops/OpsUI";
import { ListFilters, toQuery } from "../../components/ops/ListFilters";
import type { ListFilterValue } from "../../components/ops/ListFilters";
import { SalesNav } from "../../components/sales/SalesNav";
import { QuotationModal, ConvertQuotationModal } from "../../components/sales/SalesModals";
import { useApiQuery, useDebounced, useMutation } from "../../hooks/useApiQuery";
import { salesService } from "../../services/operationsService";
import type { IQuotation, QuotationStatus } from "../../types/operations";
import { formatDate, formatMoney, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const STATUSES = ["Draft", "Sent", "Accepted", "Rejected", "Expired", "Converted"];

export const QuotationsList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListFilterValue>({});
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState<IQuotation | null>(null);
  const action = useMutation();

  const query = toQuery({ ...filters, search: useDebounced(filters.search) }, page);
  const list = useApiQuery(() => salesService.getQuotations(query), [query]);

  const setStatus = async (q: IQuotation, status: QuotationStatus) => {
    await action.mutate(() => salesService.updateQuotationStatus(q._id, status)).catch(() => undefined);
    list.refetch();
  };

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<FileText className="text-amber-600" size={28} />}
        title="Quotations"
        subtitle="Prepare price offers and convert accepted quotations into sales orders."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={list.refetch}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
              New Quotation
            </Button>
          </>
        }
      />
      <SalesNav />
      <ListFilters
        module="quotations"
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        searchPlaceholder="Search quotation #, product or SKU..."
        statuses={STATUSES}
      />
      <ErrorBanner message={list.error || action.error} onRetry={list.refetch} />

      <div className="proc-card p-0 overflow-hidden">
        {list.loading ? (
          <LoadingBox label="Loading quotations..." />
        ) : !list.data?.data.length ? (
          <EmptyBox icon={<FileText size={40} />} title="No quotations" message="Create a quotation to send prices to a customer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="proc-table">
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Valid Until</th>
                  <th>Lines</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((q) => (
                  <tr key={q._id}>
                    <td>
                      <span className="proc-code-tag">{q.quotationNumber}</span>
                    </td>
                    <td className="font-semibold">{refName(q.customerId)}</td>
                    <td className="text-xs">{formatDate(q.quotationDate)}</td>
                    <td className="text-xs">{formatDate(q.validUntil)}</td>
                    <td className="text-xs">{q.items.length}</td>
                    <td className="font-mono font-bold">{formatMoney(q.grandTotal)}</td>
                    <td>
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {q.status === "Draft" && (
                          <Button variant="outline" size="sm" icon={<Send size={13} />} disabled={action.submitting} onClick={() => setStatus(q, "Sent")}>
                            Mark Sent
                          </Button>
                        )}
                        {(q.status === "Draft" || q.status === "Sent") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<CheckCircle2 size={13} className="text-emerald-600" />}
                              disabled={action.submitting}
                              onClick={() => setStatus(q, "Accepted")}
                            >
                              Accepted
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<XCircle size={13} className="text-rose-600" />}
                              disabled={action.submitting}
                              onClick={() => setStatus(q, "Rejected")}
                            >
                              Rejected
                            </Button>
                          </>
                        )}
                        {["Draft", "Sent", "Accepted"].includes(q.status) && (
                          <Button variant="primary" size="sm" icon={<ArrowRightLeft size={13} />} onClick={() => setConverting(q)}>
                            Convert
                          </Button>
                        )}
                        {q.status === "Expired" && (
                          <Button variant="outline" size="sm" icon={<Send size={13} />} disabled={action.submitting} onClick={() => setStatus(q, "Sent")}>
                            Re-send
                          </Button>
                        )}
                        {q.salesOrderId && typeof q.salesOrderId === "object" && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<ExternalLink size={13} />}
                            onClick={() => navigate(`/app/sales/orders/${(q.salesOrderId as { _id: string })._id}`)}
                          >
                            {q.salesOrderId.orderNumber}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data?.pagination && <Pager {...list.data.pagination} page={page} onChange={setPage} />}
      </div>

      {creating && (
        <QuotationModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            list.refetch();
          }}
        />
      )}
      {converting && (
        <ConvertQuotationModal
          quotation={converting}
          onClose={() => setConverting(null)}
          onSaved={(result) => {
            setConverting(null);
            navigate(`/app/sales/orders/${result.order._id}`);
          }}
        />
      )}
    </div>
  );
};

export default QuotationsList;

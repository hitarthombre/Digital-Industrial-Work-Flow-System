import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Plus, RefreshCw, Eye } from "lucide-react";
import { Button } from "../../components/Button";
import { PageHeader, StatusBadge, LoadingBox, EmptyBox, ErrorBanner, Pager } from "../../components/ops/OpsUI";
import { ListFilters, toQuery } from "../../components/ops/ListFilters";
import type { ListFilterValue } from "../../components/ops/ListFilters";
import { SalesNav } from "../../components/sales/SalesNav";
import { SalesOrderModal } from "../../components/sales/SalesModals";
import { useApiQuery, useDebounced } from "../../hooks/useApiQuery";
import { salesService } from "../../services/operationsService";
import { formatDate, formatMoney, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const STATUSES = ["Pending Approval", "Approved", "Processing", "Partially Dispatched", "Dispatched", "Delivered", "Rejected", "Cancelled"];

export const SalesOrdersList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ListFilterValue>({});
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const query = toQuery({ ...filters, search: useDebounced(filters.search) }, page);
  const list = useApiQuery(() => salesService.getOrders(query), [query]);

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<ShoppingBag className="text-amber-600" size={28} />}
        title="Sales Orders"
        subtitle="Approve customer orders and follow them through dispatch, invoicing and payment."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={list.refetch}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
              New Sales Order
            </Button>
          </>
        }
      />
      <SalesNav />
      <ListFilters
        module="sales_orders"
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
        searchPlaceholder="Search SO #, customer PO #, product or SKU..."
        statuses={STATUSES}
        showWarehouse
        sortOptions={[
          { value: "orderDate", label: "Order date" },
          { value: "grandTotal", label: "Order value" },
          { value: "expectedDeliveryDate", label: "Delivery date" },
        ]}
      />
      <ErrorBanner message={list.error} onRetry={list.refetch} />

      <div className="proc-card p-0 overflow-hidden">
        {list.loading ? (
          <LoadingBox label="Loading sales orders..." />
        ) : !list.data?.data.length ? (
          <EmptyBox icon={<ShoppingBag size={40} />} title="No sales orders" message="Create an order directly or convert a quotation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="proc-table">
              <thead>
                <tr>
                  <th>SO #</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.data.map((o) => (
                  <tr key={o._id} className="cursor-pointer" onClick={() => navigate(`/app/sales/orders/${o._id}`)}>
                    <td>
                      <span className="proc-code-tag">{o.orderNumber}</span>
                      {o.customerPoNumber && <div className="text-[10px] text-slate-400 mt-1">PO {o.customerPoNumber}</div>}
                    </td>
                    <td>
                      <div className="font-semibold">{refName(o.customerId)}</div>
                      <div className="text-[11px] text-slate-500">{refName(o.warehouseId)}</div>
                    </td>
                    <td className="text-xs">{formatDate(o.orderDate)}</td>
                    <td className="text-xs">{formatDate(o.expectedDeliveryDate)}</td>
                    <td className="font-mono font-bold">{formatMoney(o.grandTotal)}</td>
                    <td>
                      <StatusBadge status={o.paymentStatus} />
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="text-right">
                      <Button variant="outline" size="sm" icon={<Eye size={14} />}>
                        Open
                      </Button>
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
        <SalesOrderModal
          onClose={() => setCreating(false)}
          onSaved={(order) => {
            setCreating(false);
            navigate(`/app/sales/orders/${order._id}`);
          }}
        />
      )}
    </div>
  );
};

export default SalesOrdersList;

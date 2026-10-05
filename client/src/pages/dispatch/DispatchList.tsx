import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Plus, RefreshCw, Eye, PackageCheck, Clock, AlertTriangle, Gauge } from "lucide-react";
import { Button } from "../../components/Button";
import { Chart } from "../../components/Chart";
import { PageHeader, StatusBadge, LoadingBox, EmptyBox, ErrorBanner, Pager, KpiCard, TabBar, SectionCard, BarList } from "../../components/ops/OpsUI";
import { ListFilters, toQuery } from "../../components/ops/ListFilters";
import type { ListFilterValue } from "../../components/ops/ListFilters";
import { DispatchOrderModal } from "../../components/dispatch/DispatchModals";
import { useApiQuery, useDebounced } from "../../hooks/useApiQuery";
import { dispatchService } from "../../services/operationsService";
import { formatDate, formatMoney, refName, humanize } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const STATUSES = ["Pending", "Packed", "Shipped", "In Transit", "Out for Delivery", "Delivered", "Returned", "Cancelled"];

export const DispatchList: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"shipments" | "reports">("shipments");
  const [filters, setFilters] = useState<ListFilterValue>({});
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const query = toQuery({ ...filters, search: useDebounced(filters.search) }, page);
  const list = useApiQuery(() => dispatchService.getDispatches(query), [query], { enabled: tab === "shipments" });
  const reports = useApiQuery(() => dispatchService.getReports(), []);
  const r = reports.data?.data;

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<Truck className="text-amber-600" size={28} />}
        title="Dispatch & Logistics"
        subtitle="Create dispatch orders, record transport details, track deliveries and keep shipping documents."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => {
                list.refetch();
                reports.refetch();
              }}
            >
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
              New Dispatch
            </Button>
          </>
        }
      />

      <div className="proc-kpi-grid">
        <KpiCard label="Awaiting Shipment" value={r ? r.pending : "—"} sub="Pending or packed" icon={<Clock size={22} />} />
        <KpiCard label="In Transit" value={r ? r.inTransit : "—"} sub={`${r?.delayed ?? 0} delayed`} icon={<Truck size={22} />} tone="blue" />
        <KpiCard label="Delivered" value={r ? r.delivered : "—"} sub={`${r?.returned ?? 0} returned`} icon={<PackageCheck size={22} />} tone="emerald" />
        <KpiCard label="On-time Delivery" value={r ? `${r.onTimeDeliveryRate}%` : "—"} sub={`Avg ${r?.averageTransitDays ?? 0} days in transit`} icon={<Gauge size={22} />} tone="purple" />
      </div>

      <TabBar
        active={tab}
        onChange={(k) => setTab(k as typeof tab)}
        tabs={[
          { key: "shipments", label: "Shipments", count: r?.totalDispatches },
          { key: "reports", label: "Dispatch Reports" },
        ]}
      />

      {tab === "shipments" && (
        <>
          <ListFilters
            module="dispatches"
            value={filters}
            onChange={(v) => {
              setFilters(v);
              setPage(1);
            }}
            searchPlaceholder="Search dispatch #, tracking #, vehicle, carrier or SKU..."
            statuses={STATUSES}
            showWarehouse
            sortOptions={[
              { value: "createdAt", label: "Created" },
              { value: "estimatedDeliveryDate", label: "ETA" },
              { value: "actualDispatchDate", label: "Shipped date" },
            ]}
          />
          <ErrorBanner message={list.error} onRetry={list.refetch} />
          <div className="proc-card p-0 overflow-hidden">
            {list.loading ? (
              <LoadingBox label="Loading shipments..." />
            ) : !list.data?.data.length ? (
              <EmptyBox icon={<Truck size={40} />} title="No dispatch orders" message="Create a dispatch from a sales order or ship stock directly." />
            ) : (
              <div className="overflow-x-auto">
                <table className="proc-table">
                  <thead>
                    <tr>
                      <th>Dispatch #</th>
                      <th>Customer / Order</th>
                      <th>From</th>
                      <th>Carrier</th>
                      <th>ETA</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {list.data.data.map((d) => {
                      const delayed =
                        d.estimatedDeliveryDate && new Date(d.estimatedDeliveryDate) < new Date() && !["Delivered", "Returned", "Cancelled"].includes(d.status);
                      return (
                        <tr key={d._id} className="cursor-pointer" onClick={() => navigate(`/app/dispatch/${d._id}`)}>
                          <td>
                            <span className="proc-code-tag">{d.dispatchNumber}</span>
                            <div className="text-[10px] text-slate-400 mt-1">{d.items.length} item line(s)</div>
                          </td>
                          <td>
                            <div className="font-semibold">{refName(d.customerId, "Internal")}</div>
                            {d.salesOrderId && typeof d.salesOrderId === "object" && (
                              <div className="text-[11px] text-slate-500">{d.salesOrderId.orderNumber}</div>
                            )}
                          </td>
                          <td className="text-xs">{refName(d.warehouseId)}</td>
                          <td className="text-xs">
                            <div>{d.transport?.carrierName || "—"}</div>
                            <div className="text-[11px] text-slate-500">
                              {d.transport?.mode ? humanize(d.transport.mode) : ""} {d.transport?.trackingNumber || d.transport?.vehicleNumber || ""}
                            </div>
                          </td>
                          <td className={`text-xs ${delayed ? "text-rose-600 font-bold" : ""}`}>
                            {formatDate(d.estimatedDeliveryDate)}
                            {delayed && <div className="text-[10px]">Delayed</div>}
                          </td>
                          <td>
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="text-right">
                            <Button variant="outline" size="sm" icon={<Eye size={14} />}>
                              Track
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {list.data?.pagination && <Pager {...list.data.pagination} page={page} onChange={setPage} />}
          </div>
        </>
      )}

      {tab === "reports" && (
        <>
          <ErrorBanner message={reports.error} onRetry={reports.refetch} />
          {!r ? (
            <LoadingBox label="Building dispatch report..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title="Shipments per Month" className="lg:col-span-2">
                <Chart data={r.monthlyShipments} type="bar" height={240} color="#2563eb" />
              </SectionCard>
              <SectionCard title="By Status">
                <BarList rows={STATUSES.map((s) => ({ label: s, value: r.byStatus[s] || 0 }))} />
              </SectionCard>
              <SectionCard title="By Transport Mode" className="lg:col-span-2">
                <BarList
                  color="#059669"
                  rows={r.byTransportMode.map((m) => ({ label: humanize(m.mode), value: m.count, display: `${m.count} · freight ${formatMoney(m.freight)}` }))}
                />
              </SectionCard>
              <SectionCard title="Performance" icon={<AlertTriangle size={16} className="text-amber-600" />}>
                <dl className="text-xs space-y-2">
                  {[
                    ["Total dispatches", r.totalDispatches],
                    ["On-time delivery", `${r.onTimeDeliveryRate}%`],
                    ["Average transit", `${r.averageTransitDays} days`],
                    ["Currently delayed", r.delayed],
                    ["Total freight cost", formatMoney(r.totalFreightCost)],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between border-b border-slate-100 pb-1.5">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-mono font-bold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            </div>
          )}
        </>
      )}

      {creating && (
        <DispatchOrderModal
          onClose={() => setCreating(false)}
          onSaved={(dispatch) => {
            setCreating(false);
            navigate(`/app/dispatch/${dispatch._id}`);
          }}
        />
      )}
    </div>
  );
};

export default DispatchList;

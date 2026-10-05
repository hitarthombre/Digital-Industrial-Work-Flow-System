import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Plus, RefreshCw, ClipboardList, CalendarRange, Gauge, AlertTriangle, Factory, Eye, CheckCircle2, XCircle, List, KanbanSquare } from "lucide-react";
import { Button } from "../../components/Button";
import { Chart } from "../../components/Chart";
import {
  PageHeader,
  TabBar,
  KpiCard,
  StatusBadge,
  LoadingBox,
  EmptyBox,
  ErrorBanner,
  Pager,
  SectionCard,
  BarList,
} from "../../components/ops/OpsUI";
import { ListFilters, toQuery } from "../../components/ops/ListFilters";
import type { ListFilterValue } from "../../components/ops/ListFilters";
import { ProductionPlanModal, WorkOrderModal } from "../../components/production/ProductionModals";
import { WorkOrderBoard } from "../../components/production/WorkOrderBoard";
import { useApiQuery, useDebounced, useMutation } from "../../hooks/useApiQuery";
import { productionService } from "../../services/operationsService";
import type { IProductionPlan, ProductionPlanStatus, IWorkOrder, WorkOrderStatus } from "../../types/operations";
import { formatDate, formatNumber, formatMoney, refName } from "../../utils/format";
import "../procurement/ProcurementPages.css";

const WO_STATUSES = ["Planned", "Released", "In Progress", "On Hold", "Completed", "Cancelled"];
const PLAN_STATUSES = ["Draft", "Approved", "In Progress", "Completed", "Cancelled"];

export const ProductionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"work-orders" | "plans" | "reports">("work-orders");
  const [woFilters, setWoFilters] = useState<ListFilterValue>({});
  const [planFilters, setPlanFilters] = useState<ListFilterValue>({});
  const [woPage, setWoPage] = useState(1);
  const [planPage, setPlanPage] = useState(1);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [workOrderFor, setWorkOrderFor] = useState<IProductionPlan | null | undefined>(undefined);
  const [woView, setWoView] = useState<"table" | "board">("table");
  const planAction = useMutation();
  const boardAction = useMutation();

  // The board shows every matching work order at once, so it skips pagination
  const woQuery = toQuery({ ...woFilters, search: useDebounced(woFilters.search) }, woView === "board" ? 1 : woPage, woView === "board" ? 100 : 20);
  const planQuery = toQuery({ ...planFilters, search: useDebounced(planFilters.search) }, planPage);

  const reports = useApiQuery(() => productionService.getReports(), []);
  const workOrders = useApiQuery(() => productionService.getWorkOrders(woQuery), [woQuery], { enabled: tab === "work-orders" });
  const plans = useApiQuery(() => productionService.getPlans(planQuery), [planQuery], { enabled: tab === "plans" });

  const r = reports.data?.data;

  const refreshAll = () => {
    reports.refetch();
    workOrders.refetch();
    plans.refetch();
  };

  const moveWorkOrder = async (wo: IWorkOrder, status: WorkOrderStatus) => {
    await boardAction.mutate(() => productionService.updateWorkOrderStatus(wo._id, status)).catch(() => undefined);
    workOrders.refetch();
    reports.refetch();
  };

  const changePlanStatus = async (plan: IProductionPlan, status: ProductionPlanStatus) => {
    await planAction.mutate(() => productionService.updatePlanStatus(plan._id, status)).catch(() => undefined);
    plans.refetch();
    reports.refetch();
  };

  return (
    <div className="proc-page-container">
      <PageHeader
        icon={<Cpu className="text-amber-600" size={28} />}
        title="Production"
        subtitle="Plan production, release work orders, track stages and job cards, and record output and scrap."
        actions={
          <>
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={refreshAll}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<CalendarRange size={14} />} onClick={() => setShowPlanModal(true)}>
              New Plan
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setWorkOrderFor(null)}>
              New Work Order
            </Button>
          </>
        }
      />

      <div className="proc-kpi-grid">
        <KpiCard label="Active Work Orders" value={r ? r.activeWorkOrders : "—"} sub={`${r?.activePlans ?? 0} active plans`} icon={<ClipboardList size={22} />} />
        <KpiCard label="Units Produced" value={r ? formatNumber(r.producedQuantity, 0) : "—"} sub={`${r?.completionRate ?? 0}% of planned`} icon={<Factory size={22} />} tone="emerald" />
        <KpiCard label="Scrap Rate" value={r ? `${r.scrapRate}%` : "—"} sub={`${formatNumber(r?.scrapQuantity, 0)} units scrapped`} icon={<Gauge size={22} />} tone="purple" />
        <KpiCard label="Overdue Work Orders" value={r ? r.overdueWorkOrders : "—"} sub={`Material cost ${formatMoney(r?.materialCost)}`} icon={<AlertTriangle size={22} />} tone="blue" />
      </div>

      <TabBar
        active={tab}
        onChange={(k) => setTab(k as typeof tab)}
        tabs={[
          { key: "work-orders", label: "Work Orders", count: r?.totalWorkOrders },
          { key: "plans", label: "Production Plans" },
          { key: "reports", label: "Production Reports" },
        ]}
      />

      {tab === "work-orders" && (
        <>
          <ListFilters
            module="work_orders"
            value={woFilters}
            onChange={(v) => {
              setWoFilters(v);
              setWoPage(1);
            }}
            searchPlaceholder="Search work order #, product or SKU..."
            statuses={WO_STATUSES}
            showWarehouse
            sortOptions={[
              { value: "createdAt", label: "Created" },
              { value: "plannedEndDate", label: "Due date" },
              { value: "plannedQuantity", label: "Quantity" },
            ]}
          />
          <div className="flex justify-end gap-1 mb-3">
            {(["table", "board"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setWoView(v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${
                  woView === v ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {v === "table" ? <List size={13} /> : <KanbanSquare size={13} />}
                {v === "table" ? "Table" : "Board"}
              </button>
            ))}
          </div>
          <ErrorBanner message={workOrders.error || boardAction.error} onRetry={workOrders.refetch} />
          {woView === "board" ? (
            workOrders.loading && !workOrders.data ? (
              <LoadingBox label="Loading work orders..." />
            ) : (
              <>
                <p className="text-[11px] text-slate-500 mb-2">Drag a card to another column to change its status. Click a card to open it.</p>
                <WorkOrderBoard workOrders={workOrders.data?.data || []} onMove={moveWorkOrder} />
              </>
            )
          ) : (
          <div className="proc-card p-0 overflow-hidden">
            {workOrders.loading ? (
              <LoadingBox label="Loading work orders..." />
            ) : !workOrders.data?.data.length ? (
              <EmptyBox
                icon={<ClipboardList size={40} />}
                title="No work orders"
                message="Create a work order to start tracking production on the shop floor."
                action={
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => setWorkOrderFor(null)}>
                    New Work Order
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="proc-table">
                  <thead>
                    <tr>
                      <th>WO #</th>
                      <th>Product</th>
                      <th>Progress</th>
                      <th>Stage</th>
                      <th>Due</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.data.data.map((wo) => {
                      const pct = Math.min(100, Math.round((wo.producedQuantity / wo.plannedQuantity) * 100));
                      const currentStage =
                        wo.stages.find((s) => s.status === "in_progress") || wo.stages.find((s) => s.status === "pending");
                      const overdue = wo.plannedEndDate && new Date(wo.plannedEndDate) < new Date() && !["Completed", "Cancelled"].includes(wo.status);
                      return (
                        <tr key={wo._id} className="cursor-pointer" onClick={() => navigate(`/app/production/work-orders/${wo._id}`)}>
                          <td>
                            <span className="proc-code-tag">{wo.workOrderNumber}</span>
                            {wo.planId && typeof wo.planId === "object" && (
                              <div className="text-[10px] text-slate-400 mt-1">{wo.planId.planNumber}</div>
                            )}
                          </td>
                          <td>
                            <div className="font-bold text-slate-900">{wo.itemName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{wo.sku}</div>
                          </td>
                          <td className="min-w-[140px]">
                            <div className="text-xs font-semibold text-slate-700 mb-1">
                              {formatNumber(wo.producedQuantity)} / {formatNumber(wo.plannedQuantity)} {wo.unit}
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="text-xs text-slate-600">{wo.status === "Completed" ? "Done" : currentStage?.name || "—"}</td>
                          <td className={`text-xs ${overdue ? "text-rose-600 font-bold" : "text-slate-600"}`}>{formatDate(wo.plannedEndDate)}</td>
                          <td className="text-xs capitalize">{wo.priority}</td>
                          <td>
                            <StatusBadge status={wo.status} />
                          </td>
                          <td className="text-right">
                            <Button variant="outline" size="sm" icon={<Eye size={14} />}>
                              Open
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {workOrders.data?.pagination && (
              <Pager {...workOrders.data.pagination} page={woPage} onChange={setWoPage} />
            )}
          </div>
          )}
        </>
      )}

      {tab === "plans" && (
        <>
          <ListFilters
            module="production_plans"
            value={planFilters}
            onChange={(v) => {
              setPlanFilters(v);
              setPlanPage(1);
            }}
            searchPlaceholder="Search plan #, title or product..."
            statuses={PLAN_STATUSES}
          />
          <ErrorBanner message={plans.error || planAction.error} onRetry={plans.refetch} />
          <div className="proc-card p-0 overflow-hidden">
            {plans.loading ? (
              <LoadingBox label="Loading production plans..." />
            ) : !plans.data?.data.length ? (
              <EmptyBox
                icon={<CalendarRange size={40} />}
                title="No production plans"
                message="Plans group the products and quantities to make over a period."
                action={
                  <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowPlanModal(true)}>
                    New Plan
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="proc-table">
                  <thead>
                    <tr>
                      <th>Plan #</th>
                      <th>Title</th>
                      <th>Window</th>
                      <th>Products</th>
                      <th>Factory</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.data.data.map((plan) => {
                      const planned = plan.items.reduce((s, i) => s + i.plannedQuantity, 0);
                      const produced = plan.items.reduce((s, i) => s + i.producedQuantity, 0);
                      const open = plan.status !== "Completed" && plan.status !== "Cancelled";
                      return (
                        <tr key={plan._id}>
                          <td>
                            <span className="proc-code-tag">{plan.planNumber}</span>
                          </td>
                          <td>
                            <div className="font-bold text-slate-900">{plan.title}</div>
                            <div className="text-[11px] text-slate-500 capitalize">{plan.priority} priority</div>
                          </td>
                          <td className="text-xs text-slate-600">
                            {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                          </td>
                          <td className="text-xs">
                            <div className="font-semibold">{plan.items.length} product(s)</div>
                            <div className="text-slate-500">
                              {formatNumber(produced)} / {formatNumber(planned)} produced
                            </div>
                          </td>
                          <td className="text-xs">{refName(plan.factoryId)}</td>
                          <td>
                            <StatusBadge status={plan.status} />
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap">
                              {plan.status === "Draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<CheckCircle2 size={14} className="text-emerald-600" />}
                                  disabled={planAction.submitting}
                                  onClick={() => changePlanStatus(plan, "Approved")}
                                >
                                  Approve
                                </Button>
                              )}
                              {open && plan.status !== "Draft" && (
                                <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => setWorkOrderFor(plan)}>
                                  Work Order
                                </Button>
                              )}
                              {open && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<XCircle size={14} className="text-rose-600" />}
                                  disabled={planAction.submitting}
                                  onClick={() => {
                                    if (window.confirm(`Cancel production plan ${plan.planNumber}?`)) changePlanStatus(plan, "Cancelled");
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {plans.data?.pagination && <Pager {...plans.data.pagination} page={planPage} onChange={setPlanPage} />}
          </div>
        </>
      )}

      {tab === "reports" && (
        <>
          <ErrorBanner message={reports.error} onRetry={reports.refetch} />
          {reports.loading || !r ? (
            <LoadingBox label="Building production report..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SectionCard title="Monthly Output (units)" className="lg:col-span-2">
                <Chart data={r.monthlyOutput} type="bar" height={240} color="#059669" />
              </SectionCard>
              <SectionCard title="Work Orders by Status">
                <BarList rows={WO_STATUSES.map((s) => ({ label: s, value: r.byStatus[s] || 0 }))} />
              </SectionCard>
              <SectionCard title="Top Products by Output" className="lg:col-span-2">
                <BarList
                  color="#2563eb"
                  rows={r.topProducts.map((p) => ({
                    label: `${p.itemName} (${p.sku})`,
                    value: p.produced,
                    display: `${formatNumber(p.produced)} made · ${formatNumber(p.scrap)} scrap`,
                  }))}
                />
              </SectionCard>
              <SectionCard title="Totals">
                <dl className="text-xs space-y-2">
                  {[
                    ["Planned quantity", formatNumber(r.plannedQuantity)],
                    ["Produced quantity", formatNumber(r.producedQuantity)],
                    ["Scrap quantity", formatNumber(r.scrapQuantity)],
                    ["Completion rate", `${r.completionRate}%`],
                    ["Completed work orders", r.completedWorkOrders],
                    ["Material cost", formatMoney(r.materialCost)],
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

      {showPlanModal && (
        <ProductionPlanModal
          onClose={() => setShowPlanModal(false)}
          onSaved={() => {
            setShowPlanModal(false);
            setTab("plans");
            plans.refetch();
            reports.refetch();
          }}
        />
      )}
      {workOrderFor !== undefined && (
        <WorkOrderModal
          plan={workOrderFor}
          onClose={() => setWorkOrderFor(undefined)}
          onSaved={() => {
            setWorkOrderFor(undefined);
            setTab("work-orders");
            workOrders.refetch();
            reports.refetch();
          }}
        />
      )}
    </div>
  );
};

export default ProductionDashboard;

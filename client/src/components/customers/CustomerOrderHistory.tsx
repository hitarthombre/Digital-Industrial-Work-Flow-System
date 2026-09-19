import React, { useState, useEffect } from "react";
import type { ICustomerOrder, OrderStatus, PaymentStatus } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Modal } from "../Modal";
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  DollarSign,
  Package,
  Truck,
  AlertCircle,
  FileText,
} from "lucide-react";

interface CustomerOrderHistoryProps {
  customerId: string;
  customerName?: string;
}

export const CustomerOrderHistory: React.FC<CustomerOrderHistoryProps> = ({
  customerId,
  customerName,
}) => {
  const [orders, setOrders] = useState<ICustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<ICustomerOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerOrders(customerId);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load order history.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "DELIVERED":
        return <Badge variant="success">Delivered</Badge>;
      case "SHIPPED":
        return <Badge variant="primary">Shipped</Badge>;
      case "PROCESSING":
        return <Badge variant="warning">Processing</Badge>;
      case "CONFIRMED":
        return <Badge variant="primary">Confirmed</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "PARTIAL":
        return <Badge variant="warning">Partial</Badge>;
      case "UNPAID":
        return <Badge variant="danger">Unpaid</Badge>;
      case "OVERDUE":
        return <Badge variant="danger">Overdue</Badge>;
      case "REFUNDED":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filtered list
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (ord.items && ord.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase())));
    const matchesStatus = statusFilter === "ALL" || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics metrics
  const totalSpend = orders.reduce((acc, o) => acc + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0);
  const totalOrdersCount = orders.length;
  const pendingFulfillments = orders.filter((o) => ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status)).length;
  const avgOrderValue = totalOrdersCount > 0 ? totalSpend / totalOrdersCount : 0;

  return (
    <div className="customer-orders-container">
      {/* Metrics Summary Header */}
      <div className="customer-order-metrics">
        <div className="metric-card">
          <div className="metric-icon bg-blue-50 text-blue-600">
            <DollarSign size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Spend</span>
            <span className="metric-value">${totalSpend.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-emerald-50 text-emerald-600">
            <ShoppingCart size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{totalOrdersCount}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-amber-50 text-amber-600">
            <Truck size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Orders</span>
            <span className="metric-value">{pendingFulfillments}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-purple-50 text-purple-600">
            <Package size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Avg Order Value</span>
            <span className="metric-value">${Math.round(avgOrderValue).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Control Bar & Search */}
      <div className="order-control-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order # or item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <Filter size={16} className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading customer order history...</p>
        </div>
      ) : error ? (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={40} className="empty-icon" />
          <h4>No Orders Found</h4>
          <p>No historical purchase orders match your filter criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="cust-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Order Date</th>
                <th>Items Count</th>
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Fulfillment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord._id}>
                  <td className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-slate-400" />
                      <span>{ord.orderNumber}</span>
                    </div>
                  </td>
                  <td className="text-slate-600">
                    {new Date(ord.orderDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td>{ord.itemsCount} items</td>
                  <td className="font-bold text-slate-900">${ord.totalAmount.toLocaleString()}</td>
                  <td>{getPaymentBadge(ord.paymentStatus)}</td>
                  <td>{getStatusBadge(ord.status)}</td>
                  <td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(ord)}
                      className="gap-1.5"
                    >
                      <Eye size={14} />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.orderNumber}`}
          maxWidth="lg"
        >
          <div className="order-modal-body">
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Customer</span>
                <span className="font-semibold text-slate-900">{customerName || selectedOrder.customerName || "Customer"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Order Date</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedOrder.orderDate).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Order Status</span>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Payment Status</span>
                <div className="mt-1">{getPaymentBadge(selectedOrder.paymentStatus)}</div>
              </div>
            </div>

            {selectedOrder.shippingAddress && (
              <div className="mb-4">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Shipping Address</h5>
                <p className="text-sm text-slate-600">
                  {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city},{" "}
                  {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode},{" "}
                  {selectedOrder.shippingAddress.country}
                </p>
              </div>
            )}

            <h5 className="text-sm font-bold text-slate-900 mb-2">Ordered Line Items</h5>
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              <table className="cust-table modal-table mb-4">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs">{item.sku || `ITEM-${i + 1}`}</td>
                      <td className="font-medium">{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toLocaleString()}</td>
                      <td className="font-bold">${item.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500 italic mb-4">Standard batch assembly order ({selectedOrder.itemsCount} total items).</p>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-sm text-slate-600">Total Invoice Balance</span>
              <span className="text-xl font-bold text-slate-900">${selectedOrder.totalAmount.toLocaleString()}</span>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerOrderHistory;

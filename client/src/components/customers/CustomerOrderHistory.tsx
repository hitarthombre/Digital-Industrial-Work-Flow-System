import React, { useState, useEffect } from "react";
import type { ICustomerOrder, OrderStatus, OrderPaymentStatus } from "../../types/customer";
import { customerService } from "../../services/customerService";
import { Badge } from "../Badge";
import {
  ShoppingCart,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Package,
} from "lucide-react";

interface CustomerOrderHistoryProps {
  customerId: string;
}

export const CustomerOrderHistory: React.FC<CustomerOrderHistoryProps> = ({ customerId }) => {
  const [orders, setOrders] = useState<ICustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomerOrders(customerId);
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return <Badge variant="success">Delivered</Badge>;
      case "shipped":
        return <Badge variant="primary">Shipped</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "confirmed":
        return <Badge variant="active">Confirmed</Badge>;
      case "draft":
        return <Badge variant="neutral">Draft</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: OrderPaymentStatus) => {
    switch (status) {
      case "paid":
        return <span className="diws-chip chip-success">Paid</span>;
      case "pending":
        return <span className="diws-chip chip-warning">Pending Payment</span>;
      case "partially_paid":
        return <span className="diws-chip chip-info">Partial</span>;
      case "overdue":
        return <span className="diws-chip chip-danger">Overdue</span>;
      default:
        return <span className="diws-chip">{status}</span>;
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.itemsSummary && ord.itemsSummary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalValue = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const activeOrders = orders.filter((o) => ["processing", "confirmed", "shipped"].includes(o.status)).length;

  return (
    <div className="customer-order-history-section">
      {/* Metrics Summary Row */}
      <div className="order-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue-100 text-blue-600">
            <ShoppingCart size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{orders.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-emerald-100 text-emerald-600">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Lifetime Order Revenue</span>
            <span className="stat-value">${totalValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-amber-100 text-amber-600">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">In-Progress Orders</span>
            <span className="stat-value">{activeOrders}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-purple-100 text-purple-600">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Fulfilled Orders</span>
            <span className="stat-value">{completedOrders}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="order-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order # or item description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={16} className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="shipped">Shipped</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content Table / Loading State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Retrieving customer sales order history...</p>
        </div>
      ) : error ? (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-orders-state">
          <Package size={48} className="empty-icon" />
          <h4>No Sales Orders Found</h4>
          <p>No historical purchase orders matched your current search parameters.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="diws-data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Order Date</th>
                <th>Purchased Items</th>
                <th>Units</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Payment</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord._id}>
                  <td className="font-semibold text-primary">
                    {ord.orderNumber}
                  </td>
                  <td>
                    <div className="inline-flex-align">
                      <Calendar size={14} className="text-muted mr-1" />
                      {new Date(ord.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-summary">
                    {ord.itemsSummary || "Industrial Parts & Supplies"}
                  </td>
                  <td>{ord.itemsCount}</td>
                  <td className="font-bold">
                    ${ord.totalAmount.toLocaleString()}
                  </td>
                  <td>{getOrderStatusBadge(ord.status)}</td>
                  <td>{getPaymentBadge(ord.paymentStatus)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-icon-secondary"
                      title="Download Order Invoice PDF"
                      onClick={() => alert(`Invoice for ${ord.orderNumber} downloaded.`)}
                    >
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderHistory;

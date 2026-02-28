"use client";

import { useState, useEffect } from "react";

// Helper to map DB status to UI styles
const statusBadge = (status) => {
  const map = {
    Completed: "bg-green-100 text-green-700",    // Sale finished
    Pending: "bg-red-100 text-red-700",       // Not yet shipped
    "In Transit": "bg-blue-100 text-blue-700", // Partially shipped
    Cancelled: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-amber-100 text-amber-700"}`}>
      {status}
    </span>
  );
};

const flowSteps = [
  { icon: "📞", label: "Receive Order", sub: "Call/Messenger", color: "border-blue-400 bg-blue-50" },
  { icon: "✓", label: "Stock Check", sub: "System checks inventory", color: "border-blue-400 bg-blue-50" },
  { icon: "🏭", label: "Production?", sub: "If out of stock (2-3 days)", color: "border-amber-400 bg-amber-50" },
  { icon: "📋", label: "Assign Delivery", sub: "Warehouse to vehicle", color: "border-blue-400 bg-blue-50" },
  { icon: "🚚", label: "Distribution", sub: "Deliver to customer", color: "border-blue-400 bg-blue-50" },
  { icon: "💳", label: "Payment", sub: "Record payment/balance", color: "border-green-400 bg-green-50" },
];

export default function Orders() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // 1. Fetch Sales from Backend
  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await fetch("/api/sales");
        const data = await res.json();
        setSales(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  // 2. Filter Logic
  const filtered = sales.filter(
    (s) => statusFilter === "all" || s.sales_status === statusFilter
  );

  // 3. Live Stats Calculation
  const stats = {
    pending: sales.filter(s => s.sales_status === 'Pending').length,
    completed: sales.filter(s => s.sales_status === 'Completed').length,
    revenue: sales.reduce((acc, curr) => acc + Number(curr.sales_totalAmount), 0)
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Connecting to Database...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order & Shipment Management</h1>
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Order
        </button>
      </div>

      {/* Order Flow Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Order Processing Flow</h2>
        <div className="flex items-start gap-1 overflow-x-auto pb-4 custom-scrollbar">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-shrink-0">
              <div className={`border-2 ${step.color} rounded-xl p-3 text-center min-w-[120px]`}>
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className="text-xs font-bold text-slate-700">{step.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{step.sub}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="text-slate-300 text-xl px-2 flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Orders", value: stats.pending, color: "text-red-500" },
          { label: "Completed", value: stats.completed, color: "text-green-600" },
          { label: "Total Sales", value: sales.length, color: "text-blue-600" },
          { label: "Total Revenue", value: `₱${stats.revenue.toLocaleString()}`, color: "text-slate-800" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-semibold">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Live Orders Table */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-base font-bold text-slate-700">Recent Sales Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {["all", "Pending", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === status 
                  ? "bg-slate-800 text-white shadow-md" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Order #", "Customer", "Date", "Amount", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.sales_ID} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-3 font-bold text-blue-600">#ORD-{s.sales_ID}</td>
                  <td className="py-4 px-3 text-slate-700 font-medium">{s.client_name}</td>
                  <td className="py-4 px-3 text-slate-500">{new Date(s.sales_date).toLocaleDateString()}</td>
                  <td className="py-4 px-3 font-bold text-slate-800">₱{Number(s.sales_totalAmount).toLocaleString()}</td>
                  <td className="py-4 px-3">
                    <span className={Number(s.sales_Balance) > 0 ? "text-red-500 font-bold" : "text-slate-400"}>
                      ₱{Number(s.sales_Balance).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-3">{statusBadge(s.sales_status)}</td>
                  <td className="py-4 px-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-all">
                        View
                      </button>
                      {s.sales_status === 'Pending' && (
                        <button className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-md transition-all">
                          Ship
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">No orders found for this category.</div>
          )}
        </div>
      </div>
    </div>
  );
}
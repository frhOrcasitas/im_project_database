"use client";

import { useState } from "react";

const orders = [
  { id: "#ORD-2045", customer: "ABC Store", date: "Feb 13, 2026", amount: "₱8,500", items: 3, driver: "Juan dela Cruz", vehicle: "TRK-01", status: "Delivered" },
  { id: "#ORD-2044", customer: "XYZ Mart", date: "Feb 13, 2026", amount: "₱12,300", items: 5, driver: "Pedro Santos", vehicle: "TRK-02", status: "In Transit" },
  { id: "#ORD-2043", customer: "Quick Shop", date: "Feb 12, 2026", amount: "₱5,600", items: 2, driver: "—", vehicle: "—", status: "Processing" },
  { id: "#ORD-2042", customer: "Metro Store", date: "Feb 12, 2026", amount: "₱9,800", items: 4, driver: "—", vehicle: "—", status: "Pending Production" },
  { id: "#ORD-2041", customer: "City Mart", date: "Feb 11, 2026", amount: "₱3,200", items: 1, driver: "Juan dela Cruz", vehicle: "TRK-01", status: "Delivered" },
];

const statusBadge = (status) => {
  const map = {
    Delivered: "bg-green-100 text-green-700",
    "In Transit": "bg-blue-100 text-blue-700",
    Processing: "bg-amber-100 text-amber-700",
    "Pending Production": "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
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
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter(
    (o) => statusFilter === "all" || o.status === statusFilter
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order & Shipment Management</h1>
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + New Order
        </button>
      </div>

      {/* Order Flow */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Order Processing Flow</h2>
        <div className="flex items-start gap-1 overflow-x-auto pb-2">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-shrink-0">
              <div className={`border-2 ${step.color} rounded-xl p-3 text-center min-w-[110px]`}>
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className="text-xs font-semibold text-slate-700">{step.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{step.sub}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="text-slate-300 text-xl px-1 flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Pending Orders", value: 23, color: "text-slate-800" },
          { label: "In Production", value: 4, color: "text-amber-500" },
          { label: "In Transit", value: 8, color: "text-blue-600" },
          { label: "Delivered Today", value: 11, color: "text-green-600" },
          { label: "Today's Revenue", value: "₱45K", color: "text-green-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-slate-700">Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {["all", "Pending Production", "Processing", "In Transit", "Delivered"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Order #", "Customer", "Date", "Items", "Amount", "Driver", "Vehicle", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-blue-600">{o.id}</td>
                  <td className="py-3 px-3 text-slate-700">{o.customer}</td>
                  <td className="py-3 px-3 text-slate-500">{o.date}</td>
                  <td className="py-3 px-3 text-slate-600">{o.items}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{o.amount}</td>
                  <td className="py-3 px-3 text-slate-600">{o.driver}</td>
                  <td className="py-3 px-3 text-slate-600">{o.vehicle}</td>
                  <td className="py-3 px-3">{statusBadge(o.status)}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors">View</button>
                      <button className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded transition-colors">Assign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

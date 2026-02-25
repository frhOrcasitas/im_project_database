"use client";

import Link from "next/link";

const stats = [
  {
    label: "Today's Sales",
    value: "₱45,230",
    sub: "↑ 12% from yesterday",
    subColor: "text-green-600",
    border: "border-blue-400",
    icon: "💰",
  },
  {
    label: "Pending Orders",
    value: "23",
    sub: "8 require production",
    subColor: "text-red-500",
    border: "border-red-400",
    icon: "📋",
  },
  {
    label: "Low Stock Items",
    value: "5",
    sub: "Need reorder",
    subColor: "text-amber-500",
    border: "border-amber-400",
    icon: "⚠️",
  },
  {
    label: "Outstanding Balance",
    value: "₱125,450",
    sub: "12 customers",
    subColor: "text-red-500",
    border: "border-red-400",
    icon: "💵",
  },
];

const recentSales = [
  { order: "#ORD-2045", customer: "ABC Store", date: "Feb 13, 2026", amount: "₱8,500", status: "Delivered" },
  { order: "#ORD-2044", customer: "XYZ Mart", date: "Feb 13, 2026", amount: "₱12,300", status: "In Transit" },
  { order: "#ORD-2043", customer: "Quick Shop", date: "Feb 12, 2026", amount: "₱5,600", status: "Delivered" },
  { order: "#ORD-2042", customer: "Metro Store", date: "Feb 12, 2026", amount: "₱9,800", status: "Processing" },
  { order: "#ORD-2041", customer: "City Mart", date: "Feb 11, 2026", amount: "₱3,200", status: "Delivered" },
];

const statusBadge = (status) => {
  const map = {
    Delivered: "bg-green-100 text-green-700",
    "In Transit": "bg-amber-100 text-amber-700",
    Processing: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
};

export default function Dashboard() {
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <span className="text-sm text-slate-500">Monday, February 23, 2026</span>
      </div>

      {/* Low Stock Alert */}
      <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-3 flex items-center justify-between mb-6 text-sm">
        <span>⚠️ <strong>Low Stock Alert:</strong> 5 products are running low on inventory</span>
        <Link href="/inventory" className="text-amber-700 font-semibold hover:underline">
          View Details →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white rounded-xl border-l-4 ${s.border} p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{s.value}</div>
            <div className={`text-xs ${s.subColor}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-700">Recent Sales</h2>
            <Link href="/sales" className="text-blue-600 hover:underline text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-slate-500 font-medium">Order #</th>
                  <th className="text-left pb-2 text-slate-500 font-medium">Customer</th>
                  <th className="text-left pb-2 text-slate-500 font-medium">Date</th>
                  <th className="text-right pb-2 text-slate-500 font-medium">Amount</th>
                  <th className="text-left pb-2 text-slate-500 font-medium pl-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((row) => (
                  <tr key={row.order} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-blue-600">{row.order}</td>
                    <td className="py-3 text-slate-700">{row.customer}</td>
                    <td className="py-3 text-slate-500">{row.date}</td>
                    <td className="py-3 text-right font-semibold text-slate-800">{row.amount}</td>
                    <td className="py-3 pl-4">{statusBadge(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/sales/new"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors"
            >
              + New Sale
            </Link>
            <Link
              href="/inventory"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors"
            >
              📦 Check Inventory
            </Link>
            <Link
              href="/customers"
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors"
            >
              👥 Add Customer
            </Link>
            <Link
              href="/reports"
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors"
            >
              📊 Generate Report
            </Link>
          </div>

          {/* Mini summary */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Inventory Snapshot</h3>
            <div className="space-y-2">
              {[
                { label: "In Stock", val: 128, color: "bg-green-500", pct: 82 },
                { label: "Low Stock", val: 23, color: "bg-amber-400", pct: 15 },
                { label: "Out of Stock", val: 5, color: "bg-red-500", pct: 3 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-slate-600">{item.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-slate-600 font-medium">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

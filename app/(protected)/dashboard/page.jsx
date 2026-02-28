"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import QuickActions from "../components/quickactions";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch dashboard data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Helper for table badges
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

  if (loading) return <div className="p-6 text-slate-500">Loading live data...</div>;

  const stats = [
    {
      label: "Today's Sales",
      value: `₱${(data?.todaySales || 0).toLocaleString()}`,
      sub: "Live from tbl_sales",
      subColor: "text-green-600",
      border: "border-blue-400",
      icon: "💰",
    },
    {
      label: "Low Stock Items",
      value: data?.lowStockCount || "0",
      sub: "Need reorder soon",
      subColor: "text-amber-500",
      border: "border-amber-400",
      icon: "⚠️",
    },
    {
      label: "Outstanding Balance",
      value: `₱${(data?.totalReceivables || 0).toLocaleString()}`,
      sub: "Total Unpaid Sales",
      subColor: "text-red-500",
      border: "border-red-400",
      icon: "💵",
    },
    {
      label: "System Status",
      value: "Online",
      sub: "Connected to MariaDB",
      subColor: "text-blue-500",
      border: "border-green-400",
      icon: "🖥️",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <span className="text-sm text-slate-500">{new Date().toDateString()}</span>
      </div>

      {/* Low Stock Alert */}
      {data?.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-3 flex items-center justify-between mb-6 text-sm">
          <span>⚠️ <strong>Low Stock Alert:</strong> {data.lowStockCount} products are running low</span>
          <Link href="/inventory" className="text-amber-700 font-semibold hover:underline">
            View Details →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.border} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{s.value}</div>
            <div className={`text-xs ${s.subColor}`}>{s.sub}</div>
          </div>
        ))}
      </div>

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
                {data?.recentSales?.map((row) => (
                  <tr key={row.sales_ID} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-blue-600">#{row.sales_ID}</td>
                    <td className="py-3 text-slate-700">{row.client_name}</td>
                    <td className="py-3 text-slate-500">{new Date(row.sales_createdAt).toLocaleDateString()}</td> 
                    <td className="py-3 text-right font-semibold text-slate-800">₱{row.sales_totalAmount.toLocaleString()}</td>
                    <td className="py-3 pl-4">{statusBadge(row.sales_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Summary */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Quick Actions</h2>
          <QuickActions />

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Inventory Snapshot</h3>
            <div className="space-y-2">
              {[
                { label: "Low Stock", val: data?.lowStockCount || 0, color: "bg-amber-400", pct: data?.lowStockCount > 0 ? 50 : 10 },
                { label: "Active Clients", val: data?.recentSales?.length || 0, color: "bg-blue-500", pct: 100 },
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
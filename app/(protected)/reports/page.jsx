"use client";

import { useState, useEffect } from "react";

const reportTypes = [
  { icon: "💰", title: "Sales Report", desc: "Daily, weekly, monthly sales summary" },
  { icon: "📦", title: "Inventory Report", desc: "Stock levels, valuation, movements" },
  { icon: "💵", title: "Financial Report", desc: "Revenue, expenses, profit analysis" },
  { icon: "👥", title: "Customer Report", desc: "Customer purchases, balances, trends" },
  { icon: "📈", title: "Product Performance", desc: "Best sellers, slow movers" },
  { icon: "📅", title: "Aging Report", desc: "Accounts receivable aging analysis" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("Sales Report");
  const [dateRange, setDateRange] = useState("This Month");
  const [groupBy, setGroupBy] = useState("Daily");
  
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // CONNECTION FIRST: Fetching only the scopes we have APIs for
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // We focus on Monthly for the "Recent" list as it provides the best summary
        const res = await fetch("/api/reports/monthly");
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const mapped = data.map(row => ({
            name: `${new Date(2000, row.month - 1).toLocaleString('en-PH', { month: 'long' })} ${row.year} Summary`,
            type: "Monthly",
            range: `${row.month}/${row.year}`,
            by: "System",
            created: "Live"
          }));
          setRecentReports(mapped);
        }
      } catch (err) {
        console.error("Report Connection Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="text-slate-900"> {/* Explicit base text color for readability */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {reportTypes.map((r) => (
          <button
            key={r.title}
            onClick={() => setReportType(r.title)}
            className={`border-2 rounded-xl p-4 text-center transition-all hover:shadow-md ${
              reportType === r.title ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400"
            }`}
          >
            <div className="text-3xl mb-2">{r.icon}</div>
            <div className="text-sm font-bold text-slate-800">{r.title}</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 mb-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Generate Custom Report</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
            >
              {reportTypes.map((r) => (
                <option key={r.title} value={r.title}>{r.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
            >
                {/* Simplified to Daily, Monthly, Yearly as requested */}
                <option>Daily</option>
                <option>Monthly</option>
                <option>Yearly</option>
                <option>Custom Range</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Group By</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full sm:w-64 border border-slate-400 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option>Daily</option>
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button className="bg-green-700 hover:bg-green-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm">
            📊 Generate Report
          </button>
          <button className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm">
            📤 Export Excel
          </button>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-tight">Recent Live Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                {["Report Name", "Type", "Scope", "Source", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-black text-slate-700 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-slate-600 font-bold animate-pulse">CONNECTING TO MARIADB...</td></tr>
              ) : (
                recentReports.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-3 font-bold text-slate-900">{r.name}</td>
                    <td className="py-4 px-3">
                      <span className="text-[10px] bg-blue-700 text-white px-2 py-1 rounded font-black uppercase">{r.type}</span>
                    </td>
                    <td className="py-4 px-3 text-slate-800 font-medium">{r.range}</td>
                    <td className="py-4 px-3 text-slate-800 font-medium">{r.by}</td>
                    <td className="py-4 px-3 text-green-700 font-bold">{r.created}</td>
                    <td className="py-4 px-3">
                      <button className="text-xs font-bold text-blue-700 hover:underline">View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
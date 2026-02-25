"use client";

import { useState } from "react";

const reportTypes = [
  { icon: "💰", title: "Sales Report", desc: "Daily, weekly, monthly sales summary" },
  { icon: "📦", title: "Inventory Report", desc: "Stock levels, valuation, movements" },
  { icon: "💵", title: "Financial Report", desc: "Revenue, expenses, profit analysis" },
  { icon: "👥", title: "Customer Report", desc: "Customer purchases, balances, trends" },
  { icon: "📈", title: "Product Performance", desc: "Best sellers, slow movers" },
  { icon: "📅", title: "Aging Report", desc: "Accounts receivable aging analysis" },
];

const recentReports = [
  { name: "February 2026 Sales Report", type: "Sales", range: "Feb 1–13, 2026", by: "John Doe", created: "Feb 13, 10:30 AM" },
  { name: "Inventory Valuation Report", type: "Inventory", range: "As of Feb 13, 2026", by: "John Doe", created: "Feb 13, 9:00 AM" },
  { name: "Customer Aging Report", type: "Aging", range: "Jan 2026", by: "Maria Santos", created: "Feb 1, 8:00 AM" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("Sales Report");
  const [dateRange, setDateRange] = useState("This Month");
  const [groupBy, setGroupBy] = useState("Daily");

  return (
    <div>
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
              reportType === r.title ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >
            <div className="text-3xl mb-2">{r.icon}</div>
            <div className="text-sm font-semibold text-slate-700">{r.title}</div>
            <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Generate Custom Report</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Report Type <span className="text-red-500">*</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {reportTypes.map((r) => (
                <option key={r.title}>{r.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Date Range <span className="text-red-500">*</span>
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {["Today", "This Week", "This Month", "Last Month", "This Quarter", "This Year", "Custom Range"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {dateRange === "Custom Range" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
              <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Group By</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full sm:w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {["Daily", "Weekly", "Monthly", "Product", "Customer", "Employee"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            📊 Generate Report
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            📤 Export to Excel
          </button>
          <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            📄 Export to PDF
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Recent Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Report Name", "Type", "Date Range", "Generated By", "Date Created", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentReports.map((r) => (
                <tr key={r.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">{r.name}</td>
                  <td className="py-3 px-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{r.type}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{r.range}</td>
                  <td className="py-3 px-3 text-slate-600">{r.by}</td>
                  <td className="py-3 px-3 text-slate-500">{r.created}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors">View</button>
                      <button className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded transition-colors">Download</button>
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

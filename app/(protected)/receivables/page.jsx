"use client";

import { useState } from "react";

const receivables = [
  { id: "REC-001", customer: "ABC Store", contact: "Maria Santos", invoices: 3, totalDue: 15000, current: 0, days30: 8500, days60: 6500, days90: 0, status: "Overdue" },
  { id: "REC-002", customer: "Metro Store", contact: "Ben Garcia", invoices: 2, totalDue: 8200, current: 8200, days30: 0, days60: 0, days90: 0, status: "Current" },
  { id: "REC-003", customer: "Quick Shop", contact: "Ana Cruz", invoices: 1, totalDue: 5000, current: 0, days30: 0, days60: 5000, days90: 0, status: "Overdue" },
  { id: "REC-004", customer: "Sun Store", contact: "Luis Tan", invoices: 4, totalDue: 22000, current: 5000, days30: 17000, days60: 0, days90: 0, status: "Partial" },
];

const statusBadge = (status) => {
  const map = {
    Overdue: "bg-red-100 text-red-700",
    Current: "bg-green-100 text-green-700",
    Partial: "bg-amber-100 text-amber-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
};

const totalOutstanding = receivables.reduce((s, r) => s + r.totalDue, 0);

export default function Receivables() {
  const [search, setSearch] = useState("");

  const filtered = receivables.filter((r) =>
    r.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Accounts Receivable</h1>
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Outstanding", value: `₱${totalOutstanding.toLocaleString()}`, color: "text-red-600", border: "border-red-400" },
          { label: "Current (0-30 days)", value: `₱${receivables.reduce((s, r) => s + r.current + r.days30, 0).toLocaleString()}`, color: "text-amber-500", border: "border-amber-400" },
          { label: "Overdue (31-60 days)", value: `₱${receivables.reduce((s, r) => s + r.days60, 0).toLocaleString()}`, color: "text-orange-600", border: "border-orange-400" },
          { label: "Overdue (60+ days)", value: `₱${receivables.reduce((s, r) => s + r.days90, 0).toLocaleString()}`, color: "text-red-700", border: "border-red-600" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.border} shadow-sm p-4`}>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-slate-700">Customer Balances</h2>
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Customer", "Contact", "Invoices", "Total Due", "0-30 days", "31-60 days", "60+ days", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">{r.customer}</td>
                  <td className="py-3 px-3 text-slate-600">{r.contact}</td>
                  <td className="py-3 px-3 text-slate-600">{r.invoices}</td>
                  <td className="py-3 px-3 font-bold text-red-600">₱{r.totalDue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-600">{r.current > 0 || r.days30 > 0 ? `₱${(r.current + r.days30).toLocaleString()}` : "—"}</td>
                  <td className="py-3 px-3 text-orange-600">{r.days60 > 0 ? `₱${r.days60.toLocaleString()}` : "—"}</td>
                  <td className="py-3 px-3 text-red-600">{r.days90 > 0 ? `₱${r.days90.toLocaleString()}` : "—"}</td>
                  <td className="py-3 px-3">{statusBadge(r.status)}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors">Pay</button>
                      <button className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors">View</button>
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

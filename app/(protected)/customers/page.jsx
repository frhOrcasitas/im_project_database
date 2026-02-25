"use client";

import { useState } from "react";

const customers = [
  { id: 1, name: "ABC Store", contact: "Maria Santos", phone: "0917-123-4567", address: "123 Main St, Davao City", pricing: "Special (10%)", balance: 15000, totalOrders: 48, lastOrder: "Feb 13, 2026" },
  { id: 2, name: "XYZ Mart", contact: "Jose Reyes", phone: "0918-987-6543", address: "456 Rizal Ave, Davao City", pricing: "Regular", balance: 0, totalOrders: 32, lastOrder: "Feb 12, 2026" },
  { id: 3, name: "Quick Shop", contact: "Ana Cruz", phone: "0919-555-1234", address: "789 Ponciano St, Davao City", pricing: "Bulk Discount", balance: 5000, totalOrders: 21, lastOrder: "Feb 10, 2026" },
  { id: 4, name: "Metro Store", contact: "Ben Garcia", phone: "0920-444-5678", address: "101 Sandawa Rd, Davao City", pricing: "Regular", balance: 8200, totalOrders: 15, lastOrder: "Feb 8, 2026" },
  { id: 5, name: "City Mart", contact: "Rosa Lim", phone: "0921-333-9876", address: "202 Quimpo Blvd, Davao City", pricing: "Special (15%)", balance: 0, totalOrders: 60, lastOrder: "Feb 13, 2026" },
];

const transactionHistory = [
  { date: "Feb 13", order: "#ORD-2045", amount: "₱8,500", status: "Paid" },
  { date: "Feb 10", order: "#ORD-2032", amount: "₱12,000", status: "Partial" },
  { date: "Feb 05", order: "#ORD-2018", amount: "₱5,500", status: "Unpaid" },
];

const txBadge = (status) => {
  const map = {
    Paid: "bg-green-100 text-green-700",
    Partial: "bg-amber-100 text-amber-700",
    Unpaid: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
};

export default function Customers() {
  const [selected, setSelected] = useState(customers[0]);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.id === c.id ? "bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}`}
              >
                <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.contact}</div>
                {c.balance > 0 && (
                  <div className="text-xs text-red-500 font-medium mt-0.5">
                    Balance: ₱{c.balance.toLocaleString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                  <div className="text-sm text-slate-500 mt-0.5">Customer ID: CUST-{String(selected.id).padStart(4, "0")}</div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Record Payment
                  </button>
                  <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    View Orders
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Contact Person", value: selected.contact },
                  { label: "Phone", value: selected.phone },
                  { label: "Pricing Type", value: selected.pricing },
                  { label: "Total Orders", value: selected.totalOrders },
                  { label: "Last Order", value: selected.lastOrder },
                  {
                    label: "Outstanding Balance",
                    value: `₱${selected.balance.toLocaleString()}`,
                    highlight: selected.balance > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                    <div className={`font-medium text-slate-700 ${item.highlight || ""}`}>{item.value}</div>
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="text-xs text-slate-400 mb-0.5">Address</div>
                  <div className="font-medium text-slate-700">{selected.address}</div>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-700 mb-4">Recent Transaction History</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Date", "Order #", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactionHistory.map((tx) => (
                    <tr key={tx.order} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 text-slate-500">{tx.date}</td>
                      <td className="py-3 font-medium text-blue-600">{tx.order}</td>
                      <td className="py-3 font-semibold text-slate-800">{tx.amount}</td>
                      <td className="py-3">{txBadge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

const txBadge = (status) => {
  const map = {
    Paid: "bg-green-100 text-green-700",
    Partial: "bg-amber-100 text-amber-700",
    Unpaid: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-slate-100"}`}>{status}</span>;
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ─── Connection Logic ──────────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client"); 
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCustomers(list);
      if (list.length > 0) setSelected(list[0]);
    } catch (err) {
      console.error("Fetch error:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // ─── Filter Logic (Matches your SQL columns) ──────────────────────────────
  const filtered = customers.filter(
    (c) =>
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(search.toLowerCase())
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
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No customers found.</div>
            ) : filtered.map((c) => (
              <button
                key={c.client_ID}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.client_ID === c.client_ID ? "bg-blue-50 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"}`}
              >
                <div className="font-semibold text-slate-800 text-sm">{c.client_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.contactPerson}</div>
                {(Number(c.client_outstandingbalance) > 0) && (
                  <div className="text-xs text-red-500 font-medium mt-0.5">
                    Balance: ₱{Number(c.client_outstandingbalance).toLocaleString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Detail */}
        {selected ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.client_name}</h2>
                  <div className="text-sm text-slate-500 mt-0.5">Client ID: {selected.client_ID} | TIN: {selected.TIN_Code || 'N/A'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                  <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">Record Payment</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-50 pt-4">
                {[
                  { label: "Contact Person", value: selected.contactPerson },
                  { label: "Phone", value: selected.client_contactNumber },
                  { label: "Email", value: selected.client_email || "N/A" },
                  {
                    label: "Outstanding Balance",
                    value: `₱${Number(selected.client_outstandingbalance || 0).toLocaleString()}`,
                    highlight: Number(selected.client_outstandingbalance) > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                    <div className={`font-medium text-slate-700 ${item.highlight || ""}`}>{item.value}</div>
                  </div>
                ))}
                <div className="col-span-2">
                  <div className="text-xs text-slate-400 mb-0.5">Address</div>
                  <div className="font-medium text-slate-700">{selected.client_address}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-slate-700 mb-4">Recent Transaction History</h3>
              <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Transaction history connection coming in Phase 3
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
            Select a client to view details
          </div>
        )}
      </div>
    </div>
  );
}
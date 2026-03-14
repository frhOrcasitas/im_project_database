"use client";

import { useState, useEffect } from "react";

const getStatus = (r) => {
  if (Number(r.days_90) > 0 || Number(r.days_60) > 0) return "Overdue";
  if (Number(r.totalDue) > 0) return "Partial";
  return "Current";
};

const statusBadge = (status) => {
  const map = {
    Overdue: "bg-red-100 text-red-700",
    Current: "bg-green-100 text-green-700",
    Partial: "bg-amber-100 text-amber-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
};

export default function Receivables() {
  const [search, setSearch] = useState("");
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ clientId: "", name: "", amount: 0 });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  const filtered = Array.isArray(receivables) 
  ? receivables.filter((r) => r.customer?.toLowerCase().includes(search.toLowerCase()))
  : [];

  useEffect(() => {
    const fetchReceivables = async () => {
      try {
        const res = await fetch("/api/receivables");
        const data = await res.json();
        setReceivables(data);
        
        if (res.ok) {
            setReceivables(data);
        } else {
            console.error("API Error Details:", data.details);
            setReceivables([]); 
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceivables();
  }, []);

  const handleOpenPay = (customer) => {
    setPaymentData({
      clientId: customer.id, 
      name: customer.customer, 
      amount: customer.totalDue
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Fetch this client's unpaid sales, apply to oldest first
      const salesRes = await fetch("/api/sales");
      const salesData = await salesRes.json();

      const unpaidSales = Array.isArray(salesData)
        ? salesData
            .filter(s =>
              String(s.client_ID) === String(paymentData.clientId) &&
              s.sales_Balance > 0 &&
              s.sales_status !== "Cancelled"
            )
            .sort((a, b) => new Date(a.sales_createdAt) - new Date(b.sales_createdAt))
        : [];

      if (!unpaidSales.length) {
        return alert("No unpaid invoices found for this client.");
      }

      const targetSale = unpaidSales[0];

      const res = await fetch(`/api/sales/${targetSale.sales_ID}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:   paymentData.clientId,
          employee_id: 1,
          amount:      Number(paymentData.amount),
          or_number:   null,
          type:        "Cash",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Payment recorded successfully!");
        setIsModalOpen(false);
        window.location.reload();
      } else {
        alert("Error: " + (data.error || "Payment failed"));
      }
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  const safeReceivables = Array.isArray(receivables) ? receivables : [];

  const totalOutstanding = safeReceivables.reduce((s, r) => s + (Number(r.totalDue) || 0), 0);
  const currentTotal = safeReceivables.reduce((s, r) => s + (Number(r.current_30) || 0), 0);
  const overdue3060 = safeReceivables.reduce((s, r) => s + (Number(r.days_60) || 0), 0);
  const overdue60Plus = safeReceivables.reduce((s, r) => s + (Number(r.days_90) || 0), 0);

  if (loading) return <div className="p-10 text-center">Loading Balances...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Accounts Receivable</h1>
        <button 
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          onClick={() => {
            // Reset everything so the dropdown appears
            setPaymentData({ clientId: "", name: "", amount: 0 });
            setIsModalOpen(true);               
          }}
        >
          + Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Outstanding", value: `₱${totalOutstanding.toLocaleString()}`, color: "text-red-600", border: "border-red-400" },
          { label: "Current (0-30 days)", value: `₱${currentTotal.toLocaleString()}`, color: "text-amber-500", border: "border-amber-400" },
          { label: "Overdue (31-60 days)", value: `₱${overdue3060.toLocaleString()}`, color: "text-orange-600", border: "border-orange-400" },
          { label: "Overdue (60+ days)", value: `₱${overdue60Plus.toLocaleString()}`, color: "text-red-700", border: "border-red-600" },
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
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
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
                  <td className="py-3 px-3 font-bold text-red-600">
                    ₱{Number(r.totalDue).toLocaleString()}
                  </td>
                  {/* 0-30 Days Column */}
                  <td className="py-3 px-3 text-slate-600">
                    {Number(r.current_30) > 0 ? `₱${Number(r.current_30).toLocaleString()}` : "—"}
                  </td>
                  {/* 31-60 Days Column */}
                  <td className="py-3 px-3 text-orange-600">
                    {Number(r.days_60) > 0 ? `₱${Number(r.days_60).toLocaleString()}` : "—"}
                  </td>
                  {/* 60+ Days Column */}
                  <td className="py-3 px-3 text-red-600">
                    {Number(r.days_90) > 0 ? `₱${Number(r.days_90).toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-3">{statusBadge(getStatus(r))}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors"
                              onClick={() => handleOpenPay(r)}>Pay</button>
                      <button className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                              onClick={() => {
                                setSelectedCustomerDetails(r);
                                setIsViewModalOpen(true);
                              }}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Record Payment</h3>
                <p className="text-sm text-slate-500">
                  {paymentData.clientId ? `Paying for ${paymentData.name}` : "Select a customer to begin"}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="p-6 space-y-4">
                {/* Customer Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer</label>
                  {paymentData.clientId ? (
                    <div className="p-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-700">
                      {paymentData.name}
                    </div>
                  ) : (
                    <select 
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none text-black"
                      onChange={(e) => {
                        const selected = receivables.find(r => r.id == e.target.value);
                        if (selected) {
                          setPaymentData({ 
                            ...paymentData, 
                            clientId: selected.id, 
                            name: selected.customer,
                            amount: selected.totalDue 
                          });
                        }
                      }}
                    >
                      <option value="">Choose a customer...</option>
                      {receivables.map(r => (
                        <option key={r.id} value={r.id}>{r.customer} (₱{Number(r.totalDue).toLocaleString()})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount to Pay</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">₱</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 text-black outline-none"
                    />
                  </div>
                </div>

                {paymentData.clientId && (
                  <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                    Full Balance: <strong>₱{Number(receivables.find(r => r.id === paymentData.clientId)?.totalDue || 0).toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!paymentData.clientId}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition-all"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedCustomerDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedCustomerDetails.customer}</h3>
                <p className="text-sm text-slate-500">Contact: {selectedCustomerDetails.contact}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Total Invoices</div>
                  <div className="text-lg font-bold text-black">{selectedCustomerDetails.invoices}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <div className="text-[10px] uppercase text-red-500 font-bold">Overdue</div>
                  <div className="text-lg font-bold text-red-600">
                    ₱{(Number(selectedCustomerDetails.days_60) + Number(selectedCustomerDetails.days_90)).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <div className="text-[10px] uppercase text-green-500 font-bold">Current</div>
                  <div className="text-lg font-bold text-green-600">
                    ₱{Number(selectedCustomerDetails.current_30).toLocaleString()}
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-700 mb-3">Aging Breakdown</h4>
              <div className="space-y-2">
                {[
                  { label: "0-30 Days", value: selectedCustomerDetails.current_30, color: "bg-amber-400" },
                  { label: "31-60 Days", value: selectedCustomerDetails.days_60, color: "bg-orange-500" },
                  { label: "60+ Days", value: selectedCustomerDetails.days_90, color: "bg-red-600" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm p-2 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                      <span className="text-slate-600">{item.label}</span>
                    </div>
                    <span className="font-semibold text-black">₱{Number(item.value).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end">
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenPay(selectedCustomerDetails);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

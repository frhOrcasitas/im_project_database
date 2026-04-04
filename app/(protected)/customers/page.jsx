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
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [customerForm, setCustomerForm] = useState({
    name: "", contact: "", phone: "", email: "", address: "", tin: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    sales_id: "", amount: "", or_number: "", type: "Cash", employee_id: 1
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/client");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCustomers(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch (err) {
      console.error("Fetch error:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selected) {
      fetch(`/api/client/${selected.client_ID}/transactions`)
        .then(res => res.json())
        .then(data => setTransactions(Array.isArray(data) ? data : []));
    }
  }, [selected]);

  const filtered = customers.filter(
    (c) =>
      c.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditClick = (customer) => {
    setModalMode("edit");
    setCustomerForm({
      id: customer.client_ID,
      name: customer.client_name,
      contact: customer.contactPerson, 
      phone: customer.client_contactNumber,
      email: customer.client_email || "",
      address: customer.client_address,
      tin: customer.TIN_Code || ""
    });
    setIsModalOpen(true);
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    const method = modalMode === "add" ? "POST" : "PUT";

    const payload = modalMode === "add" ? {
      client_name: customerForm.name,
      contactPerson: customerForm.contact,
      client_contactNumber: customerForm.phone,
      client_email: customerForm.email,
      client_address: customerForm.address,
      TIN_Code: customerForm.tin

    } : {
      client_ID: customerForm.id,
      name: customerForm.name,
      contact: customerForm.contact,
      phone: customerForm.phone,
      email: customerForm.email,
      address: customerForm.address,
      tin: customerForm.tin

    };

    try {
      const res = await fetch("/api/client", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        const errorData = await res.json();
        console.error("Server error:", errorData.error);
      }

    } catch (err) {
      console.error("Customer action failed:", err);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.sales_id) return alert("Please select an invoice first.");

    const amount = Math.round((Number(paymentForm.amount) || 0) * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return alert("Please enter a valid payment amount.");

    try {
      const res = await fetch(`/api/sales/${paymentForm.sales_id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:   selected.client_ID,
          employee_id: paymentForm.employee_id,
          amount,
          or_number:   paymentForm.or_number,
          type:        paymentForm.type,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Payment Recorded!");
        setIsPaymentModalOpen(false);
        setPaymentForm({ sales_id: "", amount: "", or_number: "", type: "Cash", employee_id: 1 });
        fetchCustomers();
        const updatedTx = await fetch(`/api/client/${selected.client_ID}/transactions`).then(r => r.json());
        setTransactions(updatedTx);
      } else {
        alert("Error: " + (data.error || "Payment failed"));
      }
    } catch (err) {
      console.error("Payment submission failed:", err);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
        <button 
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          onClick={() => {
            setModalMode("add");
            setCustomerForm({ name: "", contact: "", phone: "", email: "", address: "", tin: "" });
            setIsModalOpen(true);
          }}
        >
          + Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                className={`w-full text-left px-4 py-4 border-b border-slate-100 transition-all ${selected?.client_ID === c.client_ID ? "bg-blue-50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent hover:bg-slate-50"}`}
              >
                <div className="font-bold text-slate-800 text-sm">{c.client_name}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{c.contactPerson || "No Contact Person"}</div>
                {Number(c.client_outstandingbalance) > 0 && (
                  <div className="text-xs text-red-600 font-bold mt-2 bg-red-50 inline-block px-2 py-0.5 rounded">
                    Balance: ₱{Number(c.client_outstandingbalance).toLocaleString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Detail */}
        {selected ? (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selected.client_name}</h2>
                  <div className="text-sm text-slate-500 mt-1 flex gap-3">
                    <span>ID: <span className="text-slate-700 font-mono">{selected.client_ID}</span></span>
                    <span>TIN: <span className="text-slate-700 font-mono">{selected.TIN_Code || 'N/A'}</span></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(selected)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-slate-200">Edit</button>
                  <button onClick={() => setIsPaymentModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">Record Payment</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                {[
                  { label: "Contact Person", value: selected.contactPerson || "N/A" },
                  { label: "Phone", value: selected.client_contactNumber },
                  { label: "Email", value: selected.client_email || "N/A" },
                  {
                    label: "Outstanding Balance",
                    value: `₱${Number(selected.client_outstandingbalance || 0).toLocaleString()}`,
                    highlight: Number(selected.client_outstandingbalance) > 0 ? "text-red-600 font-bold text-lg" : "text-green-600 font-bold text-lg",
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                    <div className={`text-slate-800 ${item.highlight || "font-semibold"}`}>{item.value}</div>
                  </div>
                ))}
                <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Address</div>
                  <div className="font-semibold text-slate-800">{selected.client_address}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                 <h3 className="text-base font-bold text-slate-800">Recent Transaction History</h3>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-bold tracking-widest">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Ref ID</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Balance</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length > 0 ? transactions.map((tx) => (
                      <tr key={tx.sales_ID} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-600">{new Date(tx.sales_Date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">INV-{tx.sales_ID}</td>
                        <td className="px-6 py-4 text-slate-800 font-semibold">₱{Number(tx.sales_totalAmount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-500 font-bold">₱{Number(tx.sales_Balance).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">{txBadge(tx.sales_paymentStatus)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No transactions recorded for this client.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-medium">
            Select a client from the list to view full details
          </div>
        )}
      </div>

      {isModalOpen && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xlw-[360px] max-w-[90%] shadow-xl text-slate-800">
          <h2 className="text-xl font-bold mb-4">{modalMode === "add" ? "Add New Customer" : "Edit Customer Details"}</h2>
          <form onSubmit={handleCustomerSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Business/Client Name</label>
              <input type="text" className="w-full border p-2 rounded-lg" required
                value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</label>
                <input type="text" className="w-full border p-2 rounded-lg" required
                  value={customerForm.contact} onChange={e => setCustomerForm({...customerForm, contact: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                <input type="text" className="w-full border p-2 rounded-lg" required
                  value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
              <input type="text" className="w-full border p-2 rounded-lg" required
                value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email (Optional)</label>
                <input type="email" className="w-full border p-2 rounded-lg"
                  value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">TIN Code</label>
                <input type="text" className="w-full border p-2 rounded-lg"
                  value={customerForm.tin} onChange={e => setCustomerForm({...customerForm, tin: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">
                {modalMode === "add" ? "Save Customer" : "Update Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {isPaymentModalOpen && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[360px] max-w-[90%] shadow-xl text-slate-800">
        <h2 className="text-xl font-bold mb-2">Record Payment</h2>
        <p className="text-sm text-slate-500 mb-4">Customer: {selected.client_name}</p>
        
        <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
          <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Select Unpaid Invoice</label>
          <select 
            className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            required
            value={paymentForm.sales_id}
            onChange={e => setPaymentForm({...paymentForm, sales_id: e.target.value})}
          >
            <option value="">-- Choose Invoice --</option>
            {transactions.filter(t => t.sales_Balance > 0).map(t => (
              <option key={t.sales_ID} value={t.sales_ID}>
                INV-{t.sales_ID} (Bal: ₱{Number(t.sales_Balance).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">Amount to Pay</label>
            <input type="number" step="0.01" inputMode="decimal" className="w-full border p-2 rounded-lg text-sm" required placeholder="0.00"
              value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">OR / Ref Number</label>
            <input type="text" className="w-full border p-2 rounded-lg text-sm" required placeholder="OR#1234"
              value={paymentForm.or_number} onChange={e => setPaymentForm({...paymentForm, or_number: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
            <div className="flex gap-2 mt-1">
              {["Cash", "GCash", "Check"].map(method => (
                <button
                  key={method} type="button"
                  onClick={() => setPaymentForm({...paymentForm, type: method})}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-all ${paymentForm.type === method ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100">Post Payment</button>
          </div>
        </form>
      </div>
    </div>
  )}
    </div>
  );
}

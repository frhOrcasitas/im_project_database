"use client";

import { useState, useEffect } from "react";

// Helper to map DB status to UI styles
const statusBadge = (status) => {
  // 1. Normalize to lowercase
  const normalized = status?.toLowerCase();

  // 2. Use lowercase keys in your map
  const map = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-red-100 text-red-700",
    "in transit": "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[normalized] || "bg-amber-100 text-amber-700"}`}>
      {status}
    </span>
  );
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
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ client_ID: "", amountPaid: 0 });
  const [selectedItems, setSelectedItems] = useState([{ product_ID: "", qty: 1, price: 0 }]);

  // 1. Fetch Sales from Backend
    useEffect(() => {
      async function initData() {
        setLoading(true);
        try {
          const [salesRes, clientRes, productRes] = await Promise.all([
            fetch("/api/sales"),
            fetch("/api/client"), 
            fetch("/api/products"),
          ]);
          
          if (!salesRes.ok || !clientRes.ok || !productRes.ok) throw new Error("API failure");

          const salesData = await salesRes.json();
          const clientData = await clientRes.json();
          const productData = await productRes.json();

          // Ensure we are setting arrays. 
          // If your DB returns [rows, fields], we take [0].
          setSales(Array.isArray(salesData) ? salesData : salesData.data || []);
          setClients(Array.isArray(clientData) ? clientData : clientData.data || []);
          setProducts(Array.isArray(productData) ? productData : productData.data || []);
          
        } catch (error) {
          console.error("Fetch error:", error);
        } finally {
          setLoading(false);
        }
      }
      initData();
    }, []);

  // 2. Filter Logic
  const filtered = sales.filter(
    (s) => statusFilter === "all" || s.sales_status === statusFilter
  );

  // 3. Live Stats Calculation
  const stats = {
    pending: sales.filter(s => s.sales_status === 'Pending').length,
    completed: sales.filter(s => s.sales_status === 'Completed').length,
    revenue: sales.reduce((acc, curr) => acc + Number(curr.sales_totalAmount), 0)
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Good practice to confirm cancellations since it affects inventory
    const msg = newStatus === 'Cancelled' 
      ? "Are you sure? This will return items to stock." 
      : `Change order #ORD-${orderId} to ${newStatus}?`;
      
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/sales/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type" : "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh the table
        const updatedRes = await fetch("/api/sales");
        const updatedData = await updatedRes.json();
        setSales(updatedData);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleViewClick = async (order) => {
    setOrderDetails([]); // Clear old data so you don't see the previous order's items
    setViewingOrder(order);
    setIsViewModalOpen(true);
    
    try {
      const res = await fetch(`/api/sales/${order.sales_ID}/details`);
      const data = await res.json();
      
      // If the backend returns an error object {error: '...'}, this ensures we don't set it to state
      if (res.ok) {
        setOrderDetails(data);
      } else {
        console.error("API Error:", data.error);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Connecting to Database...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order & Shipment Management</h1>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Order
        </button>
      </div>

      {/* Order Flow Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Order Processing Flow</h2>
        <div className="flex items-start gap-1 overflow-x-auto pb-4 custom-scrollbar">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-shrink-0">
              <div className={`border-2 ${step.color} rounded-xl p-3 text-center min-w-[120px]`}>
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className="text-xs font-bold text-slate-700">{step.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{step.sub}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="text-slate-300 text-xl px-2 flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Orders", value: stats.pending, color: "text-red-500" },
          { label: "Completed", value: stats.completed, color: "text-green-600" },
          { label: "Total Sales", value: sales.length, color: "text-blue-600" },
          { label: "Total Revenue", value: `₱${stats.revenue.toLocaleString()}`, color: "text-slate-800" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-semibold">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Live Orders Table */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-base font-bold text-slate-700">Recent Sales Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {["all", "Pending", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === status 
                  ? "bg-slate-800 text-white shadow-md" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Order #", "Customer", "Date", "Amount", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.sales_ID} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-3 font-bold text-blue-600">#ORD-{s.sales_ID}</td>
                  <td className="py-4 px-3 text-slate-700 font-medium">{s.client_name}</td>
                  <td className="py-4 px-3 text-slate-500">{new Date(s.sales_createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-3 font-bold text-slate-800">₱{Number(s.sales_totalAmount).toLocaleString()}</td>
                  <td className="py-4 px-3">
                    <span className={Number(s.sales_Balance) > 0 ? "text-red-500 font-bold" : "text-slate-400"}>
                      ₱{Number(s.sales_Balance).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-3">{statusBadge(s.sales_status)}</td>
                  <td className="py-4 px-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-all"
                              onClick={() => handleViewClick(s)}>
                        View
                      </button>
                      {s.sales_status === 'Pending' && (
                        <button className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-md transition-all"
                                onClick={() => updateOrderStatus(s.sales_ID, 'Completed')}>
                          Ship
                        </button>
                      )}
                      {s.sales_status !== 'Cancelled' && (
                        <button 
                          className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md transition-all"
                          onClick={() => updateOrderStatus(s.sales_ID, 'Cancelled')}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">No orders found for this category.</div>
          )}
        </div>
      </div>

      {isViewModalOpen && viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Order #ORD-{viewingOrder.sales_ID}</h2>
                <p className="text-sm text-slate-500">Customer: {viewingOrder.client_name}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            
            <div className="p-6">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b">
                    <th className="py-2">Product</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.isArray(orderDetails) && orderDetails.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-black">{item.product_name}</td>
                      <td className="py-3 text-center text-black">{item.salesDetail_qty}</td>
                      <td className="py-3 text-right text-black">₱{Number(item.salesDetail_unitPriceSold).toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-black">₱{Number(item.salesDetail_subtotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-6 flex justify-end">
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Amount</p>
                    <p className="text-2xl font-black text-blue-600">₱{Number(viewingOrder.sales_totalAmount).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Create New Sales Order</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 text-2xl">&times;</button>
              </div>

              <div className="space-y-4">
                {/* Client Selector */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Select Customer</label>
                  <select 
                    className="w-full mt-1 p-2 border text-black border-slate-200 rounded-lg text-sm bg-slate-50"
                    value={formData.client_ID} 
                    onChange={(e) => setFormData({ ...formData, client_ID: e.target.value })}
                  >
                    <option value="">-- Choose a Client --</option>
                    {clients?.length > 0 ? (
                      clients.map(c => (
                        <option key={c.client_ID} value={c.client_ID}>
                          {c.client_name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No clients found in database</option>
                    )}
                  </select>
                </div>

                {/* Items Table */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Order Items</label>
                    <button 
                      onClick={() => setSelectedItems([...selectedItems, { product_ID: "", qty: 1, price: 0 }])}
                      className="text-blue-600 text-xs font-bold hover:underline"
                    >+ Add Item</button>
                  </div>

                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-center">
                      <select 
                        className="flex-1 p-2 border text-black border-slate-200 rounded-lg text-sm"
                        onChange={(e) => {
                          const p = products.find(prod => prod.product_ID == e.target.value);
                          const newItems = [...selectedItems];
                          newItems[index] = { ...newItems[index], product_ID: e.target.value, price: p?.product_unitPrice || 0 };
                          setSelectedItems(newItems);
                        }}
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.product_ID} value={p.product_ID} disabled={p.product_stockQty <= 0}>
                            {p.product_name} (Stock: {p.product_stockQty})
                          </option>
                        ))}
                      </select>
                      <input 
                        type="number" min="1" placeholder="Qty" 
                        className="w-20 p-2 border text-black border-slate-200 rounded-lg text-sm"
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[index].qty = Number(e.target.value);
                          setSelectedItems(newItems);
                        }}
                      />
                      <button 
                        onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600 px-2"
                      >✕</button>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-800">Total Order Amount:</span>
                  <span className="text-xl font-black text-blue-600">
                    ₱{selectedItems.reduce((sum, i) => sum + (i.qty * i.price), 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                  >Cancel</button>
                  <button 
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-100 transition-all"
                    onClick={async () => {
                      const total = selectedItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
                      const res = await fetch("/api/sales", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          client_ID: formData.client_ID,
                          items: selectedItems,
                          totalAmount: total,
                          amountPaid: 0 // Partner can add a payment input later
                        })
                      });
                      
                      if (res.ok) {
                        const updated = await (await fetch("/api/sales")).json();
                        setSales(updated);
                        setIsCreateModalOpen(false);
                        setSelectedItems([{ product_ID: "", qty: 1, price: 0 }]);
                      } else {
                        const err = await res.json();
                        alert(err.error || "Failed to create order");
                      }
                    }}
                  >Create Order & Update Inventory</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";

// ─── Status Badge Logic ──────────────────────────────────────────────────────
const getStatus = (stock, reorder) => {
  if (stock <= 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
  if (stock <= reorder) return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
  return { label: "In Stock", cls: "bg-green-100 text-green-700" };
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", stock: 0, unit: "Case", reorder: 5, price: 0, description: ""
  });
  const [restockItem, setRestockItem] = useState(null); // Holds the product object
  const [restockQty, setRestockQty] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [editItem, setEditItem] = useState(null);

  // ─── Connection Logic ──────────────────────────────────────────────────────
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory"); // Ensure this matches your route
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // ─── Derived Calculations ──────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const { label } = getStatus(p.product_stockQty, p.product_reorderPoint);
    
    // Search by Name or ID (formatted as a string)
    const searchTerm = search.toLowerCase();
    const matchSearch = 
      p.product_name?.toLowerCase().includes(searchTerm) || 
      String(p.product_ID).includes(searchTerm);

    const statusKey = label.replace(/\s+/g, '-').toLowerCase();
    const matchStatus = statusFilter === "all" || statusKey === statusFilter;

    return matchSearch && matchStatus;
  });

  const stats = {
    totalItems: products.length,
    inStock: products.filter(p => Number(p.product_stockQty) > Number(p.product_reorderPoint)).length,
    lowStock: products.filter(p => {
      const qty = Number(p.product_stockQty);
      const reorder = Number(p.product_reorderPoint);
      return qty > 0 && qty <= reorder;
    }).length,
    outOfStock: products.filter(p => p.product_stockQty <= 0).length,
    totalValue: products.reduce((sum, p) => {
        // Number() converts strings to numbers and handles null/undefined as 0
        const qty = Number(p.product_stockQty) || 0;
        const price = Number(p.product_costPrice || p.product_sellingPrice) || 0;
        return sum + (qty * price);
      }, 0)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchInventory(); // Refresh the list
        setFormData({ name: "", stock: 0, unit: "Case", reorder: 5, price: 0, description: "" });
      }
    } catch (err) {
      console.error("Add product failed:", err);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/inventory/restock`, {
        method: "PATCH", // Using PATCH since we are updating existing stock
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: restockItem.product_ID,
          quantity: parseInt(restockQty),
          cost: parseFloat(restockCost)
        }),
      });

      if (res.ok) {
        setRestockItem(null);
        setRestockQty("");
        setRestockCost("");
        fetchInventory(); // Refresh the table
      }
    } catch (err) {
      console.error("Restock failed:", err);
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });

      if (res.ok) {
        setEditItem(null);
        fetchInventory();
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Product
          </button>
          <button onClick={fetchInventory} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Products", val: stats.totalItems, color: "text-slate-800" },
          { label: "In Stock", val: stats.inStock, color: "text-green-600" },
          { label: "Low Stock", val: stats.lowStock, color: "text-amber-500" },
          { label: "Out of Stock", val: stats.outOfStock, color: "text-red-500" },
          { label: "Total Value", val: `₱${stats.totalValue.toLocaleString()}`, color: "text-blue-600" },        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.val}</div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Search code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Product</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">Reorder</th>
                <th className="px-4 py-4">Unit</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="8" className="py-10 text-center text-slate-400">Loading inventory...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="py-10 text-center text-slate-400">No products found.</td></tr>
              ) : (
                filtered.map((p) => {
                  const status = getStatus(p.product_stockQty, p.product_reorderPoint);
                  return (
                    <tr key={p.product_ID} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600 text-xs mb-0.5">PID-{String(p.product_ID).padStart(4, '0')}</div>
                        <div className="font-semibold text-slate-700">{p.product_name}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-sm">{p.product_category}</td>
                      <td className={`px-4 py-4 font-bold ${p.product_stockQty <= p.product_reorderPoint ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.product_stockQty}
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">{p.product_reorderPoint}</td>
                      <td className="px-4 py-4 text-slate-400 text-sm">{p.product_unit}</td>
                      <td className="px-4 py-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Selling</div>
                        <div className="font-bold text-slate-700">₱{p.product_sellingPrice?.toLocaleString()}</div>
                      </td>
                      <td className={`px-4 py-4 font-bold ${Number(p.product_stockQty) <= Number(p.product_reorderPoint) ? 'text-red-600' : 'text-slate-700'}`}>
                        <div className="flex items-center gap-2">
                          {p.product_stockQty}
                          {Number(p.product_stockQty) <= Number(p.product_reorderPoint) && (
                            <span title="Low Stock Warning" className="cursor-help">⚠️</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md" onClick={() => setEditItem(p)}>Edit</button>
                          <button className="p-1.5 hover:bg-green-50 text-green-600 rounded-md" onClick={() => setRestockItem(p)}>Stock</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-black">Add New condiment</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="text" placeholder="Product Name (e.g. Tomato Ketchup)" className="border p-2 rounded-lg text-black" required
                  onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Initial Stock" className="border p-2 rounded-lg text-black"
                    onChange={e => setFormData({...formData, stock: e.target.value})} />
                  <input type="text" placeholder="Unit (Case/Gal)" className="border p-2 rounded-lg text-black"
                    onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Selling Price" className="border p-2 rounded-lg text-black" required
                    onChange={e => setFormData({...formData, price: e.target.value})} />
                  <input type="number" placeholder="Reorder Level" className="border p-2 rounded-lg text-black"
                    onChange={e => setFormData({...formData, reorder: e.target.value})} />
                </div>

                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-black">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg">Save Product</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {restockItem && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800">Restock Product</h2>
                  <button onClick={() => setRestockItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                
                <p className="text-sm text-slate-500 mb-4">
                  Adding stock for: <span className="font-bold text-blue-600">{restockItem.product_name}</span>
                </p>

                <form onSubmit={handleRestockSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Quantity to Add ({restockItem.product_unit})</label>
                    <input 
                      type="number" required min="1"
                      className="w-full border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-green-500 outline-none"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Unit Cost (₱)</label>
                    <input 
                      type="number" required step="0.01"
                      className="w-full border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Current cost from production"
                      value={restockCost}
                      onChange={(e) => setRestockCost(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-200">
                    Confirm Restock
                  </button>
                </form>
              </div>
            </div>
          )}

          {editItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Edit Product</h2>
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                    <input 
                      type="text" className="w-full border p-2 rounded-lg text-black" required
                      value={editItem.product_name}
                      onChange={e => setEditItem({...editItem, product_name: e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                      <input 
                        type="text" className="w-full border p-2 rounded-lg text-black" required
                        value={editItem.product_name}
                        onChange={e => setEditItem({...editItem, product_name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                      <input 
                        type="text" className="w-full border p-2 rounded-lg text-black" required
                        value={editItem.product_unit} // Matches the alias in your GET route
                        onChange={e => setEditItem({...editItem, product_unit: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2 bg-slate-100 rounded-lg text-black">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Update Product</button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </div>
  );
}
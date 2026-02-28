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
    const matchSearch = 
      p.product_name?.toLowerCase().includes(search.toLowerCase()) || 
      p.product_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || label.replace(/\s+/g, '-').toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    totalItems: products.length,
    inStock: products.filter(p => p.product_stockQty > p.product_reorderPoint).length,
    lowStock: products.filter(p => p.product_stockQty > 0 && p.product_stockQty <= p.product_reorderPoint).length,
    outOfStock: products.filter(p => p.product_stockQty <= 0).length,
    totalValue: products.reduce((sum, p) => {
        // Number() converts strings to numbers and handles null/undefined as 0
        const qty = Number(p.product_stockQty) || 0;
        const cost = Number(p.product_costPrice) || 0;
        return sum + (qty * cost);
      }, 0)
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
        <div className="flex gap-2">
          <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
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
          { label: "Total Value", val: `₱${(stats.totalValue / 1000).toFixed(2)}`, color: "text-blue-600" },
        ].map((s) => (
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
                    <tr key={p.product_code} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600 text-xs mb-0.5">{p.product_code}</div>
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
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md">Edit</button>
                          <button className="p-1.5 hover:bg-green-50 text-green-600 rounded-md">Stock</button>
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
    </div>
  );
}
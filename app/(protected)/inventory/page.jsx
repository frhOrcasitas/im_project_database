"use client";

import { useState } from "react";

const inventoryData = [
  { code: "PRD-001", name: "Product A", category: "Category 1", stock: 150, reorder: 20, unit: "pcs", cost: 200, price: 280, status: "in-stock" },
  { code: "PRD-002", name: "Product B", category: "Category 1", stock: 8, reorder: 15, unit: "pcs", cost: 140, price: 180, status: "low-stock" },
  { code: "PRD-003", name: "Product C", category: "Category 2", stock: 0, reorder: 10, unit: "pcs", cost: 260, price: 320, status: "out-of-stock" },
  { code: "PRD-004", name: "Product D", category: "Category 2", stock: 45, reorder: 20, unit: "pcs", cost: 380, price: 450, status: "in-stock" },
  { code: "PRD-005", name: "Product E", category: "Category 3", stock: 3, reorder: 10, unit: "pcs", cost: 70, price: 95, status: "low-stock" },
  { code: "PRD-006", name: "Product F", category: "Category 1", stock: 200, reorder: 30, unit: "pcs", cost: 110, price: 150, status: "in-stock" },
  { code: "PRD-007", name: "Product G", category: "Category 3", stock: 67, reorder: 25, unit: "pcs", cost: 310, price: 400, status: "in-stock" },
];

const statusBadge = (status) => {
  if (status === "in-stock") return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">In Stock</span>;
  if (status === "low-stock") return <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Low Stock</span>;
  return <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Out of Stock</span>;
};

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = inventoryData.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = inventoryData.reduce((s, p) => s + p.stock * p.cost, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
        <div className="flex gap-2 flex-wrap">
          <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Add Product
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            📥 Import Stock
          </button>
          <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            📤 Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Products", value: 156, color: "text-slate-800" },
          { label: "In Stock", value: 128, color: "text-green-600" },
          { label: "Low Stock", value: 23, color: "text-amber-500" },
          { label: "Out of Stock", value: 5, color: "text-red-500" },
          { label: "Total Value", value: `₱${(totalValue / 1000).toFixed(0)}K`, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">🔄 Refresh</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Product Code", "Product Name", "Category", "Stock Qty", "Reorder Pt.", "Unit", "Cost Price", "Selling Price", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.code} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-blue-600">{p.code}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{p.name}</td>
                  <td className="py-3 px-3 text-slate-600">{p.category}</td>
                  <td className={`py-3 px-3 font-semibold ${p.stock === 0 ? "text-red-500" : p.stock <= p.reorder ? "text-amber-500" : "text-slate-700"}`}>
                    {p.stock}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{p.reorder}</td>
                  <td className="py-3 px-3 text-slate-500">{p.unit}</td>
                  <td className="py-3 px-3 text-slate-600">₱{p.cost.toLocaleString()}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">₱{p.price.toLocaleString()}</td>
                  <td className="py-3 px-3">{statusBadge(p.status)}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded transition-colors">Edit</button>
                      <button className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded transition-colors">Restock</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-slate-400 text-right">
          Showing {filtered.length} of {inventoryData.length} products
        </div>
      </div>
    </div>
  );
}

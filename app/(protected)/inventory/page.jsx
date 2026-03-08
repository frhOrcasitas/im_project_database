"use client";

import { useState, useEffect } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStatus = (stock, reorder) => {
  if (stock <= 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
  if (stock <= reorder) return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
  return { label: "In Stock", cls: "bg-green-100 text-green-700" };
};

// Formats date to YYYY-MM-DD (removes the T and timestamp)
const formatDateOnly = (dateStr) => {
  if (!dateStr) return "N/A";
  return dateStr.split('T')[0];
};

// ─── Record Warehouse Damage Modal ───────────────────────────────────────────
function WarehouseDamageModal({ products, onClose, onSuccess }) {
  const [managers,   setManagers]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [items,      setItems]      = useState([{ product_ID: "", damage_quantity: 1, damage_description: "" }]);
  const [form,       setForm]       = useState({ manager_id: "", employee_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    // Fetch employee data and filter for managers and active employees
    fetch("/api/employee")
      .then(res => res.json())
      .then(data => {
        const all = Array.isArray(data) ? data : [];
        setManagers(all.filter(e => Number(e.isManager) === 1 || e.role === "Manager"));
        setEmployees(all.filter(e => e.employee_status === "Active" || e.status === "Active"));
      })
      .catch(err => console.error("Error fetching employees:", err));
  }, []);

  const addItem = () => setItems(i => [...i, { product_ID: "", damage_quantity: 1, damage_description: "" }]);
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx));
  const updateItem = (idx, key, val) => setItems(i => i.map((item, j) => j === idx ? { ...item, [key]: val } : item));

  const handleSubmit = async () => {
    if (!form.manager_id)  return setError("Select a manager.");
    if (!form.employee_id) return setError("Select an employee.");
    if (items.some(i => !i.product_ID)) return setError("Select a product for each item.");

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/damage/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager_ID:   Number(form.manager_id), 
          employee_ID:  Number(form.employee_id), 
          damage_date: new Date().toISOString().split('T')[0],
          items: items.map(i => ({
            product_ID:         Number(i.product_ID),
            damage_quantity:    Number(i.damage_quantity),
            damage_description: i.damage_description || "No description",
          })),
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record damage");
      
      onSuccess("Warehouse damage recorded.");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">🏭 Record Warehouse Damage</h2>
            <p className="text-xs text-slate-400 mt-0.5">Stock will be deducted immediately</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold text-xl">✕</button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Manager <span className="text-red-400">*</span></label>
              <select className={inputCls} value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}>
                <option value="">Select manager...</option>
                {managers.map(m => <option key={m.employee_ID} value={m.employee_ID}>{m.employee_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Reported By <span className="text-red-400">*</span></label>
              <select className={inputCls} value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">Select employee...</option>
                {employees.map(e => <option key={e.employee_ID} value={e.employee_ID}>{e.employee_name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Damaged Items <span className="text-red-400">*</span></label>
              <button onClick={addItem} className="text-xs font-bold text-blue-600 hover:underline">+ Add Item</button>
            </div>
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-3 flex flex-col gap-2 bg-slate-50 relative">
                  <div className="flex gap-2 items-center">
                    <select
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                      value={item.product_ID}
                      onChange={e => updateItem(idx, "product_ID", e.target.value)}
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.product_ID} value={p.product_ID}>
                          {p.product_name} (Stock: {p.product_stockQty})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number" min="1"
                      className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                      placeholder="Qty"
                      value={item.damage_quantity}
                      onChange={e => updateItem(idx, "damage_quantity", e.target.value)}
                    />
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 px-2 text-lg font-bold">✕</button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="Description (optional)"
                    value={item.damage_description}
                    onChange={e => updateItem(idx, "damage_description", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium">{error}</div>}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting} 
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-red-100"
          >
            {submitting ? "Recording..." : "⚠️ Record Damage"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Record Delivery Damage Modal ─────────────────────────────────────────────
function DeliveryDamageModal({ onClose, onSuccess, initialShipmentID = "" }) {
  const [shipmentID,  setShipmentID]  = useState(String(initialShipmentID));
  const [loadingShip, setLoadingShip] = useState(false);
  const [items,       setItems]       = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [loaded,      setLoaded]      = useState(false);

  useEffect(() => {
    if (initialShipmentID) doLoad(String(initialShipmentID));
  }, []);

  const doLoad = async (id) => {
    if (!id) return setError("Enter a shipment ID.");
    setLoadingShip(true); setError(""); setLoaded(false);
    try {
      const res  = await fetch(`/api/shipment/${id}`);
      const data = await res.json();
      if (!res.ok || !data.items?.length) throw new Error("Shipment not found or has no items.");
      setItems(data.items.map(i => ({
        productLine_ID: i.productLine_ID, 
        product_name: i.product_name, 
        product_ID: i.product_ID,
        shipped_qty: i.product_quantity, 
        damage_quantity: 1, 
        damage_description: "", 
        include: false,
      })));
      setLoaded(true);
    } catch (err) { 
      setError(err.message); 
      setItems([]); 
      setLoaded(false); 
    }
    finally { 
      setLoadingShip(false); 
    }
  };

  const updateItem = (idx, key, val) =>
    setItems(prev => prev.map((item, j) => j === idx ? { ...item, [key]: val } : item));

  const handleSubmit = async () => {
    const selected = items.filter(i => i.include);
    if (!selected.length) return setError("Check at least one damaged item.");
    
    for (const s of selected) {
      if (Number(s.damage_quantity) < 1) return setError(`Qty must be ≥ 1 for "${s.product_name}".`);
      if (Number(s.damage_quantity) > s.shipped_qty) return setError(`Qty for "${s.product_name}" exceeds shipped qty (${s.shipped_qty}).`);
    }

    setSubmitting(true); 
    setError("");
    try {
      const res = await fetch("/api/damage/during", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          shipment_ID: Number(shipmentID), 
          items: selected.map(i => ({
            productLine_ID: i.productLine_ID, 
            product_ID: i.product_ID,
            damage_quantity: Number(i.damage_quantity),
            damage_description: i.damage_description || null,
          })) 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess("Delivery damage recorded.");
      onClose();
    } catch (err) { 
      setError(err.message); 
    }
    finally { 
      setSubmitting(false); 
    }
  };

  const selectedCount = items.filter(i => i.include).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" style={{ pointerEvents: 'auto' }}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden" style={{ pointerEvents: 'auto' }}>
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0" style={{ pointerEvents: 'auto' }}>
          <div>
            <h2 className="text-lg font-bold text-slate-800">🚚 Record Delivery Damage</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loaded ? `SHP-${shipmentID} · ${items.length} item(s) · ${selectedCount} selected` : "Link damage to a specific shipment"}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 flex-shrink-0"
            style={{ pointerEvents: 'auto' }}
          >
            ✕
          </button>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4" style={{ pointerEvents: 'auto' }}>
          
          {/* SHIPMENT ID INPUT */}
          <div style={{ pointerEvents: 'auto' }}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Shipment ID <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2" style={{ pointerEvents: 'auto' }}>
              <input 
                type="number" 
                min="1" 
                placeholder="e.g. 9"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={shipmentID}
                onChange={e => { setShipmentID(e.target.value); setItems([]); setLoaded(false); setError(""); }}
                onKeyDown={e => e.key === "Enter" && doLoad(shipmentID)}
                style={{ pointerEvents: 'auto' }}
              />
              <button 
                onClick={() => doLoad(shipmentID)} 
                disabled={loadingShip || !shipmentID}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg min-w-[72px]"
                style={{ pointerEvents: 'auto' }}
              >
                {loadingShip ? "..." : loaded ? "Reload" : "Load"}
              </button>
            </div>
          </div>

          {/* ITEMS LIST */}
          {items.length > 0 && (
            <div style={{ pointerEvents: 'auto' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Select Damaged Items <span className="text-red-400">*</span>
                </label>
                <span className="text-xs text-slate-400">{selectedCount} / {items.length} selected</span>
              </div>

              <div className="flex flex-col gap-2" style={{ pointerEvents: 'auto' }}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => updateItem(idx, "include", !item.include)}
                    className={`border rounded-xl p-3 transition-all cursor-pointer hover:shadow-sm ${
                      item.include
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-slate-50 hover:bg-orange-50"
                    }`}
                  >
                    
                    {/* Product Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 flex items-center justify-center rounded border ${
                            item.include
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {item.include && "✓"}
                        </div>

                        {/* Product Name */}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Shipped: {item.shipped_qty}
                          </p>
                        </div>
                      </div>

                      {/* Damage Quantity */}
                      {item.include && (
                        <input
                          type="number"
                          min="1"
                          max={item.shipped_qty}
                          value={item.damage_quantity}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "damage_quantity",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20 border border-orange-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      )}
                    </div>

                    {/* Description */}
                    {item.include && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Optional damage description"
                          value={item.damage_description || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            updateItem(idx, "damage_description", e.target.value)
                          }
                          className="w-full border border-orange-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loaded && !loadingShip && !error && (
            <p className="text-xs text-slate-400 italic text-center py-2">Enter a shipment ID above and click Load to see items.</p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0" style={{ pointerEvents: 'auto' }}>
          <button 
            onClick={onClose} 
            className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50"
            style={{ pointerEvents: 'auto' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || selectedCount === 0}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm"
            style={{ pointerEvents: 'auto' }}
          >
            {submitting ? "Recording..." : `⚠️ Record ${selectedCount > 0 ? `${selectedCount} Item${selectedCount > 1 ? "s" : ""}` : "Damage"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === "error" ? "bg-red-600" : "bg-green-600"}`}>
      {message}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Inventory() {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [formData,     setFormData]     = useState({ name: "", stock: 0, unit: "Case", reorder: 5, price: 0, description: "" });
  const [restockItem,  setRestockItem]  = useState(null);
  const [restockQty,   setRestockQty]   = useState("");
  const [restockCost,  setRestockCost]  = useState("");
  const [editItem,     setEditItem]     = useState(null);
  const [toast,        setToast]        = useState(null);

  // Damage state
  const [damageTab,          setDamageTab]          = useState("warehouse");
  const [warehouseDamages,   setWarehouseDamages]   = useState([]);
  const [deliveryDamages,    setDeliveryDamages]     = useState([]);
  const [damageLoading,      setDamageLoading]       = useState(true);
  const [showWarehouseDmgModal, setShowWarehouseDmgModal] = useState(false);
  const [showDeliveryDmgModal,  setShowDeliveryDmgModal]  = useState(false);

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDamages = async () => {
    setDamageLoading(true);
    try {
      const [wRes, dRes] = await Promise.all([
        fetch("/api/damage/warehouse"),
        fetch("/api/damage/during"),
      ]);
      const [wData, dData] = await Promise.all([wRes.json(), dRes.json()]);
      setWarehouseDamages(Array.isArray(wData) ? wData : []);
      setDeliveryDamages(Array.isArray(dData) ? dData.map(d => ({
        ...d,
        shipment_ID: d.shipment_ID ?? d.shipment_id ?? null,
        damage_ID:   d.damage_ID   ?? d.damage_id   ?? null,
      })) : []);
    } catch {
      setWarehouseDamages([]);
      setDeliveryDamages([]);
    } finally {
      setDamageLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchDamages();
  }, []);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const { label } = getStatus(p.product_stockQty, p.product_reorderPoint);
    const searchTerm = search.toLowerCase();
    const matchSearch = p.product_name?.toLowerCase().includes(searchTerm) || String(p.product_ID).includes(searchTerm);
    const statusKey = label.replace(/\s+/g, '-').toLowerCase();
    const matchStatus = statusFilter === "all" || statusKey === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    totalItems:  products.length,
    inStock:     products.filter(p => Number(p.product_stockQty) > Number(p.product_reorderPoint)).length,
    lowStock:    products.filter(p => { const q = Number(p.product_stockQty), r = Number(p.product_reorderPoint); return q > 0 && q <= r; }).length,
    outOfStock:  products.filter(p => p.product_stockQty <= 0).length,
    totalValue:  products.reduce((sum, p) => sum + ((Number(p.product_stockQty) || 0) * (Number(p.product_costPrice || p.product_sellingPrice) || 0)), 0),
  };

  const totalDamageLoss =
    warehouseDamages.reduce((s, d) => s + Number(d.damage_subtotal || 0), 0) +
    deliveryDamages.reduce((s, d) => s + Number(d.damage_subtotal || 0), 0);

  // ─── Handlers ──────────────────────────────────────────────────────────────
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
        fetchInventory();
        setFormData({ name: "", stock: 0, unit: "Case", reorder: 5, price: 0, description: "" });
        setToast({ message: "Product added.", type: "success" });
      }
    } catch {}
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/restock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: restockItem.product_ID, quantity: parseInt(restockQty), cost: parseFloat(restockCost) }),
      });
      if (res.ok) {
        setRestockItem(null); setRestockQty(""); setRestockCost("");
        fetchInventory();
        setToast({ message: "Stock updated.", type: "success" });
      }
    } catch {}
  };

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
        setToast({ message: "Product updated.", type: "success" });
      }
    } catch {}
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setIsModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Product
          </button>
          <button onClick={fetchInventory} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Products", val: stats.totalItems,  color: "text-slate-800" },
          { label: "In Stock",       val: stats.inStock,     color: "text-green-600" },
          { label: "Low Stock",      val: stats.lowStock,    color: "text-amber-500" },
          { label: "Out of Stock",   val: stats.outOfStock,  color: "text-red-500" },
          { label: "Total Value",    val: `₱${stats.totalValue.toLocaleString()}`, color: "text-blue-600" },
          { label: "Total Damage Loss", val: `₱${totalDamageLoss.toLocaleString()}`, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{loading ? "..." : s.val}</div>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
          <div className="flex gap-2 flex-1">
            <input
              type="text" placeholder="Search code or name..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="text-black border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-black border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
            <thead className="top-0 bg-white shadow-sm">
              <tr className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
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
              ) : filtered.map(p => {
                const status = getStatus(p.product_stockQty, p.product_reorderPoint);
                return (
                  <tr key={p.product_ID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600 text-xs mb-0.5">PID-{String(p.product_ID).padStart(4, '0')}</div>
                      <div className="font-semibold text-slate-700">{p.product_name}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-sm">{p.product_category}</td>
                    <td className={`px-4 py-4 font-bold ${Number(p.product_stockQty) <= Number(p.product_reorderPoint) ? 'text-amber-600' : 'text-slate-700'}`}>
                      {p.product_stockQty}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-sm">{p.product_reorderPoint}</td>
                    <td className="px-4 py-4 text-slate-400 text-sm">{p.product_unit}</td>
                    <td className="px-4 py-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Selling</div>
                      <div className="font-bold text-slate-700">₱{Number(p.product_sellingPrice).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                      {Number(p.product_stockQty) <= Number(p.product_reorderPoint) && Number(p.product_stockQty) > 0 && (
                        <span title="Low Stock Warning" className="ml-1 cursor-help">⚠️</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md text-sm" onClick={() => setEditItem(p)}>Edit</button>
                        <button className="p-1.5 hover:bg-green-50 text-green-600 rounded-md text-sm" onClick={() => setRestockItem(p)}>Stock</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Damage Records Section ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Section header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-700">⚠️ Damage Records</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {warehouseDamages.length + deliveryDamages.length} total records · Total loss: <span className="font-bold text-red-500">₱{totalDamageLoss.toLocaleString()}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWarehouseDmgModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              + Warehouse Damage
            </button>
            <button
              onClick={() => setShowDeliveryDmgModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              + Delivery Damage
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[
            { key: "warehouse", label: `🏭 Warehouse (${warehouseDamages.length})` },
            { key: "delivery",  label: `🚚 Delivery (${deliveryDamages.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setDamageTab(tab.key)}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                damageTab === tab.key
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {damageLoading ? (
            <div className="py-10 text-center text-slate-400 text-sm">Loading damage records...</div>
          ) : damageTab === "warehouse" ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["ID", "Date", "Product", "Qty", "Unit Cost", "Total Loss", "Description", "Employee", "Manager"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {warehouseDamages.length === 0 ? (
                  <tr><td colSpan="8" className="py-10 text-center text-slate-400 italic text-xs">No warehouse damage records.</td></tr>
                ) : warehouseDamages.map(d => (
                  <tr key={d.damage_ID} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-500 text-xs">DMG-{d.damage_ID}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{formatDateOnly(d.damage_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">{d.product_name}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{d.damage_quantity}</td>
                    <td className="px-4 py-3 text-slate-500">₱{Number(d.damage_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-red-600">₱{Number(d.damage_subtotal || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{d.damage_description || <span className="italic text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{d.employee_name || <span className="italic text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{d.manager_name || <span className="italic text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["ID", "Shipment", "Product", "Date", "Qty", "Unit Cost", "Total Loss", "Description"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deliveryDamages.length === 0 ? (
                  <tr><td colSpan="8" className="py-10 text-center text-slate-400 italic text-xs">No delivery damage records.</td></tr>
                ) : deliveryDamages
                    .filter((d, idx, arr) => arr.findIndex(x => x.damage_ID === d.damage_ID) === idx)
                    .map((d, idx) => (
                  <tr key={`${d.damage_ID}-${idx}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-500 text-xs">DMG-{d.damage_ID}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">
                      {(d.shipment_ID ?? d.shipment_id) ? `SHP-${d.shipment_ID ?? d.shipment_id}` : <span className="text-slate-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{d.product_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{d.damage_date ? new Date(d.damage_date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{d.damage_quantity}</td>
                    <td className="px-4 py-3 text-slate-500">₱{Number(d.damage_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-red-600">₱{Number(d.damage_subtotal || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate">{d.damage_description || <span className="italic text-slate-300">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────��───── */}

      {/* Add Product */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-black">Add New Product</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="text" placeholder="Product Name" className="border p-2 rounded-lg text-black" required
                onChange={e => setFormData({ ...formData, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Initial Stock" className="border p-2 rounded-lg text-black"
                  onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                <input type="text" placeholder="Unit (Case/Gal)" className="border p-2 rounded-lg text-black"
                  onChange={e => setFormData({ ...formData, unit: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Selling Price" className="border p-2 rounded-lg text-black" required
                  onChange={e => setFormData({ ...formData, price: e.target.value })} />
                <input type="number" placeholder="Reorder Level" className="border p-2 rounded-lg text-black"
                  onChange={e => setFormData({ ...formData, reorder: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-black">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setRestockItem(null)}>
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-[380px]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-slate-800">Restock Product</h2>
              <button onClick={() => setRestockItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Adding stock for: <span className="font-bold text-blue-600 ml-1">{restockItem.product_name}</span></p>
            <form onSubmit={handleRestockSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Quantity ({restockItem.product_unit})</label>
                <input type="number" required min="1" className="text-black w-full border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-green-500 outline-none"
                  value={restockQty} onChange={e => setRestockQty(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400">Unit Cost (₱)</label>
                <input type="number" required step="0.01" className="text-black w-full border border-slate-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-green-500 outline-none"
                  value={restockCost} onChange={e => setRestockCost(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition">Confirm Restock</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Edit Product</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Product Name</label>
                <input type="text" className="w-full border p-2 rounded-lg text-black" required
                  value={editItem.product_name} onChange={e => setEditItem({ ...editItem, product_name: e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                <input type="text" className="w-full border p-2 rounded-lg text-black" required
                  value={editItem.product_unit} onChange={e => setEditItem({ ...editItem, product_unit: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2 bg-slate-100 rounded-lg text-black">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Update Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse Damage Modal */}
      {showWarehouseDmgModal && (
        <WarehouseDamageModal
          products={products}
          onClose={() => setShowWarehouseDmgModal(false)}
          onSuccess={msg => {
            setShowWarehouseDmgModal(false);
            setToast({ message: msg, type: "success" });
            fetchInventory();
            fetchDamages();
          }}
        />
      )}

      {/* Delivery Damage Modal */}
      {showDeliveryDmgModal && (
        <DeliveryDamageModal
          onClose={() => setShowDeliveryDmgModal(false)}
          onSuccess={msg => {
            setShowDeliveryDmgModal(false);
            setToast({ message: msg, type: "success" });
            fetchInventory();
            fetchDamages();
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
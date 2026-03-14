"use client";
import { useState, useEffect, useRef } from "react";

function parsePcsPerCase(unitStr) {
  if (!unitStr) return null;
  const match = unitStr.match(/x\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

// ─── Reusable Modal Shell ───────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Field helpers ──────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const selectCls = inputCls + " bg-white";

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  const colors =
    type === "success"
      ? "bg-green-600 text-white"
      : "bg-red-600 text-white";
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${colors} animate-fade-in`}
    >
      {message}
    </div>
  );
}

function SaleField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const _inputCls  = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const _selectCls = _inputCls + " bg-white";

// MODAL 1 — NEW SALE
function NewSaleModal({ open, onClose, onSuccess, clients = [], products = [] }) {
  const emptyItem = { productLine_ID: "", quantity: 1, unitPrice: "", unitType: "Cases", remainder: 0 };
 
  const [form, setForm] = useState({
    client_ID: "", employee_ID: "", sales_notes: "",
    sales_SINumber: "", sales_DRNumber: "", sales_SWSNumber: "",
    items: [{ ...emptyItem }],
    payment: { payment_type: "Cash", payment_amount: "", employee_ID: "" },
  });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [employees, setEmployees] = useState([]);
 
  // ← ALL hooks must be before any early return
  useEffect(() => {
    if (!open) return;
    fetch("/api/employee")
      .then(r => r.json())
      .then(d => setEmployees(
        Array.isArray(d) ? d.filter(e => e.employee_status === "Active" && e.employee_ID !== 0) : []
      ))
      .catch(() => setEmployees([]));
  }, [open]);
 
  // ← Early return AFTER all hooks
  if (!open) return null;
 
  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
 
  const setItem = (i, key, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [key]: val };
    if (key === "productLine_ID" || key === "unitType") {
      const prodId   = key === "productLine_ID" ? val : items[i].productLine_ID;
      const unitType = key === "unitType"        ? val : items[i].unitType;
      const product  = products.find(p => String(p.product_ID) === String(prodId));
      if (product) {
        items[i].unitPrice = unitType === "Cases"
          ? (product.product_pricePerCase || product.product_unitPrice || "")
          : (product.product_unitPrice || "");
      }
    }
    setForm(f => ({ ...f, items }));
  };
 
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
 
  const total = form.items.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0
  );
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        items: form.items.map(it => ({
          productLine_ID: it.productLine_ID,
          quantity:       it.quantity,
          unitPrice:      it.unitPrice,
          unitType:       it.unitType,
          remainder:      it.remainder || 0,
        })),
        payment: form.payment.payment_amount
          ? { ...form.payment, employee_ID: form.employee_ID }
          : null,
      };
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(`Sale #${data.sales_ID || data.saleId} created successfully!`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800">+ New Sale / Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>
 
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
 
            {/* Client & Employee */}
            <div className="grid grid-cols-2 gap-3">
              <SaleField label="Client" required>
                <select className={_selectCls} value={form.client_ID}
                  onChange={e => setField("client_ID", e.target.value)} required>
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.client_ID} value={c.client_ID}>{c.client_name}</option>)}
                </select>
              </SaleField>
              <SaleField label="Employee" required>
                <select className={_selectCls} value={form.employee_ID}
                  onChange={e => setField("employee_ID", e.target.value)} required>
                  <option value="">Select employee...</option>
                  {employees.map(e => (
                    <option key={e.employee_ID} value={e.employee_ID}>{e.employee_name}</option>
                  ))}
                </select>
              </SaleField>
            </div>
 
            {/* Receipt Numbers */}
            <div className="grid grid-cols-3 gap-3">
              <SaleField label="SI Number">
                <input className={_inputCls} type="number" placeholder="SI #"
                  value={form.sales_SINumber} onChange={e => setField("sales_SINumber", e.target.value)} />
              </SaleField>
              <SaleField label="DR Number">
                <input className={_inputCls} type="number" placeholder="DR #"
                  value={form.sales_DRNumber} onChange={e => setField("sales_DRNumber", e.target.value)} />
              </SaleField>
              <SaleField label="SWS Number">
                <input className={_inputCls} type="number" placeholder="SWS #"
                  value={form.sales_SWSNumber} onChange={e => setField("sales_SWSNumber", e.target.value)} />
              </SaleField>
            </div>
 
            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Items <span className="text-red-400">*</span>
                </span>
                <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  + Add Item
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {form.items.map((item, i) => {
                  const selProd    = products.find(p => String(p.product_ID) === String(item.productLine_ID));
                  const pcsPerCase = parsePcsPerCase(selProd?.product_unit);
                  const pieces     = item.unitType === "Cases" && pcsPerCase
                    ? (parseInt(item.quantity) || 0) * pcsPerCase + (parseInt(item.remainder) || 0)
                    : (parseInt(item.quantity) || 0);
 
                  return (
                    <div key={i} className="bg-slate-50 rounded-lg p-3 flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-2 items-start">
 
                        {/* Product */}
                        <div className="col-span-5">
                          <select className={_selectCls} value={item.productLine_ID}
                            onChange={e => setItem(i, "productLine_ID", e.target.value)} required>
                            <option value="">Product...</option>
                            {products.map(p => (
                              <option key={p.product_ID} value={p.product_ID} disabled={p.product_stockQty <= 0}>
                                {p.product_name} {p.product_stockQty <= 0 ? "(Out)" : `(${p.product_stockQty})`}
                              </option>
                            ))}
                          </select>
                          {selProd?.product_unit && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{selProd.product_unit}</p>
                          )}
                        </div>
 
                        {/* Unit type + Qty + Remainder */}
                        <div className="col-span-2">
                          <div className="flex gap-0.5 bg-white rounded border border-slate-200 p-0.5">
                            {["Cases", "Pieces"].map(type => (
                              <button key={type} type="button"
                                onClick={() => setItem(i, "unitType", type)}
                                className={`flex-1 text-[9px] font-bold py-1 rounded transition-colors ${
                                  item.unitType === type ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                                }`}>
                                {type === "Cases" ? "Case" : "Pcs"}
                              </button>
                            ))}
                          </div>
                          <input className={_inputCls + " mt-1"} type="number" min="1" placeholder="Qty"
                            value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} required />
                          {item.unitType === "Cases" && (
                            <input className={_inputCls + " mt-1"} type="number" min="0" placeholder="+Pcs rem."
                              value={item.remainder} onChange={e => setItem(i, "remainder", e.target.value)} />
                          )}
                          {pcsPerCase && (
                            <p className="text-[9px] text-slate-400 mt-0.5">{pieces} pcs</p>
                          )}
                        </div>
 
                        {/* Unit Price */}
                        <div className="col-span-3">
                          <input className={_inputCls} type="number" step="0.01" placeholder="Unit Price"
                            value={item.unitPrice} onChange={e => setItem(i, "unitPrice", e.target.value)} required />
                          {selProd && (
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              Pcs: ₱{Number(selProd.product_unitPrice || 0).toLocaleString()}
                              {selProd.product_pricePerCase && ` · Case: ₱${Number(selProd.product_pricePerCase).toLocaleString()}`}
                            </p>
                          )}
                        </div>
 
                        {/* Subtotal */}
                        <div className="col-span-1 text-xs text-slate-500 text-right font-semibold pt-2">
                          ₱{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()}
                        </div>
 
                        {/* Remove */}
                        <div className="col-span-1 flex justify-end pt-1">
                          {form.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)}
                              className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
 
            {/* Total */}
            <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-2">
              <span className="text-sm font-semibold text-slate-700">Total Amount</span>
              <span className="text-lg font-bold text-blue-700">
                ₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
 
            {/* Payment */}
            <div className="border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Initial Payment{" "}
                <span className="text-slate-400 font-normal normal-case">(optional — leave blank to mark Unpaid)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SaleField label="Payment Type">
                  <select className={_selectCls} value={form.payment.payment_type}
                    onChange={e => setForm(f => ({ ...f, payment: { ...f.payment, payment_type: e.target.value } }))}>
                    <option>Cash</option>
                    <option>Check</option>
                    <option>Bank Transfer</option>
                    <option>GCash</option>
                  </select>
                </SaleField>
                <SaleField label="Amount Paid">
                  <input className={_inputCls} type="number" step="0.01"
                    placeholder={`Max ₱${total.toLocaleString()}`}
                    value={form.payment.payment_amount}
                    onChange={e => setForm(f => ({ ...f, payment: { ...f.payment, payment_amount: e.target.value } }))} />
                </SaleField>
              </div>
              {form.payment.payment_amount && (
                <div className="text-xs text-slate-500">
                  Balance after payment:{" "}
                  <span className="font-semibold text-red-600">
                    ₱{Math.max(0, total - parseFloat(form.payment.payment_amount || 0))
                      .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
 
            {/* Notes */}
            <SaleField label="Notes">
              <textarea className={_inputCls + " resize-none"} rows={2}
                placeholder="Optional delivery or order notes..."
                value={form.sales_notes} onChange={e => setField("sales_notes", e.target.value)} />
            </SaleField>
 
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}
 
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm">
                {loading ? "Saving..." : "✓ Create Sale"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// MODAL 2 — CHECK INVENTORY
function CheckInventoryModal({ open, onClose }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setInventory(Array.isArray(data) ? data : []))
      .catch(() => setInventory([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = inventory.filter((p) =>
    p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const LOW_STOCK_THRESHOLD = 10;

  const stockBadge = (qty) => {
    if (qty <= 0) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of Stock</span>;
    if (qty <= LOW_STOCK_THRESHOLD) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Low Stock</span>;
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">In Stock</span>;
  };

  return (
    <Modal open={open} onClose={onClose} title="📦 Inventory Snapshot">
      <div className="flex flex-col gap-4">
        <input className={inputCls} placeholder="Search products..." value={search}
          onChange={(e) => setSearch(e.target.value)} />

        {loading ? (
          <div className="text-center text-slate-400 py-8 text-sm">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">No products found.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-2 mb-1">
              {[
                { label: "Total Products", val: inventory.length, color: "text-blue-600" },
                { label: "Low Stock", val: inventory.filter((p) => p.product_stockQty <= LOW_STOCK_THRESHOLD && p.product_stockQty > 0).length, color: "text-amber-600" },
                { label: "Out of Stock", val: inventory.filter((p) => p.product_stockQty <= 0).length, color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Product rows */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Product</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Stock (cases)</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.product_ID} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{p.product_name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{p.product_stockQty?.toLocaleString() ?? "—"}</td>
                      <td className="px-4 py-2.5">{stockBadge(p.product_stockQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button onClick={onClose}
          className="w-full border border-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
          Close
        </button>
      </div>
    </Modal>
  );
}

// MODAL 3 — ADD CUSTOMER
function AddCustomerModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    client_name: "", client_contactNumber: "", client_email: "",
    client_address: "", TIN_Code: "", contactPerson: "",
  });

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(`Client "${form.client_name}" added successfully!`);
      setForm({ client_name: "", client_contactNumber: "", client_email: "", client_address: "", TIN_Code: "", contactPerson: "" });
      onClose();
    } catch (err) {
      onSuccess(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="👥 Add Customer">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <Field label="Business / Client Name" required>
          <input className={inputCls} placeholder="e.g. NCCC Supermart" value={form.client_name}
            onChange={(e) => setField("client_name", e.target.value)} required />
        </Field>

        <Field label="Contact Person" required>
          <input className={inputCls} placeholder="Full name of contact person" value={form.contactPerson}
            onChange={(e) => setField("contactPerson", e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Number" required>
            <input className={inputCls} placeholder="09XXXXXXXXX" maxLength={11} value={form.client_contactNumber}
              onChange={(e) => setField("client_contactNumber", e.target.value)} required />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" placeholder="optional@email.com" value={form.client_email}
              onChange={(e) => setField("client_email", e.target.value)} />
          </Field>
        </div>

        <Field label="Address" required>
          <input className={inputCls} placeholder="Street, Barangay, City" value={form.client_address}
            onChange={(e) => setField("client_address", e.target.value)} required />
        </Field>

        <Field label="TIN Code">
          <input className={inputCls} placeholder="Optional — for B2B clients" value={form.TIN_Code}
            onChange={(e) => setField("TIN_Code", e.target.value)} />
        </Field>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
            {loading ? "Saving..." : "Add Customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// MAIN EXPORT — QuickActions (drop-in replacement for the buttons section)
export default function QuickActions() {
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          fetch("/api/client"),
          fetch("/api/products"),
        ]);
        const clientsData = clientsRes.ok ? await clientsRes.json() : [];
        const productsData = productsRes.ok ? await productsRes.json() : [];
        setClients(clientsData);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load quickaction references", error);
      }
    };
    loadData();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type });

  return (
    <>
      {/* Quick Action Buttons */}
      <div className="flex flex-col gap-3">
        <button onClick={() => setModal("sale")}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors">
          + New Sale
        </button>
        <button onClick={() => setModal("inventory")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors">
          📦 Check Inventory
        </button>
        <button onClick={() => setModal("customer")}
          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors">
          👥 Add Customer
        </button>
      </div>

      {/* Modals */}
      <NewSaleModal
        open={modal === "sale"}
        onClose={() => setModal(null)}
        onSuccess={showToast}
        clients={clients}
        products={products}
      />
      <CheckInventoryModal
        open={modal === "inventory"}
        onClose={() => setModal(null)}
      />
      <AddCustomerModal
        open={modal === "customer"}
        onClose={() => setModal(null)}
        onSuccess={showToast}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";

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

// ══════════════════════════════════════════════════════════════════════════════
// MODAL 1 — NEW SALE
// ══════════════════════════════════════════════════════════════════════════════
function NewSaleModal({ open, onClose, onSuccess }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const emptyItem = { productLine_ID: "", quantity: 1, unitPrice: "" };
  const [form, setForm] = useState({
    client_ID: "",
    employee_ID: "",
    sales_notes: "",
    sales_SINumber: "",
    sales_DRNumber: "",
    sales_SWSNumber: "",
    items: [{ ...emptyItem }],
    payment: { payment_type: "Cash", payment_amount: "", employee_ID: "" },
  });

  useEffect(() => {
    if (!open) return;
    fetch("/api/client").then((r) => r.json()).then(setClients).catch(() => {});
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => {});
  }, [open]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setItem = (i, key, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [key]: val };

    // Auto-fill unit price from product when product is selected
    if (key === "productLine_ID") {
      const product = products.find((p) => String(p.product_ID) === String(val));
      if (product) items[i].unitPrice = product.product_unitPrice ?? "";
    }
    setForm((f) => ({ ...f, items }));
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const total = form.items.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
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
      onSuccess(`Sale #${data.sales_ID} created successfully!`);
      onClose();
    } catch (err) {
      onSuccess(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () =>
    setForm({
      client_ID: "", employee_ID: "", sales_notes: "",
      sales_SINumber: "", sales_DRNumber: "", sales_SWSNumber: "",
      items: [{ ...emptyItem }],
      payment: { payment_type: "Cash", payment_amount: "", employee_ID: "" },
    });

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="+ New Sale">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Client & Employee */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client" required>
            <select className={selectCls} value={form.client_ID} onChange={(e) => setField("client_ID", e.target.value)} required>
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.client_ID} value={c.client_ID}>{c.client_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Employee ID" required>
            <input className={inputCls} type="number" placeholder="e.g. 3" value={form.employee_ID}
              onChange={(e) => setField("employee_ID", e.target.value)} required />
          </Field>
        </div>

        {/* Receipt Numbers */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="SI Number">
            <input className={inputCls} type="number" placeholder="SI #" value={form.sales_SINumber}
              onChange={(e) => setField("sales_SINumber", e.target.value)} />
          </Field>
          <Field label="DR Number">
            <input className={inputCls} type="number" placeholder="DR #" value={form.sales_DRNumber}
              onChange={(e) => setField("sales_DRNumber", e.target.value)} />
          </Field>
          <Field label="SWS Number">
            <input className={inputCls} type="number" placeholder="SWS #" value={form.sales_SWSNumber}
              onChange={(e) => setField("sales_SWSNumber", e.target.value)} />
          </Field>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items <span className="text-red-400">*</span></span>
            <button type="button" onClick={addItem}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add Item</button>
          </div>
          <div className="flex flex-col gap-2">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2">
                <div className="col-span-5">
                  <select className={selectCls} value={item.productLine_ID}
                    onChange={(e) => setItem(i, "productLine_ID", e.target.value)} required>
                    <option value="">Product...</option>
                    {products.map((p) => (
                      <option key={p.product_ID} value={p.product_ID}>
                        {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input className={inputCls} type="number" min="1" placeholder="Qty"
                    value={item.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} required />
                </div>
                <div className="col-span-3">
                  <input className={inputCls} type="number" step="0.01" placeholder="Unit Price"
                    value={item.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} required />
                </div>
                <div className="col-span-1 text-xs text-slate-500 text-right">
                  ₱{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()}
                </div>
                <div className="col-span-1 flex justify-end">
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-2">
          <span className="text-sm font-semibold text-slate-700">Total Amount</span>
          <span className="text-lg font-bold text-blue-700">₱{total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Payment (optional) */}
        <div className="border border-slate-100 rounded-xl p-3 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Initial Payment <span className="text-slate-400 font-normal normal-case">(optional — leave blank to mark Unpaid)</span></p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Payment Type">
              <select className={selectCls} value={form.payment.payment_type}
                onChange={(e) => setForm((f) => ({ ...f, payment: { ...f.payment, payment_type: e.target.value } }))}>
                <option>Cash</option>
                <option>Check</option>
                <option>Bank Transfer</option>
              </select>
            </Field>
            <Field label="Amount Paid">
              <input className={inputCls} type="number" step="0.01" placeholder={`Max ₱${total.toLocaleString()}`}
                value={form.payment.payment_amount}
                onChange={(e) => setForm((f) => ({ ...f, payment: { ...f.payment, payment_amount: e.target.value } }))} />
            </Field>
          </div>
          {form.payment.payment_amount && (
            <div className="text-xs text-slate-500">
              Balance after payment:{" "}
              <span className="font-semibold text-red-600">
                ₱{Math.max(0, total - parseFloat(form.payment.payment_amount || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <Field label="Notes">
          <textarea className={inputCls + " resize-none"} rows={2} placeholder="Optional delivery or order notes..."
            value={form.sales_notes} onChange={(e) => setField("sales_notes", e.target.value)} />
        </Field>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => { resetForm(); onClose(); }}
            className="flex-1 border border-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
            {loading ? "Saving..." : "Create Sale"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL 2 — CHECK INVENTORY
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
// MODAL 3 — ADD CUSTOMER
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
// MODAL 4 — GENERATE REPORT
// ══════════════════════════════════════════════════════════════════════════════
function GenerateReportModal({ open, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const reportOptions = [
    { value: "daily", label: "📅 Daily Sales", desc: "Sales, collections & balances for a specific day" },
    { value: "monthly", label: "📆 Monthly Summary", desc: "Month-over-month totals" },
    { value: "revenue", label: "💰 Revenue Report", desc: "Overall revenue breakdown" },
    { value: "top-products", label: "🏆 Top Products", desc: "Best selling products by volume" },
    { value: "receivables", label: "💵 Receivables", desc: "All unpaid & partial sales" },
  ];

  const fetchReport = async () => {
    setLoading(true);
    setResult(null);
    setError("");
    try {
      let url = "";
      if (reportType === "daily") url = `/api/reports/daily?date=${date}`;
      else if (reportType === "monthly") url = `/api/reports/monthly?month=${month}`;
      else if (reportType === "revenue") url = `/api/reports/revenue`;
      else if (reportType === "top-products") url = `/api/reports/top-products`;
      else if (reportType === "receivables") url = `/api/receivables`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) =>
    Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  const renderResult = () => {
    if (!result) return null;

    // Daily report
    if (reportType === "daily" && result.sale_date) {
      return (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { label: "Total Sales", val: `₱${fmt(result.total_sales || 0)}`, color: "text-green-600" },
            { label: "Transactions", val: result.total_transactions || 0, color: "text-blue-600" },
            { label: "Collected", val: `₱${fmt(result.total_collected || 0)}`, color: "text-blue-600" },
            { label: "Outstanding", val: `₱${fmt(result.total_outstanding || 0)}`, color: "text-red-600" },
            { label: "Unpaid Sales", val: result.unpaid_count || 0, color: "text-red-600" },
            { label: "Partial Sales", val: result.partial_count || 0, color: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      );
    }

    // Receivables list
    if (reportType === "receivables" && Array.isArray(result)) {
      return (
        <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs text-slate-500 font-semibold">Client</th>
                <th className="text-right px-3 py-2 text-xs text-slate-500 font-semibold">Balance</th>
                <th className="text-left px-3 py-2 text-xs text-slate-500 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.map((row, i) => (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{row.client_name}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600">₱{fmt(row.sales_Balance || row.client_outstandingbalance || 0)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {row.sales_paymentStatus || "Unpaid"}
                    </span>
                  </td>
                </tr>
              ))}
              {result.length === 0 && (
                <tr><td colSpan={3} className="text-center py-4 text-slate-400 text-xs">No outstanding balances 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // Top products
    if (reportType === "top-products" && Array.isArray(result)) {
      return (
        <div className="mt-4 flex flex-col gap-2">
          {result.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                <span className="text-sm font-medium text-slate-700">{p.product_name}</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">{p.total_qty_sold?.toLocaleString()} cases</span>
            </div>
          ))}
        </div>
      );
    }

    // Generic JSON fallback
    return (
      <pre className="mt-4 text-xs bg-slate-50 rounded-xl p-4 overflow-auto max-h-60 text-slate-700">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — QuickActions (drop-in replacement for the buttons section)
// ══════════════════════════════════════════════════════════════════════════════
export default function QuickActions() {
  const [modal, setModal] = useState(null); // "sale" | "inventory" | "customer" | "report"
  const [toast, setToast] = useState(null); // { message, type }

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
      <GenerateReportModal
        open={modal === "report"}
        onClose={() => setModal(null)}
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
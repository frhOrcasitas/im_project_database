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
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Unit</th>
                    <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Stock</th>
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const pcsPerCase = parsePcsPerCase(p.product_unit);
                    const cases = pcsPerCase ? Math.floor(p.product_stockQty / pcsPerCase) : null;
                    const remainder = pcsPerCase ? p.product_stockQty % pcsPerCase : null;
                    return (
                      <tr key={p.product_ID} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{p.product_name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-400">{p.product_unit || "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="font-semibold text-slate-800">{p.product_stockQty} pcs</span>
                          {pcsPerCase && (
                            <span className="text-xs text-slate-400 ml-1">
                              ({cases} case{cases !== 1 ? "s" : ""}{remainder > 0 ? ` + ${remainder} pcs` : ""})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">{stockBadge(p.product_stockQty)}</td>
                      </tr>
                    );
                  })}
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
        <button onClick={() => setModal("inventory")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-center text-sm transition-colors">
          📦 Check Inventory
        </button>
      </div>

      {/* Modals */}
      <CheckInventoryModal
        open={modal === "inventory"}
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

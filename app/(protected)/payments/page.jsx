"use client";
import { useState, useEffect } from "react";

// ─── Helpers 
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Paid:        "bg-green-100 text-green-700",
    Partial:     "bg-amber-100 text-amber-700",
    Unpaid:      "bg-red-100 text-red-700",
    Delivered:   "bg-green-100 text-green-700",
    "In Transit":"bg-amber-100 text-amber-700",
    Processing:  "bg-blue-100 text-blue-700",
    Pending:     "bg-slate-100 text-slate-600",
    Completed:   "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

// ─── Balance Ring
function BalanceRing({ paid, total, size = 112 }) {
  const pct   = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const r     = 38;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct >= 100 ? "#16a34a" : pct > 0 ? "#f59e0b" : "#e2e8f0";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-xs text-slate-400 font-medium leading-none">Paid</div>
        <div className="text-base font-bold text-white leading-tight">{Math.round(pct)}%</div>
      </div>
    </div>
  );
}

// ─── Toast 
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
      ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
      {message}
    </div>
  );
}

// LEFT PANEL — Unpaid Sales List
function SalesList({ selectedId, onSelect }) {
  const [sales, setSales]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all"); // all | unpaid | partial

  useEffect(() => {
    fetch("/api/sales")
      .then((r) => r.json())
      .then((data) => {
        const unpaid = Array.isArray(data)
          ? data.filter((s) => 
            s.sales_paymentStatus !== "Paid" && 
            s.sales_status !== "Cancelled")
          : [];
        setSales(unpaid);
      })
      .catch(() => setSales([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = sales.filter((s) => {
    const matchSearch =
      s.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      String(s.sales_ID).includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "unpaid"  && s.sales_paymentStatus === "Unpaid") ||
      (filter === "partial" && s.sales_paymentStatus === "Partial");
    return matchSearch && matchFilter;
  });

  const totalOutstanding = sales.reduce((sum, s) => sum + parseFloat(s.sales_Balance || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {sales.length} unpaid sale{sales.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-red-600 font-semibold">₱{fmt(totalOutstanding)}</span> total outstanding
        </p>
      </div>

      {/* Search */}
      <input
        className={inputCls + " mb-3"}
        placeholder="Search client or sale #..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1">
        {[["all", "All"], ["unpaid", "Unpaid"], ["partial", "Partial"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
              filter === val
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {loading ? (
          <div className="text-center text-slate-400 text-sm py-12">Loading sales...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12">No unpaid sales found.</div>
        ) : (
          filtered.map((s) => {
            const balance   = parseFloat(s.sales_Balance || 0);
            const total     = parseFloat(s.sales_totalAmount || 0);
            const paid      = total - balance;
            const pct       = total > 0 ? Math.round((paid / total) * 100) : 0;
            const isSelected = selectedId === s.sales_ID;

            return (
              <button
                key={s.sales_ID}
                onClick={() => onSelect(s.sales_ID)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-blue-400 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{s.client_name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Sale #{s.sales_ID} ·{" "}
                      {new Date(s.sales_createdAt).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </div>
                  </div>
                  <StatusBadge status={s.sales_paymentStatus} />
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        pct > 0 ? "bg-amber-400" : "bg-slate-300"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{pct}%</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">Balance</span>
                  <span className="text-sm font-bold text-red-600">₱{fmt(balance)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// RIGHT PANEL — Sale Detail + Payment Form
function PaymentPanel({ salesId, onPaymentSuccess }) {
  const [sale, setSale]         = useState(null);
  const [payments, setPayments] = useState([]);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    payment_type:    "Cash",
    payment_amount:  "",
    payment_ORNumber:"",
    payment_paidDate: new Date().toISOString().split("T")[0],
    employee_ID:     "",
  });

  useEffect(() => {
    if (!salesId) return;
    setLoading(true);
    setError("");
    setSale(null);
    setPayments([]);
    setItems([]);
    setForm((f) => ({ ...f, payment_amount: "" }));

    fetch(`/api/sales/${salesId}`)
      .then((r) => r.json())
      .then((data) => {
        setSale(data.sale || data);
        setPayments(data.payments || []);
        setItems(data.items || []);
      })
      .catch(() => setError("Failed to load sale details."))
      .finally(() => setLoading(false));
  }, [salesId]);

  useEffect(() => {
    // Fetch employees list for the dropdown
    fetch("/api/employee") 
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => console.error("Failed to load employees"));

    if (!salesId) return;
  }, [salesId]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const balance       = sale ? parseFloat(sale.sales_Balance || 0) : 0;
  const total         = sale ? parseFloat(sale.sales_totalAmount || 0) : 0;
  const totalPaid     = total - balance;
  const amountEntered = parseFloat(form.payment_amount) || 0;
  const balanceAfter  = Math.max(0, balance - amountEntered);
  const willFullyPay  = amountEntered >= balance && balance > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amountEntered <= 0)        return setError("Please enter a valid amount.");
    if (amountEntered > balance)   return setError(`Amount exceeds remaining balance of ₱${fmt(balance)}.`);

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sales/${salesId}/payment`, {
        method: "POST",
        body: JSON.stringify({
          client_id: sale.client_ID,
          employee_id: form.employee_ID,
          amount: amountEntered,
          or_number: form.payment_ORNumber,
          type: form.payment_type,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onPaymentSuccess(`Payment of ₱${fmt(amountEntered)} recorded for Sale #${salesId}.`);

      // Refresh panel
      fetch(`/api/sales/${salesId}`)
        .then((r) => r.json())
        .then((d) => {
          setSale(d.sale || d);
          setPayments(d.payments || []);
        });
      setForm((f) => ({ ...f, payment_amount: "", payment_ORNumber: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty state 
  if (!salesId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">💵</div>
        <p className="font-semibold text-slate-600">Select a sale to record payment</p>
        <p className="text-sm text-slate-400">Choose from the list on the left</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading sale details...
      </div>
    );
  }

  if (error && !sale) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm m-4">
        {error}
      </div>
    );
  }

  if (!sale) return null;

  return (
    <div className="flex flex-col h-full overflow-y-auto gap-5">

      {/* ── Hero Card  */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 flex items-center gap-5 shrink-0">
        <BalanceRing paid={totalPaid} total={total} size={100} />
        <div className="flex-1 min-w-0">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1 truncate">
            {sale.client_name}
          </div>
          <div className="text-white text-3xl font-bold">₱{fmt(balance)}</div>
          <div className="text-slate-400 text-xs mt-0.5">Remaining balance</div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={sale.sales_paymentStatus} />
            <StatusBadge status={sale.sales_status} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-400 text-xs mb-0.5">Total</div>
          <div className="text-white font-semibold text-sm">₱{fmt(total)}</div>
          <div className="text-slate-400 text-xs mt-2 mb-0.5">Paid</div>
          <div className="text-green-400 font-semibold text-sm">₱{fmt(totalPaid)}</div>
          <div className="text-slate-400 text-xs mt-2 mb-0.5">Sale #</div>
          <div className="text-slate-300 font-semibold text-sm">{sale.sales_ID}</div>
        </div>
      </div>

      {/* ── Items Ordered  */}
      {items.length > 0 && (
        <div className="shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Items Ordered</p>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Product</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Qty</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Unit Price</th>
                  <th className="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{item.product_name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{item.salesDetail_qty}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">₱{fmt(item.salesDetail_unitPriceSold)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">₱{fmt(item.salesDetail_subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payment History  */}
      {payments.length > 0 && (
        <div className="shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Payment History
            <span className="ml-2 normal-case font-normal text-slate-400">
              ({payments.length} payment{payments.length !== 1 ? "s" : ""})
            </span>
          </p>
          <div className="flex flex-col gap-2">
            {payments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700">{p.payment_type}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(p.payment_paidDate).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                      {p.payment_ORNumber && (
                        <span className="ml-2 text-slate-500">OR #{p.payment_ORNumber}</span>
                      )}
                      <div className="mt-1 text-slate-500 italic">
                        Processed by: {p.employee_name || `ID: ${p.employee_ID}`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-green-700 font-bold text-sm">₱{fmt(p.payment_amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment Form / Fully Paid */}
      {balance > 0 ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-slate-100 pt-5 shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Record New Payment</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount" required hint={`Max ₱${fmt(balance)}`}>
              <input
                className={inputCls}
                type="number" step="0.01" min="0.01" max={balance}
                placeholder="0.00"
                value={form.payment_amount}
                onChange={(e) => setField("payment_amount", e.target.value)}
                required
              />
            </Field>
            <Field label="Payment Type" required>
              <select
                className={inputCls}
                value={form.payment_type}
                onChange={(e) => setField("payment_type", e.target.value)}
              >
                <option>Cash</option>
                <option>Check</option>
                <option>Bank Transfer</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="OR Number">
              <input
                className={inputCls}
                type="text" placeholder="Official receipt #"
                value={form.payment_ORNumber}
                onChange={(e) => setField("payment_ORNumber", e.target.value)}
              />
            </Field>
            <Field label="Payment Date" required>
              <input
                className={inputCls}
                type="date"
                value={form.payment_paidDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setField("payment_paidDate", e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Received By" required>
          <select
            className={inputCls}
            value={form.employee_ID}
            onChange={(e) => setField("employee_ID", e.target.value)}
            required
          >
            <option value="">Select Employee...</option>
            {employees.map((emp) => (
              <option key={emp.employee_ID} value={emp.employee_ID}>
                {emp.employee_name}
              </option>
            ))}
          </select>
        </Field>

          {/* Live balance preview */}
          {amountEntered > 0 && (
            <div className={`rounded-xl px-4 py-3 flex items-center justify-between text-sm transition-all ${
              willFullyPay
                ? "bg-green-50 border border-green-200"
                : "bg-amber-50 border border-amber-200"
            }`}>
              <span className={`font-medium ${willFullyPay ? "text-green-700" : "text-amber-700"}`}>
                {willFullyPay
                  ? "✅ This will fully settle the balance"
                  : "⚠️ Remaining balance after payment"}
              </span>
              {!willFullyPay && (
                <span className="font-bold text-amber-700">₱{fmt(balanceAfter)}</span>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setForm((f) => ({ ...f, payment_amount: "", payment_ORNumber: "" })); setError(""); }}
              className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting
                ? "Recording..."
                : `Record ₱${amountEntered > 0 ? fmt(amountEntered) : "0.00"} Payment`}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 border-t border-slate-100 shrink-0">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">✅</div>
          <p className="font-semibold text-slate-700">Fully Paid</p>
          <p className="text-sm text-slate-400">This sale has been completely settled.</p>
        </div>
      )}
    </div>
  );
}

// PAGE EXPORT
export default function PaymentsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast]           = useState(null);

  const handlePaymentSuccess = (msg) => {
    setToast({ message: msg, type: "success" });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">

      {/* Left — Sales List */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-2xl shadow-sm p-5 overflow-hidden">
        <SalesList selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Right — Payment Panel */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 overflow-hidden">
        <PaymentPanel salesId={selectedId} onPaymentSuccess={handlePaymentSuccess} />
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}

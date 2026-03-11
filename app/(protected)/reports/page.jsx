"use client";
import { useState, useEffect } from "react";

const today = new Date().toISOString().split("T")[0];
const thisMonth = today.slice(0, 7);
const thisYear = new Date().getFullYear().toString();

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const REPORT_TYPES = [
  { key: "daily",        icon: "📅", title: "Daily Sales",     desc: "Sales summary for a specific day" },
  { key: "monthly",      icon: "📆", title: "Monthly Sales",   desc: "Month-over-month sales breakdown" },
  { key: "revenue",      icon: "💰", title: "Yearly Revenue",  desc: "Annual revenue overview" },
  { key: "top-products", icon: "🏆", title: "Top Products",    desc: "Best sellers by volume" },
  { key: "inventory",    icon: "📦", title: "Inventory",       desc: "Current stock levels and valuation" },
  { key: "aging",        icon: "⏳", title: "Aging Report",    desc: "Accounts receivable aging analysis" },
  { key: "customers",    icon: "👥", title: "Customers",       desc: "Customer purchases and balances" },
];

const inputCls = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const selectCls = inputCls;

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
      <div className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">{label}</div>
      <div className={"text-2xl font-bold " + (color || "text-slate-800")}>{value}</div>
    </div>
  );
}

function SectionHeader({ title, count, onExport }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        {title}
        {count !== undefined && (
          <span className="ml-2 text-xs font-normal text-slate-400 normal-case">({count} rows)</span>
        )}
      </h3>
      {onExport && (
        <button onClick={onExport} className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">
          Export CSV
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="py-10 text-center text-slate-400 text-sm italic">{message}</div>;
}

function exportCSV(data, filename) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((r) => Object.values(r).map((v) => '"' + (v ?? "") + '"').join(",")).join("\n");
  const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + "_" + today + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function TableWrapper({ headers, children, footer }) {
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
        {footer && <tfoot className="bg-slate-50 border-t border-slate-200">{footer}</tfoot>}
      </table>
    </div>
  );
}

function paymentBadge(status) {
  if (status === "Paid")    return "bg-green-100 text-green-700";
  if (status === "Partial") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// Shared transactions table used by Daily, Monthly, Yearly
function TransactionsTable({ transactions, onExport }) {
  const [search, setSearch] = useState("");
  const filtered = transactions.filter(t =>
    t.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    String(t.sales_ID).includes(search)
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Transaction List
          <span className="ml-2 text-xs font-normal text-slate-400 normal-case">({filtered.length} rows)</span>
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search client or sale #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
          />
          {onExport && (
            <button onClick={onExport} className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Export CSV
            </button>
          )}
        </div>
      </div>
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {["Sale #", "Client", "Date", "Total Amount", "Balance", "Payment"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm italic">No transactions found.</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-blue-600">ORD-{t.sales_ID}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{t.client_name}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(t.sales_createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">₱{fmt(t.sales_totalAmount)}</td>
                  <td className="px-4 py-3 text-red-600">₱{fmt(t.sales_Balance)}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + paymentBadge(t.sales_paymentStatus)}>
                      {t.sales_paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DailyResult({ data }) {
  const summary = Array.isArray(data.summary) ? data.summary : [];
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];

  if (!summary.length && !transactions.length)
    return <EmptyState message="No sales found for this date range." />;

  const totals = summary.reduce((acc, r) => ({
    total_transactions: acc.total_transactions + Number(r.total_transactions || 0),
    total_sales:        acc.total_sales        + Number(r.total_sales || 0),
    total_collected:    acc.total_collected    + Number(r.total_collected || 0),
    total_outstanding:  acc.total_outstanding  + Number(r.total_outstanding || 0),
    unpaid_count:       acc.unpaid_count       + Number(r.unpaid_count || 0),
    partial_count:      acc.partial_count      + Number(r.partial_count || 0),
  }), { total_transactions: 0, total_sales: 0, total_collected: 0, total_outstanding: 0, unpaid_count: 0, partial_count: 0 });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Sales"      value={"₱" + fmt(totals.total_sales)}      color="text-green-600" />
        <StatCard label="Transactions"     value={totals.total_transactions}           color="text-blue-600" />
        <StatCard label="Collected"        value={"₱" + fmt(totals.total_collected)}   color="text-blue-600" />
        <StatCard label="Outstanding"      value={"₱" + fmt(totals.total_outstanding)} color="text-red-600" />
        <StatCard label="Unpaid Sales"     value={totals.unpaid_count}                color="text-red-500" />
        <StatCard label="Partial Payments" value={totals.partial_count}               color="text-amber-600" />
      </div>

      {summary.length > 1 && (
        <div>
          <SectionHeader title="Per Day Breakdown" count={summary.length} onExport={() => exportCSV(summary, "daily_summary")} />
          <TableWrapper headers={["Date", "Transactions", "Total Sales", "Collected", "Outstanding"]}>
            {summary.map((r, i) => (
              <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">
                  {new Date(r.sale_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.total_transactions}</td>
                <td className="px-4 py-3 font-semibold text-green-700">₱{fmt(r.total_sales)}</td>
                <td className="px-4 py-3 text-blue-600">₱{fmt(r.total_collected)}</td>
                <td className="px-4 py-3 text-red-600">₱{fmt(r.total_outstanding)}</td>
              </tr>
            ))}
          </TableWrapper>
        </div>
      )}

      <TransactionsTable transactions={transactions} onExport={() => exportCSV(transactions, "daily_transactions")} />
    </div>
  );
}

function MonthlyResult({ data }) {
  const summary = Array.isArray(data.summary) ? data.summary : [];
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];

  if (!summary.length && !transactions.length)
    return <EmptyState message="No monthly data found." />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeader title="Monthly Breakdown" count={summary.length} onExport={() => exportCSV(summary, "monthly_summary")} />
        <TableWrapper headers={["Month", "Transactions", "Total Sales", "Collected", "Outstanding"]}>
          {summary.map((r, i) => (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">
                {new Date(r.year, r.month - 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
              </td>
              <td className="px-4 py-3 text-slate-600">{r.total_transactions}</td>
              <td className="px-4 py-3 font-semibold text-green-700">₱{fmt(r.total_sales)}</td>
              <td className="px-4 py-3 text-blue-600">₱{fmt(r.total_collected)}</td>
              <td className="px-4 py-3 text-red-600">₱{fmt(r.total_outstanding)}</td>
            </tr>
          ))}
        </TableWrapper>
      </div>
      <TransactionsTable transactions={transactions} onExport={() => exportCSV(transactions, "monthly_transactions")} />
    </div>
  );
}

function RevenueResult({ data }) {
  const summary = Array.isArray(data.summary) ? data.summary : [];
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];

  if (!summary.length && !transactions.length)
    return <EmptyState message="No revenue data found." />;

  const totalRevenue   = summary.reduce((s, r) => s + Number(r.total_sales || 0), 0);
  const totalCollected = summary.reduce((s, r) => s + Number(r.total_collected || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue"   value={"₱" + fmt(totalRevenue)}   color="text-green-600" />
        <StatCard label="Total Collected" value={"₱" + fmt(totalCollected)} color="text-blue-600" />
      </div>
      <div>
        <SectionHeader title="Yearly Breakdown" count={summary.length} onExport={() => exportCSV(summary, "yearly_summary")} />
        <TableWrapper headers={["Year", "Transactions", "Total Revenue", "Collected", "Outstanding"]}>
          {summary.map((r, i) => (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 font-bold text-slate-800">{r.year}</td>
              <td className="px-4 py-3 text-slate-600">{r.total_transactions}</td>
              <td className="px-4 py-3 font-semibold text-green-700">₱{fmt(r.total_sales)}</td>
              <td className="px-4 py-3 text-blue-600">₱{fmt(r.total_collected)}</td>
              <td className="px-4 py-3 text-red-600">₱{fmt(r.total_outstanding)}</td>
            </tr>
          ))}
        </TableWrapper>
      </div>
      <TransactionsTable transactions={transactions} onExport={() => exportCSV(transactions, "yearly_transactions")} />
    </div>
  );
}

function TopProductsResult({ data }) {
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.summary) ? data.summary : []);
  if (!rows.length) return <EmptyState message="No product data found." />;
  const max = Math.max(...rows.map((p) => Number(p.total_qty_sold || 0)));
  return (
    <div>
      <SectionHeader title="Top Products by Volume" count={rows.length} onExport={() => exportCSV(rows, "top_products")} />
      <div className="flex flex-col gap-2">
        {rows.map((p, i) => {
          const qty = Number(p.total_qty_sold || 0);
          const pct = max > 0 ? (qty / max) * 100 : 0;
          return (
            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-sm font-bold text-slate-400 w-6 shrink-0">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700 truncate">{p.product_name}</span>
                  <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">{qty.toLocaleString()} cases</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: pct + "%" }} />
                </div>
              </div>
              <span className="text-xs text-slate-500 shrink-0">₱{fmt(p.total_revenue)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryResult({ data }) {
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return <EmptyState message="No inventory data found." />;
  const LOW = 10;
  const totalValue = rows.reduce((s, p) => s + Number(p.inventory_value || 0), 0);
  const lowCount   = rows.filter((p) => Number(p.product_stockQty) <= LOW && Number(p.product_stockQty) > 0).length;
  const outCount   = rows.filter((p) => Number(p.product_stockQty) <= 0).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Products" value={rows.length} color="text-blue-600" />
        <StatCard label="Low Stock"      value={lowCount}    color="text-amber-600" />
        <StatCard label="Out of Stock"   value={outCount}    color="text-red-600" />
      </div>
      <SectionHeader title="Stock Levels" count={rows.length} onExport={() => exportCSV(rows, "inventory_report")} />
      <TableWrapper
        headers={["Product", "Stock (cases)", "Unit Price", "Value", "Status"]}
        footer={
          <tr>
            <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Inventory Value</td>
            <td className="px-4 py-3 font-bold text-green-700">₱{fmt(totalValue)}</td>
            <td />
          </tr>
        }
      >
        {rows.map((p, i) => {
          const qty = Number(p.product_stockQty);
          const badge = qty <= 0 ? "bg-red-100 text-red-700" : qty <= LOW ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
          const label = qty <= 0 ? "Out of Stock" : qty <= LOW ? "Low Stock" : "In Stock";
          return (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{p.product_name}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{qty.toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-600">₱{fmt(p.product_unitPrice)}</td>
              <td className="px-4 py-3 text-slate-600">₱{fmt(p.inventory_value)}</td>
              <td className="px-4 py-3">
                <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + badge}>{label}</span>
              </td>
            </tr>
          );
        })}
      </TableWrapper>
    </div>
  );
}

function AgingResult({ data }) {
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return <EmptyState message="No outstanding balances found." />;
  const total = rows.reduce((s, r) => s + Number(r.outstanding_balance || 0), 0);
  function agingBucket(days) {
    if (days <= 30) return ["0-30 days",  "bg-green-100 text-green-700"];
    if (days <= 60) return ["31-60 days", "bg-amber-100 text-amber-700"];
    if (days <= 90) return ["61-90 days", "bg-orange-100 text-orange-700"];
    return                 ["90+ days",   "bg-red-100 text-red-700"];
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Clients with Balance" value={rows.length}       color="text-red-600" />
        <StatCard label="Total Outstanding"     value={"₱" + fmt(total)} color="text-red-600" />
      </div>
      <SectionHeader title="Receivables Aging" count={rows.length} onExport={() => exportCSV(rows, "aging_report")} />
      <TableWrapper
        headers={["Client", "Sale #", "Sale Date", "Days Overdue", "Balance", "Bucket"]}
        footer={
          <tr>
            <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Outstanding</td>
            <td className="px-4 py-3 font-bold text-red-700">₱{fmt(total)}</td>
            <td />
          </tr>
        }
      >
        {rows.map((r, i) => {
          const days = Number(r.days_overdue || 0);
          const [bucket, bucketStyle] = agingBucket(days);
          return (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{r.client_name}</td>
              <td className="px-4 py-3 text-blue-600 font-semibold">#{r.sales_ID}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(r.sales_createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </td>
              <td className="px-4 py-3 text-slate-700">{days} days</td>
              <td className="px-4 py-3 font-bold text-red-600">₱{fmt(r.outstanding_balance)}</td>
              <td className="px-4 py-3">
                <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + bucketStyle}>{bucket}</span>
              </td>
            </tr>
          );
        })}
      </TableWrapper>
    </div>
  );
}

function CustomersResult({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const [clients, setClients]               = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [payments, setPayments]             = useState([]);
  const [loadingPay, setLoadingPay]         = useState(false);
  const [payError, setPayError]             = useState("");

  useEffect(() => {
    fetch("/api/reports/customers/list")
      .then(r => r.json())
      .then(d => setClients(Array.isArray(d) ? d : []));
  }, []);

  const loadPayments = async (clientId) => {
    setSelectedClient(clientId);
    setPayments([]);
    setPayError("");
    if (!clientId) return;
    setLoadingPay(true);
    try {
      const res = await fetch(`/api/reports/customers/payments?client_ID=${clientId}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPayments(Array.isArray(d) ? d : []);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setLoadingPay(false);
    }
  };

  if (!rows.length) return <EmptyState message="No customer data found." />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeader title="Customer Purchase Summary" count={rows.length} onExport={() => exportCSV(rows, "customer_report")} />
        <TableWrapper headers={["Customer", "Total Orders", "Total Purchased", "Total Paid", "Outstanding", "Last Transaction"]}>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{r.client_name}</td>
              <td className="px-4 py-3 text-slate-600">{r.total_orders}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">₱{fmt(r.total_purchased)}</td>
              <td className="px-4 py-3 text-green-600">₱{fmt(r.total_paid)}</td>
              <td className="px-4 py-3">
                <span className={Number(r.outstanding_balance) > 0 ? "font-bold text-red-600" : "text-slate-400"}>
                  ₱{fmt(r.outstanding_balance)}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs">
                {r.last_transaction ? new Date(r.last_transaction).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </td>
            </tr>
          ))}
        </TableWrapper>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Payment History by Customer</h3>
        <select
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedClient}
          onChange={e => loadPayments(e.target.value)}
        >
          <option value="">Select a customer...</option>
          {clients.map(c => (
            <option key={c.client_ID} value={c.client_ID}>{c.client_name}</option>
          ))}
        </select>

        {loadingPay && <div className="text-sm text-slate-400 italic">Loading payments...</div>}
        {payError && <div className="text-sm text-red-600">{payError}</div>}

        {selectedClient && !loadingPay && (
          payments.length === 0
            ? <EmptyState message="No payment records found for this customer." />
            : (
              <div>
                <SectionHeader
                  title={`${clients.find(c => String(c.client_ID) === String(selectedClient))?.client_name} — Payments`}
                  count={payments.length}
                  onExport={() => exportCSV(payments, "customer_payments")}
                />
                <TableWrapper headers={["OR #", "Date", "Type", "Amount Paid", "Sale #", "Sale Total", "Remaining Balance"]}>
                  {payments.map((p, i) => (
                    <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{p.payment_ORNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(p.payment_paidDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.payment_type}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">₱{fmt(p.payment_amount)}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">ORD-{p.sales_ID}</td>
                      <td className="px-4 py-3 text-slate-600">₱{fmt(p.sales_totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={Number(p.remaining_balance) > 0 ? "font-bold text-red-600" : "text-green-600 font-semibold"}>
                          ₱{fmt(p.remaining_balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </TableWrapper>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeType, setActiveType] = useState("daily");
  const [month, setMonth]           = useState(thisMonth);
  const [year, setYear]             = useState(thisYear);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [startDate, setStartDate]   = useState(today);
  const [endDate, setEndDate]       = useState(today);

  const years = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));

  function buildUrl() {
    if (activeType === "daily")        return `/api/reports/daily?start=${startDate}&end=${endDate}`;
    if (activeType === "monthly")      return `/api/reports/monthly?month=${month}`;
    if (activeType === "revenue")      return `/api/reports/yearly?year=${year}`;
    if (activeType === "top-products") return "/api/reports/top-products";
    if (activeType === "inventory")    return "/api/reports/inventory";
    if (activeType === "aging")        return "/api/reports/aging";
    if (activeType === "customers")    return "/api/reports/customers";
    return null;
  }

  async function handleGenerate() {
    const url = buildUrl();
    if (!url) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  function renderResult() {
    if (!result) return null;
    if (activeType === "daily")        return <DailyResult        data={result} />;
    if (activeType === "monthly")      return <MonthlyResult      data={result} />;
    if (activeType === "revenue")      return <RevenueResult      data={result} />;
    if (activeType === "top-products") return <TopProductsResult  data={result} />;
    if (activeType === "inventory")    return <InventoryResult    data={result} />;
    if (activeType === "aging")        return <AgingResult        data={result} />;
    if (activeType === "customers")    return <CustomersResult    data={result} />;
    return null;
  }

  const active = REPORT_TYPES.find((r) => r.key === activeType);
  const noDateFilter = ["top-products", "inventory", "aging", "customers"].includes(activeType);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and export business reports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.key}
            onClick={() => { setActiveType(r.key); setResult(null); setError(""); }}
            className={"group flex flex-col items-center justify-center aspect-square border-2 rounded-2xl p-4 text-center transition-all hover:shadow-lg " + (
              activeType === r.key
                ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                : "border-slate-100 bg-white hover:border-blue-300"
            )}
          >
            <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{r.icon}</div>
            <div className="text-sm font-bold text-slate-800 leading-tight">{r.title}</div>
            <div className="text-[10px] text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Click to view</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-800">{active?.icon} {active?.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{active?.desc}</p>
        </div>
        <div className="flex flex-wrap gap-3 mb-5">
          {activeType === "daily" && (
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">From</label>
                <input type="date" className={inputCls + " w-44"} value={startDate} max={today}
                  onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">To</label>
                <input type="date" className={inputCls + " w-44"} value={endDate} max={today} min={startDate}
                  onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}
          {activeType === "monthly" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Month</label>
              <input type="month" className={inputCls + " w-48"} value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          )}
          {activeType === "revenue" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Year</label>
              <select className={selectCls + " w-36"} value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          )}
          {noDateFilter && (
            <p className="text-sm text-slate-400 self-center italic">Shows all current data — no date filter needed.</p>
          )}
        </div>
        <button onClick={handleGenerate} disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{error}</div>
      )}

      {result && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
            <span className="text-xl">{active?.icon}</span>
            <div>
              <h2 className="text-base font-bold text-slate-800">{active?.title} Results</h2>
              <p className="text-xs text-slate-400">
                Generated {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          {renderResult()}
        </div>
      )}
    </div>
  );
}
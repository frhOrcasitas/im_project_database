"use client";
import { useState } from "react";

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

function DailyResult({ data }) {
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length) return <EmptyState message="No sales found for this date range." />;

  // Aggregate totals across all days in range
  const totals = rows.reduce((acc, r) => ({
    total_transactions: acc.total_transactions + Number(r.total_transactions || 0),
    total_sales:        acc.total_sales        + Number(r.total_sales || 0),
    total_collected:    acc.total_collected    + Number(r.total_collected || 0),
    total_outstanding:  acc.total_outstanding  + Number(r.total_outstanding || 0),
    unpaid_count:       acc.unpaid_count       + Number(r.unpaid_count || 0),
    partial_count:      acc.partial_count      + Number(r.partial_count || 0),
  }), { total_transactions: 0, total_sales: 0, total_collected: 0, total_outstanding: 0, unpaid_count: 0, partial_count: 0 });

  return (
    <div className="flex flex-col gap-4">
      {/* Summary totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Sales"      value={"P" + fmt(totals.total_sales)}      color="text-green-600" />
        <StatCard label="Transactions"     value={totals.total_transactions}           color="text-blue-600" />
        <StatCard label="Collected"        value={"P" + fmt(totals.total_collected)}   color="text-blue-600" />
        <StatCard label="Outstanding"      value={"P" + fmt(totals.total_outstanding)} color="text-red-600" />
        <StatCard label="Unpaid Sales"     value={totals.unpaid_count}                color="text-red-500" />
        <StatCard label="Partial Payments" value={totals.partial_count}               color="text-amber-600" />
      </div>

      {/* Per-day breakdown if range spans multiple days */}
      {rows.length > 1 && (
        <div>
          <SectionHeader title="Per Day Breakdown" count={rows.length} onExport={() => exportCSV(rows, "daily_report")} />
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Date", "Transactions", "Total Sales", "Collected", "Outstanding"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {new Date(r.sale_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.total_transactions}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">P{fmt(r.total_sales)}</td>
                    <td className="px-4 py-3 text-blue-600">P{fmt(r.total_collected)}</td>
                    <td className="px-4 py-3 text-red-600">P{fmt(r.total_outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyResult({ data }) {
  if (!Array.isArray(data) || !data.length) return <EmptyState message="No monthly data found." />;
  return (
    <div>
      <SectionHeader title="Monthly Breakdown" count={data.length} onExport={() => exportCSV(data, "monthly_report")} />
      <TableWrapper headers={["Month", "Transactions", "Total Sales", "Collected", "Outstanding"]}>
        {data.map((r, i) => (
          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-700">
              {new Date(r.year, r.month - 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
            </td>
            <td className="px-4 py-3 text-slate-600">{r.total_transactions}</td>
            <td className="px-4 py-3 font-semibold text-green-700">P{fmt(r.total_sales)}</td>
            <td className="px-4 py-3 text-blue-600">P{fmt(r.total_collected)}</td>
            <td className="px-4 py-3 text-red-600">P{fmt(r.total_outstanding)}</td>
          </tr>
        ))}
      </TableWrapper>
    </div>
  );
}

function RevenueResult({ data }) {
  if (!Array.isArray(data) || !data.length) return <EmptyState message="No revenue data found." />;
  const totalRevenue   = data.reduce((s, r) => s + Number(r.total_sales || 0), 0);
  const totalCollected = data.reduce((s, r) => s + Number(r.total_collected || 0), 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue"   value={"P" + fmt(totalRevenue)}   color="text-green-600" />
        <StatCard label="Total Collected" value={"P" + fmt(totalCollected)} color="text-blue-600" />
      </div>
      <SectionHeader title="Yearly Breakdown" count={data.length} onExport={() => exportCSV(data, "revenue_report")} />
      <TableWrapper headers={["Year", "Transactions", "Total Revenue", "Collected", "Outstanding"]}>
        {data.map((r, i) => (
          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
            <td className="px-4 py-3 font-bold text-slate-800">{r.year}</td>
            <td className="px-4 py-3 text-slate-600">{r.total_transactions}</td>
            <td className="px-4 py-3 font-semibold text-green-700">P{fmt(r.total_sales)}</td>
            <td className="px-4 py-3 text-blue-600">P{fmt(r.total_collected)}</td>
            <td className="px-4 py-3 text-red-600">P{fmt(r.total_outstanding)}</td>
          </tr>
        ))}
      </TableWrapper>
    </div>
  );
}

function TopProductsResult({ data }) {
  if (!Array.isArray(data) || !data.length) return <EmptyState message="No product data found." />;
  const max = Math.max(...data.map((p) => Number(p.total_qty_sold || 0)));
  return (
    <div>
      <SectionHeader title="Top Products by Volume" count={data.length} onExport={() => exportCSV(data, "top_products")} />
      <div className="flex flex-col gap-2">
        {data.map((p, i) => {
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
              <span className="text-xs text-slate-500 shrink-0">P{fmt(p.total_revenue)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryResult({ data }) {
  if (!Array.isArray(data) || !data.length) return <EmptyState message="No inventory data found." />;
  const LOW = 10;
  const totalValue = data.reduce((s, p) => s + Number(p.inventory_value || 0), 0);
  const lowCount   = data.filter((p) => Number(p.product_stockQty) <= LOW && Number(p.product_stockQty) > 0).length;
  const outCount   = data.filter((p) => Number(p.product_stockQty) <= 0).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Products" value={data.length} color="text-blue-600" />
        <StatCard label="Low Stock"      value={lowCount}    color="text-amber-600" />
        <StatCard label="Out of Stock"   value={outCount}    color="text-red-600" />
      </div>
      <SectionHeader title="Stock Levels" count={data.length} onExport={() => exportCSV(data, "inventory_report")} />
      <TableWrapper
        headers={["Product", "Stock (cases)", "Unit Price", "Value", "Status"]}
        footer={
          <tr>
            <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Inventory Value</td>
            <td className="px-4 py-3 font-bold text-green-700">P{fmt(totalValue)}</td>
            <td />
          </tr>
        }
      >
        {data.map((p, i) => {
          const qty = Number(p.product_stockQty);
          const badge = qty <= 0
            ? "bg-red-100 text-red-700"
            : qty <= LOW
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700";
          const label = qty <= 0 ? "Out of Stock" : qty <= LOW ? "Low Stock" : "In Stock";
          return (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-700">{p.product_name}</td>
              <td className="px-4 py-3 font-semibold text-slate-800">{qty.toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-600">P{fmt(p.product_unitPrice)}</td>
              <td className="px-4 py-3 text-slate-600">P{fmt(p.inventory_value)}</td>
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
  if (!Array.isArray(data) || !data.length) return <EmptyState message="No outstanding balances found." />;
  const total = data.reduce((s, r) => s + Number(r.outstanding_balance || 0), 0);
  function agingBucket(days) {
    if (days <= 30) return ["0-30 days",  "bg-green-100 text-green-700"];
    if (days <= 60) return ["31-60 days", "bg-amber-100 text-amber-700"];
    if (days <= 90) return ["61-90 days", "bg-orange-100 text-orange-700"];
    return                 ["90+ days",   "bg-red-100 text-red-700"];
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Clients with Balance" value={data.length}       color="text-red-600" />
        <StatCard label="Total Outstanding"     value={"P" + fmt(total)} color="text-red-600" />
      </div>
      <SectionHeader title="Receivables Aging" count={data.length} onExport={() => exportCSV(data, "aging_report")} />
      <TableWrapper
        headers={["Client", "Sale #", "Sale Date", "Days Overdue", "Balance", "Bucket"]}
        footer={
          <tr>
            <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Outstanding</td>
            <td className="px-4 py-3 font-bold text-red-700">P{fmt(total)}</td>
            <td />
          </tr>
        }
      >
        {data.map((r, i) => {
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
              <td className="px-4 py-3 font-bold text-red-600">P{fmt(r.outstanding_balance)}</td>
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
  if (!Array.isArray(data) || !data.length) return <EmptyState message="No customer data found." />;
  return (
    <div>
      <SectionHeader title="Customer Purchase History" count={data.length} onExport={() => exportCSV(data, "customer_report")} />
      <TableWrapper headers={["Customer", "Total Orders", "Total Purchased", "Total Paid", "Outstanding"]}>
        {data.map((r, i) => (
          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-700">{r.client_name}</td>
            <td className="px-4 py-3 text-slate-600">{r.total_orders}</td>
            <td className="px-4 py-3 font-semibold text-slate-800">P{fmt(r.total_purchased)}</td>
            <td className="px-4 py-3 text-green-600">P{fmt(r.total_paid)}</td>
            <td className="px-4 py-3">
              <span className={Number(r.outstanding_balance) > 0 ? "font-bold text-red-600" : "text-slate-400"}>
                P{fmt(r.outstanding_balance)}
              </span>
            </td>
          </tr>
        ))}
      </TableWrapper>
    </div>
  );
}

export default function ReportsPage() {
  const [activeType, setActiveType] = useState("daily");
  const [date, setDate]             = useState(today);
  const [month, setMonth]           = useState(thisMonth);
  const [year, setYear]             = useState(thisYear);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);


  const years = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i));

  function buildUrl() {
    if (activeType === "daily") return `/api/reports/daily?start=${startDate}&end=${endDate}`;
    if (activeType === "monthly")      return "/api/reports/monthly?month=" + month;
    if (activeType === "revenue")      return "/api/reports/yearly?year=" + year;
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

      {/* Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        {REPORT_TYPES.map((r) => (
          <button
            key={r.key}
            onClick={() => { setActiveType(r.key); setResult(null); setError(""); }}
            className={"border-2 rounded-xl p-3 text-center transition-all hover:shadow-md " + (
              activeType === r.key
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-blue-300"
            )}
          >
            <div className="text-2xl mb-1">{r.icon}</div>
            <div className="text-xs font-bold text-slate-800 leading-tight">{r.title}</div>
          </button>
        ))}
      </div>

      {/* Generator Panel */}
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

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
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
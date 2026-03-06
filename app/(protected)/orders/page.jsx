"use client";

import { useState, useEffect } from "react";

const statusBadge = (status) => {
  const normalized = status?.toLowerCase();
  const map = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-red-100 text-red-700",
    "in transit": "bg-blue-100 text-blue-700",
    cancelled: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[normalized] || "bg-amber-100 text-amber-700"}`}>
      {status}
    </span>
  );
};

const flowSteps = [
  { icon: "📞", label: "Receive Order", sub: "Call/Messenger", color: "border-blue-400 bg-blue-50" },
  { icon: "✓",  label: "Stock Check",   sub: "System checks inventory", color: "border-blue-400 bg-blue-50" },
  { icon: "🏭", label: "Production?",   sub: "If out of stock (2-3 days)", color: "border-amber-400 bg-amber-50" },
  { icon: "📋", label: "Assign Delivery", sub: "Warehouse to vehicle", color: "border-blue-400 bg-blue-50" },
  { icon: "🚚", label: "Distribution",  sub: "Deliver to customer", color: "border-blue-400 bg-blue-50" },
  { icon: "💳", label: "Payment",       sub: "Record payment/balance", color: "border-green-400 bg-green-50" },
];

// ─── Ship Modal ───────────────────────────────────────────────────────────────
function ShipModal({ order, onClose, onSuccess }) {
  const [vehicles,  setVehicles]  = useState([]);
  const [managers,  setManagers]  = useState([]);
  const [employees, setEmployees] = useState([]);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState("");

  const [form, setForm] = useState({
    vehicle_id:        "",
    manager_id:        "",
    selectedEmployees: [],
  });

  // Load everything needed for the modal
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [vRes, mRes, eRes, dRes] = await Promise.all([
          fetch("/api/vehicle"),
          fetch("/api/employee"),
          fetch("/api/employee"),
          fetch(`/api/sales/${order.sales_ID}/details`),
        ]);
        const [vData, mData, eData, dData] = await Promise.all([
          vRes.json(), mRes.json(), eRes.json(), dRes.json(),
        ]);

        setVehicles(Array.isArray(vData) ? vData : []);

        // Managers: employees who are managers (isManager === 1)
        const allEmps = Array.isArray(mData) ? mData : [];
        setManagers(allEmps.filter(e => Number(e.isManager) === 1));
        setEmployees(allEmps);
        setItems(Array.isArray(dData) ? dData.map(i => ({ ...i, ship_qty: i.salesDetail_qty })) : []);
      } catch (err) {
        setError("Failed to load shipment data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [order.sales_ID]);

  const toggleEmployee = (id) => {
    setForm(f => ({
      ...f,
      selectedEmployees: f.selectedEmployees.includes(id)
        ? f.selectedEmployees.filter(e => e !== id)
        : [...f.selectedEmployees, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.vehicle_id)  return setError("Please select a vehicle.");
    if (!form.manager_id)  return setError("Please select a manager.");
    if (!form.selectedEmployees.length) return setError("Please assign at least one employee.");

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_ID:   order.sales_ID,
          manager_id: form.manager_id,
          vehicle_id: form.vehicle_id,
          items: items.map(i => ({
            productLine_ID: i.productLine_ID || i.product_ID,
            quantity:       i.ship_qty,
          })),
          employees: form.selectedEmployees,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(`Shipment created for Order #ORD-${order.sales_ID}`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">🚚 Create Shipment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Order #ORD-{order.sales_ID} · {order.client_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {loading ? (
            <div className="text-center text-slate-400 py-12 text-sm">Loading shipment data...</div>
          ) : (
            <>
              {/* Items — auto filled, read only */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Items to Ship</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500">Product</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Qty</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Unit Price</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} className="border-t border-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">{item.product_name}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.salesDetail_qty}</td>
                          <td className="px-4 py-3 text-right text-slate-600">₱{Number(item.salesDetail_unitPriceSold).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">₱{Number(item.salesDetail_subtotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 italic">Quantities are auto-filled from the order. All items will be shipped.</p>
              </div>

              {/* Vehicle & Manager */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Vehicle <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.vehicle_id}
                    onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.vehicle_ID} value={v.vehicle_ID}>
                        {v.vehicle_number} {v.vehicle_model ? `— ${v.vehicle_model}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Manager <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.manager_id}
                    onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}
                  >
                    <option value="">Select manager...</option>
                    {managers.map(m => (
                      <option key={m.manager_ID} value={m.manager_ID}>
                        {m.employee_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employees */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Assign Employees <span className="text-red-400">*</span>
                  <span className="ml-2 text-slate-400 font-normal normal-case">
                    ({form.selectedEmployees.length} selected)
                  </span>
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {employees
                    .filter(e => e.employee_status === "Active")
                    .map(emp => {
                      const selected = form.selectedEmployees.includes(emp.employee_ID);
                      return (
                        <button
                          key={emp.employee_ID}
                          type="button"
                          onClick={() => toggleEmployee(emp.employee_ID)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 last:border-0 transition-colors ${
                            selected ? "bg-blue-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? "bg-blue-600 border-blue-600" : "border-slate-300"
                          }`}>
                            {selected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-slate-700">{emp.employee_name}</span>
                            <span className="text-xs text-slate-400 ml-2">{emp.employee_role}</span>
                          </div>
                          {Number(emp.isManager) === 1 && (
                            <span className="text-xs text-violet-600 font-semibold">⭐ Manager</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? "Creating Shipment..." : "🚚 Confirm Shipment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shipment Detail Modal ────────────────────────────────────────────────────
function ShipmentDetailModal({ shipment, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shipment/${shipment.shipment_ID}`)
      .then(r => r.json())
      .then(data => setDetails(data))
      .catch(() => setDetails({ employees: [], items: [] }))
      .finally(() => setLoading(false));
  }, [shipment.shipment_ID]);

  const payBadge = (status) => {
    const map = { Paid: "bg-green-100 text-green-700", Partial: "bg-amber-100 text-amber-700", Unpaid: "bg-red-100 text-red-700" };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Shipment #{shipment.shipment_ID}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Order #ORD-{shipment.sales_ID} · {shipment.client_name}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Date", value: new Date(shipment.shipment_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) },
              { label: "Vehicle", value: `${shipment.vehicle_number}${shipment.vehicle_model ? ` — ${shipment.vehicle_model}` : ""}` },
              { label: "Manager", value: shipment.manager_name },
              { label: "Payment", value: payBadge(shipment.sales_paymentStatus) },
            ].map(c => (
              <div key={c.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{c.label}</div>
                <div className="text-sm font-semibold text-slate-700">{c.value}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-slate-400 text-sm py-8">Loading details...</div>
          ) : (
            <>
              {/* Items Shipped */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Items Shipped</p>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500">Product</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Qty Shipped</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details?.items?.length > 0 ? details.items.map((item, i) => (
                        <tr key={i} className="border-t border-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">{item.product_name}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{item.product_quantity}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="2" className="px-4 py-6 text-center text-slate-400 italic text-xs">No items found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Employees */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Assigned Employees
                  <span className="ml-2 font-normal text-slate-400 normal-case">({details?.employees?.length || 0})</span>
                </p>
                {details?.employees?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {details.employees.map(emp => (
                      <div key={emp.employee_ID} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {emp.employee_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-700">{emp.employee_name}</div>
                          <div className="text-[10px] text-slate-400">{emp.employee_role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No employees assigned.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="w-full border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Close
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
    <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
      type === "error" ? "bg-red-600" : "bg-green-600"
    }`}>
      {message}
    </div>
  );
}

// ─── Vehicle Modal ────────────────────────────────────────────────────────────
const EMPTY_VEHICLE = { vehicle_ID: "", vehicle_number: "", vehicle_model: "", vehicle_description: "" };

function VehicleModal({ mode, initial, onClose, onSuccess }) {
  const [form, setForm]       = useState(initial || EMPTY_VEHICLE);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.vehicle_number.trim()) return setError("Vehicle number is required.");
    if (mode === "add" && !form.vehicle_ID) return setError("Vehicle ID is required.");

    setSub(true);
    setError("");
    try {
      const res = await fetch("/api/vehicle", {
        method: mode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(mode === "add" ? "Vehicle added!" : "Vehicle updated!");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSub(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === "add" ? "🚛 Add Vehicle" : "✏️ Edit Vehicle"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {mode === "add" && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                Vehicle ID <span className="text-red-400">*</span>
                <span className="ml-1 font-normal text-slate-400 normal-case">(1–127, no auto-increment)</span>
              </label>
              <input className={inputCls} type="number" min="1" max="127" placeholder="e.g. 1"
                value={form.vehicle_ID} onChange={e => set("vehicle_ID", e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Plate / Vehicle Number <span className="text-red-400">*</span>
            </label>
            <input className={inputCls} type="text" placeholder="e.g. ABC 1234"
              value={form.vehicle_number} onChange={e => set("vehicle_number", e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Model</label>
            <input className={inputCls} type="text" placeholder="e.g. Isuzu Elf"
              value={form.vehicle_model} onChange={e => set("vehicle_model", e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Description</label>
            <input className={inputCls} type="text" placeholder="e.g. White delivery truck"
              value={form.vehicle_description} onChange={e => set("vehicle_description", e.target.value)} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
            {submitting ? "Saving..." : mode === "add" ? "Add Vehicle" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function Orders() {
  const [sales,         setSales]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [viewingOrder,  setViewingOrder]  = useState(null);
  const [orderDetails,  setOrderDetails]  = useState([]);
  const [isViewModalOpen,   setIsViewModalOpen]   = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shippingOrder, setShippingOrder] = useState(null); // order being shipped
  const [toast,         setToast]         = useState(null);
  const [clients,       setClients]       = useState([]);
  const [products,      setProducts]      = useState([]);
  const [formData,      setFormData]      = useState({ client_ID: "", amountPaid: 0 });
  const [selectedItems, setSelectedItems] = useState([{ product_ID: "", qty: 1, price: 0 }]);

  // Vehicle state
  const [vehicles,        setVehicles]        = useState([]);
  const [vehicleModal,    setVehicleModal]     = useState(null); // null | { mode, initial? }
  const [deletingVehicle, setDeletingVehicle]  = useState(null);

  // Shipment history state
  const [shipments,         setShipments]         = useState([]);
  const [shipmentDetail,    setShipmentDetail]    = useState(null); // { shipment, employees, items }
  const [shipmentDetailOpen, setShipmentDetailOpen] = useState(false);
  const [shipmentDetailLoading, setShipmentDetailLoading] = useState(false);

  const fetchSales = async () => {
    const res = await fetch("/api/sales");
    const data = await res.json();
    setSales(Array.isArray(data) ? data : []);
  };

  const fetchVehicles = async () => {
    const res = await fetch("/api/vehicle");
    const data = await res.json();
    setVehicles(Array.isArray(data) ? data : []);
  };

  const fetchShipments = async () => {
    const res = await fetch("/api/shipment");
    const data = await res.json();
    setShipments(Array.isArray(data) ? data : []);
  };

  const handleViewShipment = async (shipment) => {
    setShipmentDetail({ shipment, employees: [], items: [] });
    setShipmentDetailOpen(true);
    setShipmentDetailLoading(true);
    try {
      const res = await fetch(`/api/shipment/${shipment.shipment_ID}`);
      const data = await res.json();
      setShipmentDetail({ shipment, employees: data.employees || [], items: data.items || [] });
    } catch {
      setShipmentDetail({ shipment, employees: [], items: [] });
    } finally {
      setShipmentDetailLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    if (!confirm(`Delete vehicle ${vehicle.vehicle_number}? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/vehicle", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_ID: vehicle.vehicle_ID }),
      });
      if (res.ok) {
        setToast({ message: "Vehicle deleted.", type: "success" });
        fetchVehicles();
      } else {
        const d = await res.json();
        setToast({ message: d.error || "Delete failed.", type: "error" });
      }
    } catch {
      setToast({ message: "Delete failed.", type: "error" });
    }
  };

  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [salesRes, clientRes, productRes, vehicleRes, shipmentRes] = await Promise.all([
          fetch("/api/sales"),
          fetch("/api/client"),
          fetch("/api/products"),
          fetch("/api/vehicle"),
          fetch("/api/shipment"),
        ]);
        const [salesData, clientData, productData, vehicleData, shipmentData] = await Promise.all([
          salesRes.json(), clientRes.json(), productRes.json(), vehicleRes.json(), shipmentRes.json(),
        ]);
        setSales(Array.isArray(salesData) ? salesData : []);
        setClients(Array.isArray(clientData) ? clientData : []);
        setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
        setShipments(Array.isArray(shipmentData) ? shipmentData : []);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const filtered = sales.filter(s => statusFilter === "all" || s.sales_status === statusFilter);

  const stats = {
    pending:   sales.filter(s => s.sales_status === "Pending").length,
    completed: sales.filter(s => s.sales_status === "Completed").length,
    revenue:   sales.reduce((acc, curr) => acc + Number(curr.sales_totalAmount), 0),
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const msg = newStatus === "Cancelled"
      ? "Are you sure? This will return items to stock."
      : `Change order #ORD-${orderId} to ${newStatus}?`;
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/sales/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchSales();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleViewClick = async (order) => {
    setOrderDetails([]);
    setViewingOrder(order);
    setIsViewModalOpen(true);
    try {
      const res = await fetch(`/api/sales/${order.sales_ID}/details`);
      const data = await res.json();
      if (res.ok) setOrderDetails(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Connecting to Database...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Order & Shipment Management</h1>
        <button onClick={() => setIsCreateModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Order
        </button>
      </div>

      {/* Flow */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Order Processing Flow</h2>
        <div className="flex items-start gap-1 overflow-x-auto pb-4">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-shrink-0">
              <div className={`border-2 ${step.color} rounded-xl p-3 text-center min-w-[120px]`}>
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className="text-xs font-bold text-slate-700">{step.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{step.sub}</div>
              </div>
              {i < flowSteps.length - 1 && <div className="text-slate-300 text-xl px-2 flex-shrink-0">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Orders", value: stats.pending,  color: "text-red-500" },
          { label: "Completed",      value: stats.completed, color: "text-green-600" },
          { label: "Total Sales",    value: sales.length,   color: "text-blue-600" },
          { label: "Total Revenue",  value: `₱${stats.revenue.toLocaleString()}`, color: "text-slate-800" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center border border-slate-100">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1 font-semibold">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-base font-bold text-slate-700">Recent Sales Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {["all", "Pending", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === status
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Order #", "Customer", "Date", "Amount", "Balance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.sales_ID} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-3 font-bold text-blue-600">#ORD-{s.sales_ID}</td>
                  <td className="py-4 px-3 text-slate-700 font-medium">{s.client_name}</td>
                  <td className="py-4 px-3 text-slate-500">{new Date(s.sales_createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-3 font-bold text-slate-800">₱{Number(s.sales_totalAmount).toLocaleString()}</td>
                  <td className="py-4 px-3">
                    <span className={Number(s.sales_Balance) > 0 ? "text-red-500 font-bold" : "text-slate-400"}>
                      ₱{Number(s.sales_Balance).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-3">{statusBadge(s.sales_status)}</td>
                  <td className="py-4 px-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-all"
                        onClick={() => handleViewClick(s)}
                      >
                        View
                      </button>
                      {s.sales_status === "Pending" && (
                        <button
                          className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-md transition-all"
                          onClick={() => setShippingOrder(s)}
                        >
                          Ship
                        </button>
                      )}
                      {s.sales_status !== "Cancelled" && (
                        <button
                          className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md transition-all"
                          onClick={() => updateOrderStatus(s.sales_ID, "Cancelled")}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">No orders found for this category.</div>
          )}
        </div>
      </div>

      {/* ── Vehicle Management Section ──────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-700">🚛 Vehicle Fleet</h2>
            <p className="text-xs text-slate-400 mt-0.5">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered</p>
          </div>
          <button
            onClick={() => setVehicleModal({ mode: "add" })}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            + Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm italic">No vehicles registered yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map(v => (
              <div key={v.vehicle_ID} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">🚚</div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{v.vehicle_number}</div>
                      <div className="text-xs text-slate-400">ID: {v.vehicle_ID}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setVehicleModal({ mode: "edit", initial: { ...v } })}
                      className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-all"
                    >Edit</button>
                    <button
                      onClick={() => handleDeleteVehicle(v)}
                      className="text-[10px] font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-all"
                    >Del</button>
                  </div>
                </div>
                {v.vehicle_model && (
                  <div className="text-xs text-slate-600 font-medium mb-1">{v.vehicle_model}</div>
                )}
                {v.vehicle_description && (
                  <div className="text-xs text-slate-400 leading-relaxed">{v.vehicle_description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Modal */}
      {vehicleModal && (
        <VehicleModal
          mode={vehicleModal.mode}
          initial={vehicleModal.initial}
          onClose={() => setVehicleModal(null)}
          onSuccess={(msg) => {
            setVehicleModal(null);
            setToast({ message: msg, type: "success" });
            fetchVehicles();
          }}
        />
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Order #ORD-{viewingOrder.sales_ID}</h2>
                <p className="text-sm text-slate-500">Customer: {viewingOrder.client_name}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-6">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b">
                    <th className="py-2">Product</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.isArray(orderDetails) && orderDetails.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-medium text-black">{item.product_name}</td>
                      <td className="py-3 text-center text-black">{item.salesDetail_qty}</td>
                      <td className="py-3 text-right text-black">₱{Number(item.salesDetail_unitPriceSold).toLocaleString()}</td>
                      <td className="py-3 text-right font-bold text-black">₱{Number(item.salesDetail_subtotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6 flex justify-end">
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase">Total Amount</p>
                  <p className="text-2xl font-black text-blue-600">₱{Number(viewingOrder.sales_totalAmount).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Create New Sales Order</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Select Customer</label>
                <select
                  className="w-full mt-1 p-2 border text-black border-slate-200 rounded-lg text-sm bg-slate-50"
                  value={formData.client_ID}
                  onChange={(e) => setFormData({ ...formData, client_ID: e.target.value })}
                >
                  <option value="">-- Choose a Client --</option>
                  {clients.map(c => (
                    <option key={c.client_ID} value={c.client_ID}>{c.client_name}</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Order Items</label>
                  <button
                    onClick={() => setSelectedItems([...selectedItems, { product_ID: "", qty: 1, price: 0 }])}
                    className="text-blue-600 text-xs font-bold hover:underline"
                  >+ Add Item</button>
                </div>
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-center">
                    <select
                      className="flex-1 p-2 border text-black border-slate-200 rounded-lg text-sm"
                      onChange={(e) => {
                        const p = products.find(prod => prod.product_ID == e.target.value);
                        const newItems = [...selectedItems];
                        newItems[index] = { ...newItems[index], product_ID: e.target.value, price: p?.product_unitPrice || 0 };
                        setSelectedItems(newItems);
                      }}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.product_ID} value={p.product_ID} disabled={p.product_stockQty <= 0}>
                          {p.product_name} (Stock: {p.product_stockQty})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number" min="1" placeholder="Qty"
                      className="w-20 p-2 border text-black border-slate-200 rounded-lg text-sm"
                      value={item.qty}
                      onChange={(e) => {
                        const newItems = [...selectedItems];
                        newItems[index].qty = Number(e.target.value);
                        setSelectedItems(newItems);
                      }}
                    />
                    <button onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold text-blue-800">Total Order Amount:</span>
                <span className="text-xl font-black text-blue-600">
                  ₱{selectedItems.reduce((sum, i) => sum + (i.qty * i.price), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >Cancel</button>
                <button
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-100 transition-all"
                  onClick={async () => {
                    const total = selectedItems.reduce((sum, i) => sum + (i.qty * i.price), 0);
                    const res = await fetch("/api/sales", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        client_ID: formData.client_ID,
                        items: selectedItems,
                        totalAmount: total,
                        amountPaid: 0,
                      }),
                    });
                    if (res.ok) {
                      await fetchSales();
                      setIsCreateModalOpen(false);
                      setSelectedItems([{ product_ID: "", qty: 1, price: 0 }]);
                    } else {
                      const err = await res.json();
                      alert(err.error || "Failed to create order");
                    }
                  }}
                >Create Order & Update Inventory</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ship Modal */}
      {shippingOrder && (
        <ShipModal
          order={shippingOrder}
          onClose={() => setShippingOrder(null)}
          onSuccess={(msg) => {
            setShippingOrder(null);
            setToast({ message: msg, type: "success" });
            fetchSales();
            fetchShipments();
          }}
        />
      )}

      {/* ── Shipment History Section ─────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-700">📦 Shipment History</h2>
            <p className="text-xs text-slate-400 mt-0.5">{shipments.length} shipment{shipments.length !== 1 ? "s" : ""} recorded</p>
          </div>
        </div>

        {shipments.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm italic">No shipments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Shipment #", "Order #", "Customer", "Date", "Vehicle", "Manager", "Payment", "Sale Status", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shipments.map(sh => (
                  <tr key={sh.shipment_ID} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-3 font-bold text-slate-600">SHP-{sh.shipment_ID}</td>
                    <td className="py-3 px-3 font-bold text-blue-600">#ORD-{sh.sales_ID}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{sh.client_name}</td>
                    <td className="py-3 px-3 text-slate-500">{new Date(sh.shipment_date).toLocaleDateString()}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-medium">{sh.vehicle_number}</span>
                      {sh.vehicle_model && <span className="text-slate-400 ml-1 text-xs">({sh.vehicle_model})</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{sh.manager_name}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        sh.sales_paymentStatus === "Paid"    ? "bg-green-100 text-green-700" :
                        sh.sales_paymentStatus === "Partial" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{sh.sales_paymentStatus}</span>
                    </td>
                    <td className="py-3 px-3">{statusBadge(sh.sales_status)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleViewShipment(sh)}
                        className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      >View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shipment Detail Modal */}
      {shipmentDetailOpen && shipmentDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">SHP-{shipmentDetail.shipment.shipment_ID} Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order #ORD-{shipmentDetail.shipment.sales_ID} · {shipmentDetail.shipment.client_name}
                </p>
              </div>
              <button onClick={() => setShipmentDetailOpen(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
              {shipmentDetailLoading ? (
                <div className="text-center text-slate-400 py-12 text-sm">Loading details...</div>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Shipment Date", value: new Date(shipmentDetail.shipment.shipment_date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) },
                      { label: "Vehicle", value: `${shipmentDetail.shipment.vehicle_number}${shipmentDetail.shipment.vehicle_model ? ` — ${shipmentDetail.shipment.vehicle_model}` : ""}` },
                      { label: "Manager", value: shipmentDetail.shipment.manager_name },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{item.label}</div>
                        <div className="text-sm font-semibold text-slate-700">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Payment + Sale status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Payment Status</div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        shipmentDetail.shipment.sales_paymentStatus === "Paid"    ? "bg-green-100 text-green-700" :
                        shipmentDetail.shipment.sales_paymentStatus === "Partial" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{shipmentDetail.shipment.sales_paymentStatus}</span>
                      <div className="text-xs text-slate-500 mt-1">
                        Balance: <span className="font-bold text-red-500">₱{Number(shipmentDetail.shipment.sales_Balance || 0).toLocaleString()}</span>
                        {" / "}Total: <span className="font-bold text-slate-700">₱{Number(shipmentDetail.shipment.sales_totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Delivery Status</div>
                      {statusBadge(shipmentDetail.shipment.sales_status)}
                    </div>
                  </div>

                  {/* Items shipped */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Items Shipped</p>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500">Product</th>
                            <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Qty</th>
                            <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipmentDetail.items.length === 0 ? (
                            <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-400 italic text-xs">No items found.</td></tr>
                          ) : shipmentDetail.items.map((item, i) => (
                            <tr key={i} className="border-t border-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-700">{item.product_name}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{item.product_quantity}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                {item.product_subtotal ? `₱${Number(item.product_subtotal).toLocaleString()}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Employees */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Assigned Employees</p>
                    {shipmentDetail.employees.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No employees recorded.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {shipmentDetail.employees.map((emp, i) => (
                          <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                              {emp.employee_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-700">{emp.employee_name}</div>
                              <div className="text-[10px] text-slate-400">{emp.employee_role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setShipmentDetailOpen(false)}
                className="w-full border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
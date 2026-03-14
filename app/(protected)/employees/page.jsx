"use client";
import { useState, useEffect, useRef } from "react";

// ─── Constants 
const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white";

const EMPTY_FORM = {
  employee_ID:        "",
  employee_name:      "",
  employee_role:      "",
  employee_email:     "",
  employee_contactNo: "",
  employee_address:   "",
  employee_gender:    "",
  employee_dateHired: "",
  employee_birthdate: "",
  employee_status:    "Active",
  isManager:          0,
};

const ROLES = [
  "Warehouse Staff",
  "Driver",
  "Sales Staff",
  "Office Clerk",
  "Accountant",
  "Supervisor",
  "Manager",
  "Owner",
];

// ─── Field Wrapper 
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

// ─── Modal Shell
function Modal({ open, onClose, title, width, children }) {
  const overlayRef = useRef(null);
  const maxW = width || "max-w-lg";

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, []);

  const bg = type === "error" ? "bg-red-600" : "bg-green-600";
  return (
    <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${bg}`}>
      {message}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const palette = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];

  let sz = "w-10 h-10 text-sm";
  if (size === "lg") sz = "w-14 h-14 text-lg";
  if (size === "sm") sz = "w-8 h-8 text-xs";

  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Status Badge
function StatusBadge({ status }) {
  const style =
    status === "Active"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-500";
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style}`}>
      {status || "Active"}
    </span>
  );
}

// ─── Confirm Dialog 
function ConfirmDialog({ open, onClose, onConfirm, employee, loading }) {
  const isDeactivating = employee?.employee_status === "Active";
  const actionLabel = isDeactivating ? "Deactivate" : "Reactivate";
  const btnStyle = isDeactivating
    ? "bg-red-600 hover:bg-red-700"
    : "bg-green-600 hover:bg-green-700";

  return (
    <Modal open={open} onClose={onClose} title={`${actionLabel} Employee`} width="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
          <Avatar name={employee?.employee_name} />
          <div>
            <p className="font-semibold text-slate-800">{employee?.employee_name}</p>
            <p className="text-xs text-slate-500">{employee?.employee_role}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {isDeactivating
            ? "This employee will be marked as Inactive. You can reactivate them later."
            : "This employee will be marked as Active again."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors ${btnStyle}`}
          >
            {loading ? "Saving..." : actionLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Employee Form 
function EmployeeForm({ initial, isEdit, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm(initial || EMPTY_FORM);
  }, [initial]);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isEdit && (
        <Field label="Employee ID" required>
          <input
            className={inputCls}
            type="number"
            placeholder="Unique employee number"
            value={form.employee_ID}
            onChange={(e) => set("employee_ID", e.target.value)}
            required
          />
        </Field>
      )}

      <Field label="Full Name" required>
        <input
          className={inputCls}
          placeholder="e.g. Juan Dela Cruz"
          value={form.employee_name}
          onChange={(e) => set("employee_name", e.target.value)}
          required
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Role" required>
          <select
            className={inputCls}
            value={form.employee_role}
            onChange={(e) => set("employee_role", e.target.value)}
            required
          >
            <option value="">Select role...</option>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Gender">
          <select
            className={inputCls}
            value={form.employee_gender}
            onChange={(e) => set("employee_gender", e.target.value)}
          >
            <option value="">Select...</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition"
            checked={form.isManager === 1}
            onChange={(e) => set("isManager", e.target.checked ? 1 : 0)}
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">Set as Manager</p>
            <p className="text-xs text-slate-500">This will add them to the management records.</p>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact Number">
          <input
            className={inputCls}
            placeholder="09XXXXXXXXX"
            maxLength={11}
            value={form.employee_contactNo}
            onChange={(e) => set("employee_contactNo", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            placeholder="email@example.com"
            value={form.employee_email}
            onChange={(e) => set("employee_email", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Address">
        <input
          className={inputCls}
          placeholder="Street, Barangay, City"
          value={form.employee_address}
          onChange={(e) => set("employee_address", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date Hired">
          <input
            className={inputCls}
            type="date"
            value={form.employee_dateHired}
            onChange={(e) => set("employee_dateHired", e.target.value)}
          />
        </Field>
        <Field label="Birthdate">
          <input
            className={inputCls}
            type="date"
            value={form.employee_birthdate}
            onChange={(e) => set("employee_birthdate", e.target.value)}
          />
        </Field>
      </div>

      {isEdit && (
        <Field label="Status">
          <select
            className={inputCls}
            value={form.employee_status}
            onChange={(e) => set("employee_status", e.target.value)}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </Field>
      )}

      {isEdit && (
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">System Access</p>
          <Field label="System Role">
            <select
              className={inputCls}
              value={form.system_role || ""}
              onChange={(e) => set("system_role", e.target.value || null)}
            >
              <option value="">No system access</option>
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </Field>
          <Field label="Username">
            <input
              className={inputCls}
              placeholder="Login username"
              value={form.username || ""}
              onChange={(e) => set("username", e.target.value)}
            />
          </Field>
          <Field label="Password">
            <input
              className={inputCls}
              type="text"
              placeholder="Leave blank to keep current"
              value={form.password_hash || ""}
              onChange={(e) => set("password_hash", e.target.value)}
            />
          </Field>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-200 text-slate-600 font-medium py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors ${
            isEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
        </button>
      </div>
    </form>
  );
}

// ─── Employee Detail Panel
function EmployeeDetail({ employee, onEdit, onDeactivate }) {
  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">👤</div>
        <p className="font-semibold text-slate-600">Select an employee</p>
        <p className="text-sm text-slate-400">Choose from the list on the left</p>
      </div>
    );
  }

  function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function DetailRow({ label, value }) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{value || "—"}</span>
      </div>
    );
  }

  const isActive = employee.employee_status === "Active";

  return (
    <div className="flex flex-col h-full overflow-y-auto gap-5">
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <Avatar name={employee.employee_name} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-slate-800">{employee.employee_name}</h2>
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                {employee.employee_role || "—"}
              </span>
              {employee.isManager === 1 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">
                  ⭐ Manager
                </span>
              )}
            </div>
          </div>
        </div>
        <StatusBadge status={employee.employee_status || "Active"} />
      </div>

      <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Employee ID</span>
        <span className="text-sm font-bold text-slate-700">#{employee.employee_ID}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 shrink-0">
        <DetailRow label="Contact Number" value={employee.employee_contactNo} />
        <DetailRow label="Email" value={employee.employee_email} />
        <DetailRow label="Gender" value={employee.employee_gender} />
        <DetailRow label="Address" value={employee.employee_address} />
        <DetailRow label="Date Hired" value={fmtDate(employee.employee_dateHired)} />
        <DetailRow label="Birthdate" value={fmtDate(employee.employee_birthdate)} />
      </div>

      {employee.system_role && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 shrink-0">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">System Access</p>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="System Role" value={employee.system_role} />
            <DetailRow label="Username" value={employee.username} />
          </div>
        </div>
      )}

      {employee.isManager === 1 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 shrink-0">
          <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-3">Manager Info</p>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Manager ID" value={employee.manager_ID} />
            <DetailRow label="Manager Since" value={fmtDate(employee.manager_dateStarted)} />
            <DetailRow label="Manager Status" value={employee.manager_status} />
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100 shrink-0">
        <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">✏️ Edit</button>
        <button onClick={() => onDeactivate(employee)} className={`flex-1 font-medium py-2.5 rounded-lg text-sm transition-colors border ${isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
          {isActive ? "🔒 Deactivate" : "✅ Reactivate"}
        </button>
      </div>
    </div>
  );
}


// PAGE — default export last, nothing after it
export default function EmployeesPage() {
  // 1. Core Data State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  // 2. Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [roleFilter, setRoleFilter] = useState("all");

  // 3. Modal & Form State
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetEmp, setTargetEmp] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // 4. FETCH DATA
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/employee");
      const data = await r.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // 5. DERIVED DATA 
  const roles = ["all", ...new Set(employees.map((e) => e.employee_role).filter(Boolean))];
  const editInitial = selected ? { ...selected } : EMPTY_FORM;

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.employee_status === "Active").length,
    managers: employees.filter((e) => e.isManager === 1).length,
    inactive: employees.filter((e) => e.employee_status === "Inactive").length,
  };

  const filtered = employees.filter((e) => {
    const matchSearch = e.employee_name?.toLowerCase().includes(search.toLowerCase()) || String(e.employee_ID).includes(search);
    const matchStatus = statusFilter === "all" || e.employee_status === statusFilter;
    const matchRole = roleFilter === "all" || e.employee_role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  // 6. LOGIC HANDLERS
  async function handleAdd(formData) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add");
      setToast({ message: "Added successfully!", type: "success" });
      setAddOpen(false);
      fetchEmployees();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally { setFormLoading(false); }
  }

  async function handleEdit(formData) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/employee/${formData.employee_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      setToast({ message: "Changes saved!", type: "success" });
      setEditOpen(false);

      // Refresh list then re-select the updated employee
      const r = await fetch("/api/employee");
      const data = await r.json();
      const list = Array.isArray(data) ? data : [];
      setEmployees(list);

      // Re-select the updated employee from fresh data
      const updated = list.find((e) => e.employee_ID === formData.employee_ID);
      if (updated) setSelected(updated);

    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeactivate() {
    if (!targetEmp) return;
    setFormLoading(true);
    const newStatus = targetEmp.employee_status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/employee/${targetEmp.employee_ID}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_status: newStatus }),
      });
      setToast({ message: `Status updated to ${newStatus}`, type: "success" });
      setConfirmOpen(false);
      fetchEmployees();
    } catch (err) {
      setToast({ message: "Action failed", type: "error" });
    } finally { setFormLoading(false); }
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.active} active · {stats.managers} manager{stats.managers !== 1 ? "s" : ""} · {stats.inactive} inactive
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">+ Add Employee</button>
      </div>

      {/* Stats - HORIZONTAL LINEUP (grid-cols-4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 min-w-0">
        {[
          { label: "Total Employees", val: stats.total, border: "border-blue-400", icon: "👥" },
          { label: "Active", val: stats.active, border: "border-green-400", icon: "✅" },
          { label: "Managers", val: stats.managers, border: "border-violet-400", icon: "⭐" },
          { label: "Inactive", val: stats.inactive, border: "border-slate-300", icon: "🔒" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.border} p-4 shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left — Employee List */}
        <div className="w-96 shrink-0 bg-white rounded-2xl shadow-sm p-5 flex flex-col overflow-hidden">
          <input
            className={inputCls + " mb-3"}
            placeholder="Search name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-2 mb-3 shrink-0">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-1">
              {[["Active", "Active"], ["Inactive", "Inactive"], ["all", "All"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                    statusFilter === val ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r === "all" ? "All Roles" : r}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {loading ? (
              <div className="text-center text-slate-400 text-sm py-12">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-12">No results.</div>
            ) : (
              filtered.map((emp) => (
                <button
                  key={emp.employee_ID}
                  onClick={() => setSelected(emp)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                    selected?.employee_ID === emp.employee_ID ? "border-blue-400 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.employee_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-800 truncate">{emp.employee_name}</span>
                        {emp.isManager === 1 && <span className="text-xs">⭐</span>}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{emp.employee_role} · #{emp.employee_ID}</div>
                    </div>
                    <StatusBadge status={emp.employee_status} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — Detail */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-6 overflow-hidden">
          <EmployeeDetail
            employee={selected}
            onEdit={() => setEditOpen(true)}
            onDeactivate={(emp) => { setTargetEmp(emp); setConfirmOpen(true); }}
          />
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Employee">
        <EmployeeForm
          initial={EMPTY_FORM}
          isEdit={false}
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee">
        <EmployeeForm
          initial={editInitial}
          isEdit={true}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Confirm Deactivate */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setTargetEmp(null); }}
        onConfirm={handleDeactivate}
        employee={targetEmp}
        loading={formLoading}
      />

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

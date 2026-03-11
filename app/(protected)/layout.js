"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ALL_MENU_ITEMS = [
  { label: "Dashboard",          icon: "📊", route: "/dashboard",   roles: ["Owner", "Manager", "Employee"] },
  { label: "Sales",              icon: "💰", route: "/sales",       roles: ["Owner", "Manager", "Employee"] },
  { label: "Inventory",          icon: "📦", route: "/inventory",   roles: ["Owner", "Manager"] },
  { label: "Customers",          icon: "👥", route: "/customers",   roles: ["Owner", "Manager"] },
  { label: "Orders/Shipments",   icon: "🚚", route: "/orders",      roles: ["Owner", "Manager"] },
  { label: "Accounts Receivable",icon: "💵", route: "/receivables", roles: ["Owner", "Manager"] },
  { label: "Reports",            icon: "📈", route: "/reports",     roles: ["Owner", "Manager"] },
  { label: "Payments",           icon: "💳", route: "/payments",    roles: ["Owner", "Manager"] },
  { label: "Employees",          icon: "👨‍💼", route: "/employees",  roles: ["Owner"] },
];

export default function Layout({ children }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user) {
          router.push("/");
        } else {
          setUser(d.user);
        }
      })
      .catch(() => router.push("/"));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const menuItems = ALL_MENU_ITEMS.filter(item =>
    user && item.roles.includes(user.role)
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            ☰
          </button>
          <span className="text-lg font-bold tracking-tight">📦 InvenTrack System</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-slate-700 rounded-full px-3 py-1">
            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
              {user.name?.charAt(0)}
            </span>
            <span className="text-slate-200">{user.name}</span>
            <span className="text-xs bg-amber-500 text-white rounded px-1.5 py-0.5 font-medium">
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors text-xs"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-56" : "w-0 lg:w-56"} bg-slate-700 text-white transition-all duration-300 overflow-hidden flex-shrink-0`}>
          <nav className="py-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <Link
                  key={item.route}
                  href={item.route}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition-all border-l-4 ${
                    isActive
                      ? "bg-slate-800 border-blue-400 text-white font-medium"
                      : "border-transparent text-slate-300 hover:bg-slate-600 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
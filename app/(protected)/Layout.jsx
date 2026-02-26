"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Dashboard", icon: "📊", route: "/dashboard" },
  { label: "Sales", icon: "💰", route: "/sales" },
  { label: "Inventory", icon: "📦", route: "/inventory" },
  { label: "Customers", icon: "👥", route: "/customers" },
  { label: "Orders/Shipments", icon: "🚚", route: "/orders" },
  { label: "Accounts Receivable", icon: "💵", route: "/receivables" },
  { label: "Reports", icon: "📈", route: "/reports" },
  { label: "Employees", icon: "👨‍💼", route: "/employees" },
  { label: "Payments", icon: "💳", route: "/payments" },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({name: "Loading...", role: "User"});

  useEffect(() => {
    const storedName = local
  })

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
          <span className="text-lg font-bold tracking-tight">
            📦 InvenTrack System
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button className="relative text-slate-300 hover:text-white transition-colors">
            🔔
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          <Link href="/settings" className="text-slate-300 hover:text-white transition-colors">
            ⚙️
          </Link>
          <div className="flex items-center gap-2 bg-slate-700 rounded-full px-3 py-1">
            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
              JD
            </span>
            <span className="text-slate-200">John Doe</span>
            <span className="text-xs bg-amber-500 text-white rounded px-1.5 py-0.5 font-medium">
              Owner
            </span>
          </div>
          <Link href="/login" className="text-slate-400 hover:text-red-400 transition-colors text-xs">
            Logout
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-56" : "w-0 lg:w-56"
          } bg-slate-700 text-white transition-all duration-300 overflow-hidden flex-shrink-0`}
        >
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

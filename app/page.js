"use client";

import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-800 px-8 py-8 text-center">
            <div className="text-5xl mb-3">📦</div>
            <h1 className="text-2xl font-bold text-white">InvenTrack System</h1>
            <p className="text-slate-400 text-sm mt-1">Sales & Inventory Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Username or Email
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md"
            >
              🔐 Login
            </button>
          </form>

          {/* User Roles Info */}
          <div className="mx-8 mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">
              👤 User Roles
            </div>
            <ul className="space-y-1.5">
              {[
                { role: "Owner", desc: "Full system access" },
                { role: "Manager", desc: "Sales, inventory, reports" },
                { role: "Employee", desc: "Limited — sales entry only" },
              ].map((r) => (
                <li key={r.role} className="text-xs text-amber-800 flex items-center gap-1.5">
                  <span className="w-16 font-bold">{r.role}:</span>
                  <span>{r.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          InvenTrack System • Davao, Philippines • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

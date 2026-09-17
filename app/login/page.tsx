"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { users } from "@/lib/users";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(
      u => u.email === form.email && u.password === form.password
    );

    if (user) {
      if (user.role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/tasks");
      }
    } else {
      setError("Invalid credentials");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registering:", form);
    router.push("/tasks");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-600">
      <div className="w-96 h-[400px] bg-white rounded-lg shadow-md flex flex-col">
        {/* Tabs docked at top */}
        <div className="flex justify-around border-b p-4">
          <button
            onClick={() => setActiveTab("login")}
            className={`font-semibold ${
              activeTab === "login" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`font-semibold ${
              activeTab === "register" ? "text-green-600" : "text-gray-600"
            }`}
          >
            Register
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col h-full">
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-500 p-2 rounded 
                  placeholder-gray-500 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border border-gray-500 p-2 rounded 
                  placeholder-gray-500 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="mt-auto bg-blue-600 text-white px-4 py-2 rounded"
              >
                Login
              </button>
            </form>
          )}

          {/* Registration Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col h-full">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full border border-gray-500 p-2 rounded 
                  placeholder-gray-500 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-500 p-2 rounded 
                  placeholder-gray-500 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full border border-gray-500 p-2 rounded 
                  placeholder-gray-500 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="mt-auto bg-green-600 text-white px-4 py-2 rounded"
              >
                Register
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}

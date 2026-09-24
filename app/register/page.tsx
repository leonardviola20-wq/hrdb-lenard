"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");

  // LOGIN HANDLER
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationUrl("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Login failed");
      } else {
        setMessage("✅ Login successful");
        router.push("/dashboard");
      }
    } catch {
      setMessage("Server error");
    }
  };

  // REGISTER HANDLER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          email: form.email,
          password: form.password,
          role: "USER",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Registration failed");
      } else {
        setMessage(data.message);
        setVerificationUrl(data.verificationUrl);
      }
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        {/* Tabs */}
        <div className="flex justify-around border-b mb-6">
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

        {/* LOGIN FORM */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border p-2 rounded"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="submit"
              className="w-full rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100"
            >
              Login
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full border p-2 rounded"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              type="text"
              placeholder="Name (optional)"
              className="w-full border p-2 rounded"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border p-2 rounded"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
            <button
              type="submit"
              className="w-full rounded border border-gray-500 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-100"
            >
              Register
            </button>
          </form>
        )}

        {message && (
          <div className="mt-4 text-center">
            <p className="text-gray-800">{message}</p>
            {verificationUrl && (
              <a
                href={verificationUrl}
                className="mt-2 inline-block break-all font-medium text-blue-700 underline hover:text-blue-900"
              >
                Open verification link
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

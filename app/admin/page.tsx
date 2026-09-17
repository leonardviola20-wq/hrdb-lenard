"use client";

import { registrations, Registration } from "@/lib/registrations";

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <ul>
        {registrations.map((r: Registration, i: number) => (
          <li key={i} className="mb-2">
            {r.email} — Current role: {r.role}
            <button className="ml-2 bg-blue-600 text-white px-2 py-1 rounded">
              Assign User
            </button>
            <button className="ml-2 bg-purple-600 text-white px-2 py-1 rounded">
              Assign Admin
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

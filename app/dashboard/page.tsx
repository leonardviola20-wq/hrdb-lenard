"use client";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">HRDB-Lenard Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Employees</h2>
          <p>42 total</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p>7 pending</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Reports</h2>
          <p>3 generated</p>
        </div>
      </div>
    </div>
  );
}

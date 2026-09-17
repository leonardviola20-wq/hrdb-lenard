"use client";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">HRDB-Lenard Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-blue-900">Employees</h2>
          <p className="text-blue-800">42 total</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-green-900">Tasks</h2>
          <p className="text-green-800">7 pending</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold text-yellow-900">Reports</h2>
          <p className="text-yellow-800">3 generated</p>
        </div>
      </div>
    </div>
  );
}

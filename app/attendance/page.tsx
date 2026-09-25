import Link from "next/link";

export default function AttendancePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-blue-600">HRDB-Lenard</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-2 text-gray-600">Attendance tracking will be available here.</p>
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

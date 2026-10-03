import Link from "next/link";

export default function AttendancePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl">
        <Link href="/dashboard" className="mt-6 inline-block rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

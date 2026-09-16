export default function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome to HRDB-Lenard</h1>
      <p className="mb-2">This is your HR management portal.</p>
      <a href="/login" className="text-blue-600 underline">
        Go to Login
      </a>
    </div>
  );
}
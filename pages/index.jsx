import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4">Waste Density Calculator</h1>
      <p className="text-gray-600 mb-6">Hitung densitas aktivitas limbah padat (Bq/g)</p>
      <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        Go to Dashboard
      </Link>
    </main>
  );
}

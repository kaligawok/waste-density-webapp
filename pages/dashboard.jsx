import WasteCalculator from '../components/WasteCalculator';

export default function Dashboard() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Dashboard - Waste Density Calculator</h1>
      <WasteCalculator />
    </div>
  );
}

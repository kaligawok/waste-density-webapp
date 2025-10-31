import { useState } from 'react';

export default function WasteCalculator() {
  const [factor, setFactor] = useState('');
  const [distance, setDistance] = useState('');
  const [measured, setMeasured] = useState('');
  const [mass, setMass] = useState('');
  const [activity, setActivity] = useState(0);
  const [density, setDensity] = useState(0);

  const calculate = () => {
    const A = (parseFloat(measured) * Math.pow(parseFloat(distance), 2)) / parseFloat(factor);
    const D = A / parseFloat(mass);
    setActivity(A.toFixed(2));
    setDensity(D.toFixed(2));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Perhitungan Densitas Aktivitas</h2>
      <div className="space-y-3">
        <input type="number" placeholder="Faktor gamma (µSv·m²/(MBq·h))" value={factor} onChange={(e) => setFactor(e.target.value)} className="w-full border p-2 rounded-lg" />
        <input type="number" placeholder="Jarak (m)" value={distance} onChange={(e) => setDistance(e.target.value)} className="w-full border p-2 rounded-lg" />
        <input type="number" placeholder="Nilai radiasi terukur (µSv)" value={measured} onChange={(e) => setMeasured(e.target.value)} className="w-full border p-2 rounded-lg" />
        <input type="number" placeholder="Massa limbah (g)" value={mass} onChange={(e) => setMass(e.target.value)} className="w-full border p-2 rounded-lg" />
        <button onClick={calculate} className="bg-blue-600 text-white w-full py-2 rounded-lg hover:bg-blue-700">Hitung</button>
        <div className="mt-4">
          <p>Aktivitas (MBq): <strong>{activity}</strong></p>
          <p>Densitas Aktivitas (Bq/g): <strong>{density}</strong></p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MietverhaeltnisBearbeiten() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  
  // 1. ADIM: formData içindeki isimler neu.tsx ile aynı olmalı
  const [formData, setFormData] = useState({
    mieterName: '',
    status: 'AKTIV',
    kaution: 0,
    kaltMiete: 0,      // neu.tsx'deki gibi
    nebenkosten: 0,    // neu.tsx'deki gibi
    startDatum: '',
    endeDatum: ''
  });

  useEffect(() => {
    if (id) {
      fetch(`/api/mietverhaeltnisse/${id}`)
        .then(res => res.json())
        .then(data => {
          // 2. ADIM: API'den gelen veriyi state'e dolduruyoruz
          setFormData({
            mieterName: data.mieterName || '',
            status: data.status || 'AKTIV',
            kaution: data.kaution || 0,
            kaltMiete: data.kaltMiete || 0,
            nebenkosten: data.nebenkosten || 0,
            startDatum: data.startDatum ? data.startDatum.split('T')[0] : '',
            endeDatum: data.endeDatum ? data.endeDatum.split('T')[0] : ''
          });
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`/api/mietverhaeltnisse/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/mietverhaeltnisse/${id}`);
      } else {
        alert('Hata: Kaydedilemedi');
      }
    } catch (error) {
      alert('Sistem hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 uppercase">Mietverhältnis bearbeiten</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg">
        
        {/* Mieter Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Mieter Name</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
            value={formData.mieterName} 
            onChange={e => setFormData({...formData, mieterName: e.target.value})} 
          />
        </div>

        {/* KALTMIETE & NEBENKOSTEN (Senin aradığın 2 kutu burada) */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Kaltmiete (€)</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
              value={formData.kaltMiete} 
              onChange={e => setFormData({...formData, kaltMiete: Number(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Nebenkosten (€)</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
              value={formData.nebenkosten} 
              onChange={e => setFormData({...formData, nebenkosten: Number(e.target.value)})} 
            />
          </div>
        </div>

        {/* Tarihler ve Diğerleri */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Kaution (€)</label>
            <input 
              type="number" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.kaution} 
              onChange={e => setFormData({...formData, kaution: Number(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Status</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="AKTIV">Aktiv</option>
              <option value="GEENDET">Geendet</option>
            </select>
          </div>
        </div>

        <div className="pt-6 flex gap-4">
          <button type="button" onClick={() => router.back()} className="flex-1 px-6 py-4 border rounded-xl font-bold">Abbrechen</button>
          <button type="submit" disabled={loading} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold">
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
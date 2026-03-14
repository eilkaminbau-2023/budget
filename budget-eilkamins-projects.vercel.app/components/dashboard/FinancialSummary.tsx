import Link from 'next/link'

interface FinancialSummaryProps {
  sollMiete: number;        // Tüm mietobjekt'lerin toplam kirası
  adminGezahlt: number;      // Admin'in ödediği toplam
  adminOffen: number;        // Kalan (Soll - Gezahlt)
}

export default function FinancialSummary({ 
  sollMiete = 0,
  adminGezahlt = 0,
  adminOffen = 0
}: FinancialSummaryProps) {
  
  const bezahltProzent = sollMiete > 0 ? (adminGezahlt / sollMiete) * 100 : 0
  const offenProzent = sollMiete > 0 ? (adminOffen / sollMiete) * 100 : 0

  return (
    <Link href="/admin-zahlungen">
      <div className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-all hover:bg-gray-50">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Finanzielle Übersicht (Admin)</h2>
        
        <div className="space-y-6">
          {/* Progress Bar - Admin ödemeleri */}
          <div>
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-gray-600">Admin Gezahlt vs. Offen</span>
              <span className="text-gray-900">
                {bezahltProzent.toFixed(1)}% / {offenProzent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 flex overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-500" 
                style={{ width: `${bezahltProzent}%` }}
              />
              <div 
                className="bg-red-500 h-full transition-all duration-500" 
                style={{ width: `${offenProzent}%` }}
              />
            </div>
          </div>

          {/* Rakamlar - Admin ödemeleri */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-semibold">Soll-Miete</p>
              <p className="text-xl font-bold text-gray-900">
                {sollMiete.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-semibold">Admin Gezahlt</p>
              <p className="text-xl font-bold text-green-600">
                {adminGezahlt.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-semibold">Admin Offen</p>
              <p className="text-xl font-bold text-red-600">
                {adminOffen.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
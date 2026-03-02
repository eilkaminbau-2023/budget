import Link from 'next/link'
import { DashboardProps } from './types'

interface WarningCardsProps {
  data: DashboardProps
  showNurUeberfaellig: boolean
  showNurBaldAblaufend: boolean
}

export default function WarningCards({ 
  data, 
  showNurUeberfaellig, 
  showNurBaldAblaufend 
}: WarningCardsProps) {
  
  // Filtrelenmiş veriler - Güvenli erişim için ?. ve || [] kullanıldı
  const gefilterteUeberfaellige = showNurUeberfaellig 
    ? data.ueberfaelligeZahlungen?.filter(o => o.tageUeberfaellig > 0) || []
    : data.ueberfaelligeZahlungen || []

  const gefilterteAuslaufende = showNurBaldAblaufend
    ? data.auslaufendeVertraege?.filter(v => v.tageBisAblauf <= 30) || []
    : data.auslaufendeVertraege || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* Vadesi Geçmiş Ödemeler */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-600">⚠️ Überfällige Zahlungen</h2>
          <Link href="/zahlungen/offen" className="text-sm text-blue-600 hover:underline">
            Alle anzeigen
          </Link>
        </div>
        
        {gefilterteUeberfaellige.length > 0 ? (
          <div className="space-y-3">
            {gefilterteUeberfaellige.map((zahlung) => (
              <div key={zahlung.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <Link href={`/zahlungen/${zahlung.id}`} className="font-medium hover:text-blue-600">
                    {zahlung.mietobjekt}
                  </Link>
                  <span className="text-red-600 font-bold">
                    {zahlung.tageUeberfaellig} Tage
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                  <span>{zahlung.mieter}</span>
                  <span className="font-medium">{zahlung.betrag?.toFixed(2) || '0.00'} €</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Keine überfälligen Zahlungen
          </p>
        )}
      </div>

      {/* Bald ablaufende Verträge */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-yellow-600">📅 Bald ablaufende Verträge</h2>
          <Link href="/mietverhaeltnisse" className="text-sm text-blue-600 hover:underline">
            Alle anzeigen
          </Link>
        </div>
        
        {gefilterteAuslaufende.length > 0 ? (
          <div className="space-y-3">
            {gefilterteAuslaufende.map((vertrag) => (
              <div key={vertrag.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <Link href={`/mietverhaeltnisse/${vertrag.id}`} className="font-medium hover:text-blue-600">
                    {vertrag.mietobjekt}
                  </Link>
                  <span className={`font-bold ${
                    vertrag.tageBisAblauf <= 7 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {vertrag.tageBisAblauf} Tage
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Mieter: {vertrag.mieter}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Keine bald ablaufenden Verträge
          </p>
        )}
      </div>

      {/* Leere Mietobjekte */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-600">🏠 Freie Mietobjekte</h2>
          <Link href="/mietobjekte" className="text-sm text-blue-600 hover:underline">
            Alle anzeigen
          </Link>
        </div>
        
        {data.leerstehendeObjekte?.length > 0 ? (
          <div className="space-y-3">
            {data.leerstehendeObjekte.map((obj) => (
              <div key={obj.id} className="border-b pb-2 last:border-0">
                <Link href={`/mietobjekte/${obj.id}`} className="block hover:text-blue-600">
                  <div className="flex justify-between">
                    <span className="font-medium">{obj.adresse}</span>
                    <span className="text-gray-600">{obj.gesamtMiete?.toFixed(2) || '0.00'} €</span>
                  </div>
                </Link>
                <div className="text-sm text-gray-600">
                  {/* @ts-ignore - Zimmer und Flaeche sind optional in der Datenbank */}
                  {obj.zimmer || '?'} Zimmer · {obj.flaeche || '?'} m²
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Keine freien Mietobjekte
          </p>
        )}
      </div>
    </div>
  )
}
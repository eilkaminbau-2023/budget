import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { useRouter } from 'next/router'

const authOptions = nextAuthOptions as NextAuthOptions

export default function OffeneDetails({ 
  mietverhaeltnis, 
  zahlungen,
  zusammenfassung 
}: { 
  mietverhaeltnis: any,
  zahlungen: any[],
  zusammenfassung: any
}) {
  const router = useRouter()

  // Zahlungen nach Monat gruppieren - basierend auf betrifftMonat
  const zahlungenNachMonat = zahlungen.reduce((acc: any, zahlung: any) => {
    // 🔥 Neu: Verwende betrifftMonat für Gruppierung, fallback auf zahlungsdatum
    const monatKey = zahlung.betrifftMonat || 
      `${new Date(zahlung.zahlungsdatum).getFullYear()}-${String(new Date(zahlung.zahlungsdatum).getMonth() + 1).padStart(2, '0')}`
    
    const [jahr, mon] = monatKey.split('-')
    const monatName = new Date(parseInt(jahr), parseInt(mon)-1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    
    if (!acc[monatKey]) {
      acc[monatKey] = {
        monatName,
        zahlungen: [],
        toplam: 0
      }
    }
    acc[monatKey].zahlungen.push(zahlung)
    acc[monatKey].toplam += zahlung.betrag
    return acc
  }, {})

  // Monate sortieren (neueste zuerst)
  const sortedMonate = Object.keys(zahlungenNachMonat).sort().reverse()

  // Kumulierte Schulden berechnen
  const monatlicheMiete = zusammenfassung.monatlicheMiete
  let kumulierteSchulden = 0
  const monateMitSchulden = sortedMonate.map(monatKey => {
    const soll = monatlicheMiete
    const gezahltInMonat = zahlungenNachMonat[monatKey].toplam
    const differenz = soll - gezahltInMonat
    
    // Vorherige Schulden + aktuelle Differenz
    kumulierteSchulden = kumulierteSchulden + differenz
    
    return {
      ...zahlungenNachMonat[monatKey],
      monatKey,
      soll,
      gezahltInMonat,
      differenz,
      uebertrag: kumulierteSchulden - differenz, // Schulden vor diesem Monat
      kumuliert: kumulierteSchulden
    }
  })

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Zurück
        </button>
        
        <h1 className="text-3xl font-extrabold text-gray-900">Zahlungsverlauf</h1>
        <p className="text-lg text-gray-600 mt-2">
          {mietverhaeltnis.mietobjekt.adresse}
        </p>
        <p className="text-md text-gray-500">
          Mieter: {mietverhaeltnis.mieter.name || mietverhaeltnis.mieter.email}
        </p>
      </div>

      {/* Zusammenfassung */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Zusammenfassung</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Monatliche Miete</p>
            <p className="text-2xl font-bold text-blue-600">{zusammenfassung.monatlicheMiete} €</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Bereits gezahlt</p>
            <p className="text-2xl font-bold text-green-600">{zusammenfassung.gezahlt} €</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Offener Betrag</p>
            <p className="text-2xl font-bold text-red-600">{zusammenfassung.offen} €</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Kumulierte Schulden</p>
            <p className="text-2xl font-bold text-purple-600">{kumulierteSchulden} €</p>
          </div>
        </div>
      </div>

      {/* Zahlungshistorie nach Monaten mit kumulierten Schulden */}
      <div className="space-y-6">
        {monateMitSchulden.map((monat) => (
          <div key={monat.monatKey} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  {monat.monatName}
                </h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Soll: {monat.soll} €</p>
                  {monat.uebertrag !== 0 && (
                    <p className="text-xs text-orange-600">Übertrag: {monat.uebertrag} €</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-2">Datum</th>
                    <th className="pb-2">Für Monat</th>
                    <th className="pb-2">Betrag</th>
                    <th className="pb-2">Methode</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monat.zahlungen.map((zahlung: any) => (
                    <tr key={zahlung.id} className="border-t border-gray-100">
                      <td className="py-3">
                        {new Date(zahlung.zahlungsdatum).toLocaleDateString('de-DE')}
                      </td>
                      <td className="py-3">
                        {zahlung.betrifftMonat ? 
                          new Date(zahlung.betrifftMonat + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) 
                          : '-'
                        }
                      </td>
                      <td className="py-3 font-medium">{zahlung.betrag} €</td>
                      <td className="py-3 text-gray-600">{zahlung.methode}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          zahlung.status === 'BEZAHLT' 
                            ? 'bg-green-100 text-green-800' 
                            : zahlung.status === 'AUSSTEHEND'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {zahlung.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Monatssumme:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {monat.gezahltInMonat} €
                  </span>
                </div>
                {monat.differenz !== 0 && (
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-gray-600">Differenz:</span>
                    <span className={`font-bold ${monat.differenz > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {monat.differenz > 0 ? '-' : '+'} {Math.abs(monat.differenz)} €
                    </span>
                  </div>
                )}
                {monat.kumuliert !== 0 && (
                  <div className="flex justify-between items-center mt-1 text-sm border-t border-dotted border-gray-200 pt-2">
                    <span className="font-bold text-gray-700">Kumulierte Schulden:</span>
                    <span className={`font-bold ${monat.kumuliert > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {monat.kumuliert} €
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {zahlungen.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <p className="text-gray-500 text-lg">Keine Zahlungen vorhanden</p>
            <Link href={`/zahlungen/neu?mietverhaeltnisId=${mietverhaeltnis.id}`}>
              <button className="mt-4 bg-[#1a237e] text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900">
                Erste Zahlung erfassen
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href={`/zahlungen/neu?mietverhaeltnisId=${mietverhaeltnis.id}`}>
          <button className="bg-[#1a237e] text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-900 transition-all">
            + Neue Zahlung erfassen
          </button>
        </Link>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/anmelden', permanent: false } }

  const { mietverhaeltnisId } = context.query

  if (!mietverhaeltnisId || typeof mietverhaeltnisId !== 'string') {
    return { notFound: true }
  }

  // Mietverhaeltnis bilgilerini al
  const mietverhaeltnis = await prisma.mietverhaeltnis.findUnique({
    where: { id: mietverhaeltnisId },
    include: {
      mietobjekt: true,
      mieter: true
    }
  })

  if (!mietverhaeltnis) {
    return { notFound: true }
  }

  // Bu mietverhaeltnis'e ait tüm ödemeleri al
  const zahlungen = await prisma.zahlung.findMany({
    where: { mietverhaeltnisId: mietverhaeltnisId },
    orderBy: { zahlungsdatum: 'desc' }
  })

  // Zusammenfassung hesapla
  const monatlicheMiete = mietverhaeltnis.mietobjekt?.gesamtMiete || 0
  const gezahlt = zahlungen.reduce((sum, z) => sum + (z.betrag || 0), 0)
  const offen = monatlicheMiete - gezahlt

  return {
    props: {
      mietverhaeltnis: JSON.parse(JSON.stringify(mietverhaeltnis)),
      zahlungen: JSON.parse(JSON.stringify(zahlungen)),
      zusammenfassung: {
        monatlicheMiete,
        gezahlt,
        offen
      }
    }
  }
}
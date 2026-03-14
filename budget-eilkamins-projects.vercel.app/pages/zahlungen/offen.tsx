import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const authOptions = nextAuthOptions as NextAuthOptions

export default function OffeneZahlungen({ offeneZahlungen }: { offeneZahlungen: any[] }) {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Offene Zahlungen</h1>
        <Link href="/zahlungen" className="w-full sm:w-auto">
          <button className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-gray-700 transition-all text-sm md:text-base">
            Alle Zahlungen
          </button>
        </Link>
      </div>

      {/* --- MASAÜSTÜ GÖRÜNÜMÜ (Bilgisayarda görünür, Mobilde GİZLENİR) --- */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Objekt / Mieter</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Fällig am</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Monatsmiete</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Bereits gezahlt</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Offen (gesamt)</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {offeneZahlungen.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {item.adresse} <br/><span className="text-sm text-gray-500">{item.mieter}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(item.faelligAm).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 font-bold">{item.monatsmiete} €</td>
                <td className="px-6 py-4 font-bold text-green-600">{item.gezahlt} €</td>
                <td className="px-6 py-4 font-bold text-red-600">{item.offenGesamt} €</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/zahlungen/neu?mietverhaeltnisId=${item.mietverhaeltnisId}`}>
                      <button className="text-blue-600 hover:underline text-sm font-medium">
                        Zahlung erfassen
                      </button>
                    </Link>
                    <Link href={`/zahlungen/offenedetails?mietverhaeltnisId=${item.mietverhaeltnisId}`}>
                      <button className="text-green-600 hover:underline text-sm font-medium ml-2">
                        Details
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBİL GÖRÜNÜM (Bilgisayarda GİZLENİR, Mobilde GÖRÜNÜR) --- */}
      <div className="md:hidden space-y-4">
        {offeneZahlungen.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Keine offenen Zahlungen gefunden.</p>
        ) : (
          offeneZahlungen.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              {/* Başlık: Adres */}
              <div className="border-b border-gray-100 pb-3 mb-3">
                <h3 className="font-bold text-gray-900 leading-tight">{item.adresse}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.mieter}</p>
              </div>

              {/* Bilgiler: Grid yapısı (2 sütun) */}
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">Fällig am:</div>
                <div className="text-right font-medium text-gray-700">
                  {new Date(item.faelligAm).toLocaleDateString('de-DE')}
                </div>

                <div className="text-gray-500">Miete:</div>
                <div className="text-right font-semibold text-gray-900">{item.monatsmiete} €</div>

                <div className="text-gray-500">Gezahlt:</div>
                <div className="text-right font-bold text-green-600">{item.gezahlt} €</div>

                <div className="text-gray-500">Offen:</div>
                <div className="text-right font-extrabold text-red-600 text-lg">{item.offenGesamt} €</div>
              </div>

              {/* Butonlar: Alt alta tam genişlik */}
              <div className="mt-5 flex flex-col gap-2">
                <Link href={`/zahlungen/neu?mietverhaeltnisId=${item.mietverhaeltnisId}`} className="w-full">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm shadow-sm active:bg-blue-700">
                    Zahlung erfassen
                  </button>
                </Link>
                <Link href={`/zahlungen/offenedetails?mietverhaeltnisId=${item.mietverhaeltnisId}`} className="w-full">
                  <button className="w-full bg-white text-gray-700 border border-gray-300 py-3 rounded-lg font-bold text-sm">
                    Details
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/anmelden', permanent: false } }

  // Prisma schema'ya göre: Mietverhaeltnis modeli
  // - status: MietverhaeltnisStatus (AKTIV, BEENDET, GEKUENDIGT)
  // - startDatum: DateTime
  // - mietobjekt: Mietobjekt (adresse, gesamtMiete)
  // - mieter: Benutzer (name, email)
  // - zahlungen: Zahlung[] (betrag, zahlungsdatum, status, methode)
  
  const aktiveVertraege = await prisma.mietverhaeltnis.findMany({
    where: { status: 'AKTIV' },
    include: { 
      mietobjekt: true, 
      mieter: true,
      zahlungen: {
        orderBy: { zahlungsdatum: 'asc' }
      }
    }
  })

  // Her sözleşme için aylık bazda ödenmemiş miktarları hesapla
  const offeneZahlungen = aktiveVertraege.map(vertrag => {
    const monatsmiete = vertrag.mietobjekt?.gesamtMiete || 0
    const startDatum = vertrag.startDatum ? new Date(vertrag.startDatum) : new Date()
    const heute = new Date()
    
    // Sözleşmenin başlangıcından bugüne kadar geçen ay sayısı
    const aylar: Date[] = []
    const currentDate = new Date(startDatum)
    
    while (currentDate <= heute) {
      aylar.push(new Date(currentDate))
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    // Eğer hiç ay geçmemişse (yeni sözleşme), en az 1 ay göster
    if (aylar.length === 0 && startDatum <= heute) {
      aylar.push(new Date(startDatum))
    }
    
    // Ödemeleri aylara dağıt
    const aylikOdemeler: { [key: string]: number } = {}
    
    // Her ay için başlangıç değeri 0
    aylar.forEach(ay => {
      const ayYil = `${ay.getFullYear()}-${String(ay.getMonth() + 1).padStart(2, '0')}`
      aylikOdemeler[ayYil] = 0
    })
    
    // Ödemeleri ait oldukları aya ekle
    vertrag.zahlungen.forEach(zahlung => {
      const tarih = zahlung.zahlungsdatum ? new Date(zahlung.zahlungsdatum) : new Date()
      const ayYil = `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, '0')}`
      if (aylikOdemeler[ayYil] !== undefined) {
        aylikOdemeler[ayYil] += zahlung.betrag || 0
      }
    })
    
    // Her ay için kalanı hesapla ve topla
    let kalanToplam = 0
    aylar.forEach(ay => {
      const ayYil = `${ay.getFullYear()}-${String(ay.getMonth() + 1).padStart(2, '0')}`
      const odenen = aylikOdemeler[ayYil] || 0
      const kalan = monatsmiete - odenen
      if (kalan > 0) {
        kalanToplam += kalan
      }
    })
    
    // Toplam ödenen miktar
    const gezahlt = vertrag.zahlungen.reduce((sum, z) => sum + (z.betrag || 0), 0)
    
    return {
      id: vertrag.id,
      mietverhaeltnisId: vertrag.id,
      adresse: vertrag.mietobjekt?.adresse || 'Unbekannt',
      mieter: vertrag.mieter?.name || vertrag.mieter?.email || 'Unbekannt',
      monatsmiete: monatsmiete,
      gezahlt: gezahlt,
      offenGesamt: kalanToplam,
      faelligAm: vertrag.startDatum || new Date()
    }
  }).filter(v => v.offenGesamt > 0) // Sadece ödenmemiş kısmı olanları göster

  return {
    props: {
      offeneZahlungen: JSON.parse(JSON.stringify(offeneZahlungen))
    }
  }
}
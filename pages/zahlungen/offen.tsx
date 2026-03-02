import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const authOptions = nextAuthOptions as NextAuthOptions

export default function OffeneZahlungen({ offeneZahlungen }: { offeneZahlungen: any[] }) {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Offene Zahlungen</h1>
        <Link href="/zahlungen">
          <button className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-gray-700 transition-all">
            Alle Zahlungen
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Objekt / Mieter</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Fällig am</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Kira</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Ödenen</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Kalan</th>
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
                <td className="px-6 py-4 font-bold">{item.kira} €</td>
                <td className="px-6 py-4 font-bold text-green-600">{item.odenen} €</td>
                <td className="px-6 py-4 font-bold text-red-600">{item.kalan} €</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/zahlungen/neu?mietverhaeltnisId=${item.mietverhaeltnisId}`}>
                    <button className="text-blue-600 hover:underline text-sm font-medium">
                      Zahlung erfassen
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/anmelden', permanent: false } }

  // Tüm aktif mietverhaeltnisse'leri al
  const aktiveVertraege = await prisma.mietverhaeltnis.findMany({
    where: { status: 'AKTIV' },
    include: { 
      mietobjekt: true, 
      mieter: true,
      zahlungen: true
    }
  })

  // Kira tamamen ödenene kadar listede göster
  const offeneZahlungen = aktiveVertraege
    .filter(v => {
      const odenenToplam = v.zahlungen.reduce((sum, z) => sum + (z.betrag || 0), 0);
      const kira = v.mietobjekt?.gesamtMiete || 0;
      
      // Kira tamamen ödenmemişse listele (ödenen < kira)
      return odenenToplam < kira;
    })
    .map(v => {
      const odenenToplam = v.zahlungen.reduce((sum, z) => sum + (z.betrag || 0), 0);
      const kira = v.mietobjekt?.gesamtMiete || 0;
      const kalan = kira - odenenToplam;
      
      return {
        id: v.id,
        mietverhaeltnisId: v.id,
        adresse: v.mietobjekt?.adresse || 'Unbekannt',
        mieter: v.mieter?.name || 'Unbekannt',
        kira: kira,
        odenen: odenenToplam,
        kalan: kalan,
        faelligAm: v.startDatum || new Date()
      }
    })

  return {
    props: {
      offeneZahlungen: JSON.parse(JSON.stringify(offeneZahlungen))
    }
  }
}
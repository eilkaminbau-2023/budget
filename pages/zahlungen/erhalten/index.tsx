import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
// 🔥 YOL DÜZELTİLDİ: ../../api/auth/[...nextauth] oldu
import nextAuthOptions from '../../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

const authOptions = nextAuthOptions as NextAuthOptions

export default function ErhalteneZahlungen({ erhalteneListe }: { erhalteneListe: any[] }) {
  const router = useRouter()
  const [suchbegriff, setSuchbegriff] = useState('')

  // Filtreleme
  const gefilterteListe = erhalteneListe.filter(item => 
    item.adresse.toLowerCase().includes(suchbegriff.toLowerCase()) ||
    item.mieter.toLowerCase().includes(suchbegriff.toLowerCase())
  )

  // Toplam ödemeleri hesapla
  const gesamtSumme = gefilterteListe.reduce((sum, item) => sum + item.erhaltenGesamt, 0)

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
            >
              ← Zurück
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Erhaltene Zahlungen</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Detaillierte Übersicht der verbuchten Mieten</p>
        </div>
        <Link href="/zahlungen" className="w-full sm:w-auto">
          <button className="w-full bg-[#1a237e] text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-900 transition-all text-sm">
            Alle Zahlungen
          </button>
        </Link>
      </div>

      {/* Arama filtresi */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Adresse oder Mieter suchen..."
          value={suchbegriff}
          onChange={(e) => setSuchbegriff(e.target.value)}
          className="w-full md:w-96 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* SADECE LİSTE GÖRÜNÜMÜ */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Adresse</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Mieter</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Erhalten Gesamt</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gefilterteListe.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5 font-medium text-gray-900">{item.adresse}</td>
                <td className="px-6 py-5 text-gray-700">{item.mieter}</td>
                <td className="px-6 py-5 font-bold text-green-600">
                  {item.erhaltenGesamt.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-6 py-5 text-right">
                  {/* 🔥 LİNK DEĞİŞTİ: details.tsx sayfasına yönlendir */}
                  <Link href={`/zahlungen/erhalten/details?mietobjektId=${item.mietobjektId}`}>
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-bold transition-colors">
                      Details
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Toplam satırı */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-700">
                SUMME:
              </td>
              <td className="px-6 py-4 font-bold text-green-700 text-lg">
                {gesamtSumme.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Boş liste durumu */}
      {gefilterteListe.length === 0 && (
        <div className="bg-white p-10 rounded-xl text-center shadow-sm border border-gray-200">
          <p className="text-gray-500">Keine erhaltenen Zahlungen gefunden.</p>
        </div>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/anmelden', permanent: false } }

  // Tüm ödemeleri getir, mietverhaeltnis bilgileriyle birlikte
  const alleZahlungen = await prisma.zahlung.findMany({
    where: {
      status: 'BEZAHLT'
    },
    include: {
      mietverhaeltnis: {
        include: {
          mietobjekt: true,
          mieter: true
        }
      }
    },
    orderBy: {
      zahlungsdatum: 'desc'
    }
  })

  // Ödemeleri mietverhaeltnis'e göre grupla
  const gruppiert = alleZahlungen.reduce((acc: any, zahlung) => {
    const mietverhaeltnisId = zahlung.mietverhaeltnisId;
    if (!mietverhaeltnisId) return acc;
    
    if (!acc[mietverhaeltnisId]) {
      acc[mietverhaeltnisId] = {
        id: mietverhaeltnisId,
        mietobjektId: zahlung.mietverhaeltnis?.mietobjekt?.id || '',
        adresse: zahlung.mietverhaeltnis?.mietobjekt?.adresse || 'Unbekannt',
        mieter: zahlung.mietverhaeltnis?.mieter?.name || 'Unbekannt',
        erhaltenGesamt: 0,
        zahlungen: []
      };
    }
    
    acc[mietverhaeltnisId].zahlungen.push(zahlung);
    acc[mietverhaeltnisId].erhaltenGesamt += zahlung.betrag || 0;
    
    return acc;
  }, {});

  const erhalteneListe = Object.values(gruppiert);

  return {
    props: {
      erhalteneListe: JSON.parse(JSON.stringify(erhalteneListe))
    }
  }
}
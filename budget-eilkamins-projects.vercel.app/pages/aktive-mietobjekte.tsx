import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'
import nextAuthOptions from './api/auth/[...nextauth]'
import Link from 'next/link'
import { useState } from 'react'

const authOptions = nextAuthOptions as NextAuthOptions

interface AktivesMietobjekt {
  id: string
  adresse: string
  zimmer: number | null
  flaeche: number | null
  kaltMiete: number
  nebenkosten: number
  gesamtMiete: number
  mieter: {
    name: string | null
    email: string
  } | null
  startDatum: string
  endeDatum: string | null
}

export default function AktiveMietobjekte({ objekte }: { objekte: AktivesMietobjekt[] }) {
  const [suchbegriff, setSuchbegriff] = useState('')

  // Filtreleme
  const gefilterteObjekte = objekte.filter(obj => 
    obj.adresse.toLowerCase().includes(suchbegriff.toLowerCase()) ||
    obj.mieter?.name?.toLowerCase().includes(suchbegriff.toLowerCase())
  )

  // Toplam hesaplama
  const totalKaltMiete = gefilterteObjekte.reduce((sum, obj) => sum + obj.kaltMiete, 0)
  const totalNebenkosten = gefilterteObjekte.reduce((sum, obj) => sum + obj.nebenkosten, 0)
  const totalGesamtMiete = gefilterteObjekte.reduce((sum, obj) => sum + obj.gesamtMiete, 0)

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
              ← Zurück zum Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              Aktive Mietobjekte
            </h1>
            <p className="text-gray-500 mt-1">
              {gefilterteObjekte.length} Objekt(e) aktuell vermietet
            </p>
          </div>
          
          {/* Arama */}
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Suchen..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Liste - Tablo görünümü */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Adresse</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Mieter</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Zimmer</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Fläche</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Kaltmiete</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Nebenkosten</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Gesamt</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Vertrag seit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gefilterteObjekte.map((obj) => (
              <tr key={obj.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link href={`/mietobjekte/${obj.id}`} className="text-blue-600 hover:underline">
                    {obj.adresse}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {obj.mieter ? (
                    <Link href={`/mietverhaeltnisse?mieterId=${obj.mieter.id}`} className="hover:underline">
                      {obj.mieter.name || obj.mieter.email}
                    </Link>
                  ) : (
                    'Kein Mieter'
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">{obj.zimmer || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{obj.flaeche ? `${obj.flaeche} m²` : '-'}</td>
                <td className="px-6 py-4 text-gray-600">{obj.kaltMiete.toLocaleString('de-DE')} €</td>
                <td className="px-6 py-4 text-gray-600">{obj.nebenkosten.toLocaleString('de-DE')} €</td>
                <td className="px-6 py-4 font-bold text-blue-600">{obj.gesamtMiete.toLocaleString('de-DE')} €</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(obj.startDatum).toLocaleDateString('de-DE')}
                </td>
              </tr>
            ))}
          </tbody>
          {/* 🔥 TOPLAM SATIRI */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-700">
                SUMME:
              </td>
              <td className="px-6 py-4 font-bold text-gray-900">{totalKaltMiete.toLocaleString('de-DE')} €</td>
              <td className="px-6 py-4 font-bold text-gray-900">{totalNebenkosten.toLocaleString('de-DE')} €</td>
              <td className="px-6 py-4 font-bold text-blue-700 text-lg">{totalGesamtMiete.toLocaleString('de-DE')} €</td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobil görünüm (isteğe bağlı) */}
      {gefilterteObjekte.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">Keine aktiven Mietobjekte gefunden.</p>
        </div>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return {
      redirect: {
        destination: '/auth/anmelden',
        permanent: false,
      },
    }
  }

  // Sadece AKTİF sözleşmesi olan mietobjekte'leri getir
  const aktiveVertraege = await prisma.mietverhaeltnis.findMany({
    where: { status: 'AKTIV' },
    include: {
      mietobjekt: true,
      mieter: true
    },
    orderBy: {
      mietobjekt: {
        adresse: 'asc'
      }
    }
  })

  // Veriyi düzenle
  const objekte = aktiveVertraege.map(v => ({
    id: v.mietobjekt!.id,
    adresse: v.mietobjekt!.adresse,
    zimmer: v.mietobjekt!.zimmer,
    flaeche: v.mietobjekt!.flaeche,
    kaltMiete: v.mietobjekt!.kaltMiete || 0,
    nebenkosten: v.mietobjekt!.nebenkosten || 0,
    gesamtMiete: v.mietobjekt!.gesamtMiete || 0,
    mieter: v.mieter ? {
      id: v.mieter.id,
      name: v.mieter.name,
      email: v.mieter.email
    } : null,
    startDatum: v.startDatum?.toISOString() || new Date().toISOString(),
    endeDatum: v.endeDatum?.toISOString() || null
  }))

  return {
    props: {
      objekte: JSON.parse(JSON.stringify(objekte))
    }
  }
}
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'

const authOptions = nextAuthOptions as NextAuthOptions

export default function Zahlungen({ zahlungen, aktiveVertraege }: { zahlungen: any[], aktiveVertraege: any[] }) {
  const router = useRouter()
  const [suchbegriff, setSuchbegriff] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALLE')

  useEffect(() => {
    if (router.isReady && router.query.status) {
      setStatusFilter(router.query.status as string)
    }
  }, [router.isReady, router.query.status])

  const displayList = useMemo(() => {
    let list = zahlungen.map(z => {
      const vertrag = aktiveVertraege.find(v => v.id === z.mietverhaeltnisId);
      return {
        id: z.id,
        adresse: vertrag?.mietobjekt?.adresse || 'Unbekannt',
        mieter: vertrag?.mieter?.name || 'Unbekannt',
        soll: vertrag?.mietobjekt?.gesamtMiete || 0,
        ist: z.betrag,
        datum: new Date(z.zahlungsdatum).toLocaleDateString('de-DE'),
        status: z.status,
        methode: z.methode,
        betrifftMonat: z.betrifftMonat  // 🔥 YENİ ALAN
      }
    });

    if (statusFilter !== 'ALLE') {
      list = list.filter(item => item.status === statusFilter);
    }

    if (suchbegriff) {
      list = list.filter(item => 
        item.adresse.toLowerCase().includes(suchbegriff.toLowerCase()) ||
        item.mieter.toLowerCase().includes(suchbegriff.toLowerCase())
      );
    }

    return list;
  }, [zahlungen, aktiveVertraege, suchbegriff, statusFilter]);

  // Status Renk Yardımcısı
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'BEZAHLT': return 'bg-green-100 text-green-800';
      case 'AUSSTEHEND': return 'bg-orange-100 text-orange-800';
      case 'VERSPAETET': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // 🔥 Monat formatlayıcı
  const formatMonat = (monat: string) => {
    if (!monat) return '-';
    const [jahr, mon] = monat.split('-');
    return new Date(monat + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Zahlungsübersicht</h1>
        <Link href="/zahlungen/neu" className="w-full sm:w-auto">
          <button className="w-full bg-[#1a237e] text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-900 transition-all text-sm">
            + Neue Zahlung
          </button>
        </Link>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm mb-8 border border-gray-200 flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Suche nach Objekt oder Mieter..." 
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={suchbegriff}
          onChange={(e) => setSuchbegriff(e.target.value)}
        />
        <select 
          className="border border-gray-300 rounded-lg px-4 py-2.5 outline-none bg-white text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALLE">Alle Status</option>
          <option value="BEZAHLT">Bezahlt</option>
          <option value="AUSSTEHEND">Ausstehend</option>
          <option value="VERSPAETET">Verspätet</option>
        </select>
      </div>

      {/* --- MASAÜSTÜ GÖRÜNÜMÜ --- */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Objekt / Mieter</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Datum</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Betrifft Monat</th> {/* 🔥 YENİ SÜTUN */}
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase text-right">Ist / Soll</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayList.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {item.adresse} <br/><span className="text-sm text-gray-500">{item.mieter}</span>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">{item.datum}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{formatMonat(item.betrifftMonat)}</td> {/* 🔥 YENİ HÜCRE */}
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getStatusStyle(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-green-600">{item.ist} €</span>
                  <span className="text-gray-400 text-xs ml-1">/ {item.soll} €</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/zahlungen/${item.id}`}>
                    <button className="text-blue-600 hover:underline text-sm font-medium">Details</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBİL GÖRÜNÜMÜ --- */}
      <div className="md:hidden space-y-4">
        {displayList.length === 0 ? (
          <p className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200">Keine Zahlungen gefunden.</p>
        ) : (
          displayList.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{item.adresse}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.mieter}</p>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${getStatusStyle(item.status)}`}>
                  {item.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="text-gray-500">Datum:</div>
                <div className="text-right font-medium text-gray-700">{item.datum}</div>

                {/* 🔥 YENİ: Mobilde Betrifft Monat */}
                <div className="text-gray-500">Betrifft:</div>
                <div className="text-right font-medium text-gray-700">{formatMonat(item.betrifftMonat)}</div>

                <div className="text-gray-500">Soll-Miete:</div>
                <div className="text-right font-semibold text-gray-900">{item.soll} €</div>

                <div className="text-gray-500 font-bold">Gezahlter Betrag:</div>
                <div className="text-right font-extrabold text-green-600 text-lg">{item.ist} €</div>
                
                {item.methode && (
                  <>
                    <div className="text-gray-500">Methode:</div>
                    <div className="text-right text-gray-700 italic">{item.methode}</div>
                  </>
                )}
              </div>

              <div className="mt-5">
                <Link href={`/zahlungen/${item.id}`} className="w-full">
                  <button className="w-full bg-white text-gray-700 border border-gray-300 py-3 rounded-lg font-bold text-sm shadow-sm active:bg-gray-50">
                    Details anzeigen
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

  const [zahlungen, aktiveVertraege] = await Promise.all([
    prisma.zahlung.findMany({ orderBy: { zahlungsdatum: 'desc' } }),
    prisma.mietverhaeltnis.findMany({ 
      include: { mietobjekt: true, mieter: true } 
    })
  ])

  return {
    props: {
      zahlungen: JSON.parse(JSON.stringify(zahlungen)),
      aktiveVertraege: JSON.parse(JSON.stringify(aktiveVertraege))
    }
  }
}
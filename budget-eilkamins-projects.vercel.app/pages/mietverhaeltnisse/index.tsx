import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'
import nextAuthOptions from '../api/auth/[...nextauth]'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

const authOptions = nextAuthOptions as NextAuthOptions

interface Mietverhaeltnis {
  id: string
  startDatum: string
  endeDatum: string | null
  status: string
  mieter: { name: string } | null
  mietobjekt: { adresse: string }
}

export default function Mietverhaeltnisse({ verhaeltnisse }: { verhaeltnisse: Mietverhaeltnis[] }) {
  const router = useRouter()
  
  const [suchbegriff, setSuchbegriff] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALLE')
  const [sortierung, setSortierung] = useState('datum_ab')

  // MANTIK: Filtreleme ve sıralama dokunulmadan aynı kaldı
  const gefilterteVerhaeltnisse = verhaeltnisse
    .filter(v => {
      const matchesSearch = 
        (v.mieter?.name?.toLowerCase() || "").includes(suchbegriff.toLowerCase()) || 
        (v.mietobjekt?.adresse?.toLowerCase() || "").includes(suchbegriff.toLowerCase())
      
      if (suchbegriff && !matchesSearch) return false
      if (statusFilter !== 'ALLE' && v.status !== statusFilter) return false
      
      return true
    })
    .sort((a, b) => {
      switch(sortierung) {
        case 'mieter':
          return (a.mieter?.name || "").localeCompare(b.mieter?.name || "")
        case 'adresse':
          return a.mietobjekt.adresse.localeCompare(b.mietobjekt.adresse)
        case 'datum_ab':
          return new Date(b.startDatum).getTime() - new Date(a.startDatum).getTime()
        case 'datum_auf':
          return new Date(a.startDatum).getTime() - new Date(b.startDatum).getTime()
        default:
          return 0
      }
    })

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'AKTIV':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Aktiv</span>
      case 'GEKUENDIGT':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Gekündigt</span>
      case 'BEENDET':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">Beendet</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Mietverhältnisse</h1>
        <Link href="/mietverhaeltnisse/neu">
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm shrink-0">
            Neu
          </button>
        </Link>
      </div>
      
      {/* Filtreleme Alanı - Mobilde Dikey */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Suche</label>
            <input
              type="text"
              placeholder="Mieter oder Adresse..."
              value={suchbegriff}
              onChange={(e) => setSuchbegriff(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="ALLE">Alle</option>
              <option value="AKTIV">Aktiv</option>
              <option value="GEKUENDIGT">Gekündigt</option>
              <option value="BEENDET">Beendet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sortieren</label>
            <select
              value={sortierung}
              onChange={(e) => setSortierung(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="datum_ab">Datum (Neueste)</option>
              <option value="datum_auf">Datum (Älteste)</option>
              <option value="mieter">Mieter (A-Z)</option>
              <option value="adresse">Adresse (A-Z)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSuchbegriff('')
                setStatusFilter('ALLE')
                setSortierung('datum_ab')
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-bold transition-colors h-[38px]"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      {/* MASAÜSTÜ GÖRÜNÜMÜ: Tablo (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Mieter</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Objekt</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Beginn</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Ende</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gefilterteVerhaeltnisse.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{v.mieter?.name || "Kein Mieter"}</td>
                <td className="px-6 py-4 text-gray-600">{v.mietobjekt?.adresse}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(v.startDatum).toLocaleDateString('de-DE')}</td>
                <td className="px-6 py-4 text-gray-600">{v.endeDatum ? new Date(v.endeDatum).toLocaleDateString('de-DE') : '-'}</td>
                <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/mietverhaeltnisse/${v.id}`} className="text-blue-600 hover:underline text-sm font-bold">Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBİL GÖRÜNÜM: Kartlar (md:hidden) */}
      <div className="md:hidden space-y-4">
        {gefilterteVerhaeltnisse.length > 0 ? (
          gefilterteVerhaeltnisse.map((v) => (
            <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-gray-900 leading-tight">{v.mieter?.name || "Kein Mieter"}</h3>
                  <p className="text-xs text-gray-500 mt-1">{v.mietobjekt?.adresse}</p>
                </div>
                {getStatusBadge(v.status)}
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                <div className="text-gray-500">Beginn:</div>
                <div className="text-right font-bold text-gray-900">{new Date(v.startDatum).toLocaleDateString('de-DE')}</div>
                <div className="text-gray-500">Ende:</div>
                <div className="text-right font-bold text-gray-900">{v.endeDatum ? new Date(v.endeDatum).toLocaleDateString('de-DE') : '-'}</div>
              </div>
              <Link href={`/mietverhaeltnisse/${v.id}`}>
                <button className="w-full bg-gray-50 text-gray-700 border border-gray-200 py-2.5 rounded-lg font-bold text-xs">
                  Details anzeigen
                </button>
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400">Keine Mietverhältnisse gefunden.</div>
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/anmelden', permanent: false } }

  const verhaeltnisse = await prisma.mietverhaeltnis.findMany({
    include: {
      mieter: { select: { name: true } },
      mietobjekt: { select: { adresse: true } }
    },
    orderBy: { startDatum: 'desc' }
  })

  return {
    props: {
      verhaeltnisse: JSON.parse(JSON.stringify(verhaeltnisse))
    },
  }
}
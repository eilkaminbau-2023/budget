import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'
import nextAuthOptions from '../api/auth/[...nextauth]'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

const authOptions = nextAuthOptions as NextAuthOptions

interface Mietobjekt {
  id: string
  adresse: string
  zimmer: number | null
  flaeche: number | null
  gesamtMiete: number
  status: string
  bemerkungen: string | null
  aktiveVertraege: number  // 🔥 YENİ: Aktif sözleşme sayısı
  _count?: {
    mietverhaeltnisse: number
  }
}

export default function Mietobjekte({ objekte }: { objekte: Mietobjekt[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [suchbegriff, setSuchbegriff] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALLE')

  // 🔥 GÜNCELLENMİŞ: Aktif sözleşme kontrolü ile silme fonksiyonu
  const handleDelete = async (id: string, adresse: string, aktiveVertraege: number) => {
    // 1. ÖZEL UYARI: Aktif sözleşme varsa
    if (aktiveVertraege > 0) {
      const bestätigung = confirm(
        `⚠️ ACHTUNG - AKTIVES MIETVERHÄLTNIS!\n\n` +
        `Das Objekt "${adresse}" hat AKTIVE MIETVERTRÄGE (${aktiveVertraege}).\n\n` +
        `Wenn Sie dieses Objekt löschen, werden ALLE zugehörigen:\n` +
        `• Aktiven Mietverhältnisse\n` +
        `• Mieterdaten\n` +
        `• Zahlungshistorien\n` +
        `• Dokumente/PDFs\n\n` +
        `VOLLSTÄNDIG GELÖSCHT!\n\n` +
        `Sind Sie SICHER, dass Sie fortfahren möchten?`
      )
      
      if (!bestätigung) return
    } 
    // 2. Normal uyarı (aktif sözleşme yoksa)
    else {
      const bestätigung = confirm(
        `Möchten Sie das Objekt "${adresse}" wirklich löschen?\n\n` +
        `Alle zugehörigen Daten (historische Mietverhältnisse, Zahlungen, Dokumente) werden gelöscht.`
      )
      
      if (!bestätigung) return
    }
    
    setLoading(id)
    try {
      const res = await fetch(`/api/mietobjekte/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.replace(router.asPath)
      } else {
        const data = await res.json()
        alert(data.message || 'Fehler beim Löschen')
      }
    } catch (error) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(null)
    }
  }

  // Filtreleme
  const gefilterteObjekte = objekte
    .filter(obj => {
      const matchesSearch = obj.adresse?.toLowerCase().includes(suchbegriff.toLowerCase()) || false
      if (suchbegriff && !matchesSearch) return false
      
      if (statusFilter !== 'ALLE' && obj.status !== statusFilter) return false
      
      return true
    })

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'FREI':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">Frei</span>
      case 'VERMIETET':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Vermietet</span>
      case 'INSTANDHALTUNG':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Instandhaltung</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Mietobjekte</h1>
        <Link href="/mietobjekte/neu">
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm w-full md:w-auto">
            + Neues Objekt
          </button>
        </Link>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Suche</label>
            <input
              type="text"
              placeholder="Adresse suchen..."
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
              <option value="FREI">Frei</option>
              <option value="VERMIETET">Vermietet</option>
              <option value="INSTANDHALTUNG">Instandhaltung</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSuchbegriff('')
                setStatusFilter('ALLE')
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-bold transition-colors h-[38px]"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      </div>

      {/* MASAÜSTÜ GÖRÜNÜM: Tablo */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Adresse</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Zimmer</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Fläche</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Gesamtmiete</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Verträge</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gefilterteObjekte.map((obj) => (
              <tr key={obj.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{obj.adresse}</td>
                <td className="px-6 py-4 text-gray-600">{obj.zimmer || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{obj.flaeche ? `${obj.flaeche} m²` : '-'}</td>
                <td className="px-6 py-4 text-gray-600">{obj.gesamtMiete.toLocaleString('de-DE')} €</td>
                <td className="px-6 py-4">{getStatusBadge(obj.status)}</td>
                <td className="px-6 py-4">
                  <span className={obj.aktiveVertraege > 0 ? 'text-green-600 font-bold' : 'text-gray-500'}>
                    {obj.aktiveVertraege} / {obj._count?.mietverhaeltnisse || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/mietobjekte/${obj.id}`}>
                      <button className="text-blue-600 hover:underline text-sm font-bold px-2 py-1">
                        Details
                      </button>
                    </Link>
                    
                    {/* 🔥 SİLME BUTONU - Aktif sözleşme sayısını gönderiyor */}
                    <button
                      onClick={() => handleDelete(obj.id, obj.adresse, obj.aktiveVertraege)}
                      disabled={loading === obj.id}
                      className={`text-sm font-bold px-2 py-1 disabled:opacity-50 ${
                        obj.aktiveVertraege > 0 
                          ? 'text-red-600 hover:text-red-800 font-extrabold'  // Aktif varsa koyu kırmızı
                          : 'text-gray-400 hover:text-red-600'  // Yoksa soluk
                      }`}
                      title={obj.aktiveVertraege > 0 
                        ? `Achtung: ${obj.aktiveVertraege} aktive(s) Mietverhältnis(se)` 
                        : 'Löschen'
                      }
                    >
                      {loading === obj.id ? '...' : 'Löschen'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBİL GÖRÜNÜM: Kartlar */}
      <div className="md:hidden space-y-4">
        {gefilterteObjekte.length > 0 ? (
          gefilterteObjekte.map((obj) => (
            <div key={obj.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-extrabold text-gray-900 leading-tight">{obj.adresse}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {obj.zimmer || '-'} Zimmer · {obj.flaeche ? `${obj.flaeche} m²` : '-'}
                  </p>
                  <p className="text-xs mt-1">
                    <span className={obj.aktiveVertraege > 0 ? 'text-green-600' : 'text-gray-400'}>
                      Verträge: {obj.aktiveVertraege} aktiv / {obj._count?.mietverhaeltnisse || 0} total
                    </span>
                  </p>
                </div>
                {getStatusBadge(obj.status)}
              </div>
              
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-gray-500">Gesamtmiete:</span>
                <span className="font-bold text-gray-900">{obj.gesamtMiete.toLocaleString('de-DE')} €</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/mietobjekte/${obj.id}`} className="flex-1">
                  <button className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-2.5 rounded-lg font-bold text-xs">
                    Details
                  </button>
                </Link>
                
                {/* 🔥 MOBİLDE SİLME BUTONU */}
                <button
                  onClick={() => handleDelete(obj.id, obj.adresse, obj.aktiveVertraege)}
                  disabled={loading === obj.id}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-xs disabled:opacity-50 ${
                    obj.aktiveVertraege > 0
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}
                >
                  {loading === obj.id ? '...' : 'Löschen'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400">Keine Mietobjekte gefunden.</div>
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return { redirect: { destination: '/auth/anmelden', permanent: false } }
  }

  // 🔥 GÜNCELLENMİŞ: Aktif sözleşme sayısını da getir
  const objekte = await prisma.mietobjekt.findMany({
    include: {
      mietverhaeltnisse: {
        select: { status: true }
      },
      _count: {
        select: { mietverhaeltnisse: true }
      }
    },
    orderBy: { adresse: 'asc' }
  })

  // Aktif sözleşme sayısını hesapla
  const objekteMitCounts = objekte.map(obj => ({
    ...obj,
    aktiveVertraege: obj.mietverhaeltnisse.filter(v => v.status === 'AKTIV').length
  }))

  return {
    props: {
      objekte: JSON.parse(JSON.stringify(objekteMitCounts))
    }
  }
}
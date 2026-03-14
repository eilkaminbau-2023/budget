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
  kaltMiete: number
  nebenkosten: number
  gesamtMiete: number
  status: string
  bemerkungen: string | null
  mietverhaeltnisse: Array<{
    id: string
    status: string
    startDatum: string
    endeDatum: string | null
    mieter: {
      id: string
      name: string | null
      email: string
    } | null
    zahlungen: Array<{
      id: string
      betrag: number
      status: string
      zahlungsdatum: string
    }>
    // 🔥 Mietobjekt ilişkisini ekliyoruz (kira bilgisi için)
    mietobjekt?: {
      gesamtMiete: number
    }
  }>
}

export default function MietobjektDetails({ objekt }: { objekt: Mietobjekt }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(true)

  // 🔥 Sözleşmeyi geçmişten sil (tamamen DELETE)
  const handleDeleteFromHistory = async (mietverhaeltnisId: string) => {
    if (!confirm('Dieses Mietverhältnis endgültig aus der Historie löschen?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/mietverhaeltnisse/${mietverhaeltnisId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        router.replace(router.asPath)
      } else {
        alert('Fehler beim Löschen')
      }
    } catch (error) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 Sözleşmeyi tekrar aktifleştir (opsiyonel)
  const handleReactivate = async (mietverhaeltnisId: string) => {
    if (!confirm('Dieses Mietverhältnis reaktivieren? (Achtung: Das Objekt wird wieder als vermietet markiert)')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/mietverhaeltnisse/${mietverhaeltnisId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'AKTIV',
          endeDatum: null  // Ende-Datum entfernen
        })
      })
      
      if (res.ok) {
        router.replace(router.asPath)
      } else {
        alert('Fehler bei der Reaktivierung')
      }
    } catch (error) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  // Aktif sözleşme (status AKTIV olan)
  const aktiverVertrag = objekt.mietverhaeltnisse.find(v => v.status === 'AKTIV')
  
  // Geçmiş sözleşmeler (status BEENDET veya GEKUENDIGT olanlar)
  const historischeVertraege = objekt.mietverhaeltnisse.filter(
    v => v.status !== 'AKTIV'
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'AKTIV':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Aktiv</span>
      case 'GEKUENDIGT':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">Gekündigt</span>
      case 'BEENDET':
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">Beendet</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/mietobjekte" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Zurück zur Übersicht
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{objekt.adresse}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(objekt.status)}
            <span className="text-sm text-gray-500">{objekt.zimmer} Zimmer · {objekt.flaeche} m²</span>
          </div>
        </div>
        <Link href={`/mietobjekte/${objekt.id}/bearbeiten`}>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold">
            Bearbeiten
          </button>
        </Link>
      </div>

      {/* Ana Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Kaltmiete</h3>
          <p className="text-2xl font-bold text-gray-900">{objekt.kaltMiete.toLocaleString('de-DE')} €</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Nebenkosten</h3>
          <p className="text-2xl font-bold text-gray-900">{objekt.nebenkosten.toLocaleString('de-DE')} €</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Gesamtmiete</h3>
          <p className="text-2xl font-bold text-blue-600">{objekt.gesamtMiete.toLocaleString('de-DE')} €</p>
        </div>
      </div>

      {/* AKTIF SÖZLEŞME (varsa) */}
      {aktiverVertrag && (
        <div className="bg-white rounded-xl shadow-md border border-green-200 overflow-hidden mb-8">
          <div className="bg-green-50 px-6 py-4 border-b border-green-200 flex justify-between items-center">
            <h2 className="font-bold text-green-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Aktuelles Mietverhältnis
            </h2>
            <Link href={`/mietverhaeltnisse/${aktiverVertrag.id}`}>
              <button className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                Details ansehen
              </button>
            </Link>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Mieter</p>
                <p className="font-bold">{aktiverVertrag.mieter?.name || 'Unbekannt'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Seit</p>
                <p className="font-bold">{new Date(aktiverVertrag.startDatum).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bis</p>
                <p className="font-bold">{aktiverVertrag.endeDatum ? new Date(aktiverVertrag.endeDatum).toLocaleDateString('de-DE') : 'Unbefristet'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Letzte Zahlung</p>
                <p className="font-bold">
                  {aktiverVertrag.zahlungen[0] ? 
                    `${aktiverVertrag.zahlungen[0].betrag.toLocaleString('de-DE')} €` : 
                    'Keine'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 MIETOBJEKT HISTORIE - TÜM GEÇMİŞ SÖZLEŞMELER */}
      {historischeVertraege.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div 
            className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer"
            onClick={() => setShowHistory(!showHistory)}
          >
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="text-gray-500">📜</span>
              Mietobjekt Historie ({historischeVertraege.length})
            </h2>
            <button className="text-gray-500">
              {showHistory ? '▼' : '▶'}
            </button>
          </div>
          
          {showHistory && (
            <div className="divide-y divide-gray-100">
              {historischeVertraege.map((vertrag, index) => (
                <div key={vertrag.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Sol taraf - Bilgiler */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          #{historischeVertraege.length - index}
                        </span>
                        {getStatusBadge(vertrag.status)}
                      </div>
                      
                      {/* 🔥 GÜNCELLENMİŞ: 4 kolonlu grid - Kira bilgisi eklendi */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Mieter</p>
                          <p className="font-medium">{vertrag.mieter?.name || vertrag.mieter?.email || 'Unbekannt'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Vertragszeitraum</p>
                          <p className="font-medium">
                            {new Date(vertrag.startDatum).toLocaleDateString('de-DE')} 
                            {' - '} 
                            {vertrag.endeDatum ? new Date(vertrag.endeDatum).toLocaleDateString('de-DE') : 'offen'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Letzte Zahlung</p>
                          <p className="font-medium">
                            {vertrag.zahlungen[0] ? 
                              `${vertrag.zahlungen[0].betrag.toLocaleString('de-DE')} €` : 
                              'Keine'
                            }
                          </p>
                        </div>
                        {/* 🔥 YENİ: Kira bilgisi */}
                        <div>
                          <p className="text-xs text-gray-400">Monatliche Miete</p>
                          <p className="font-bold text-blue-600">
                            {objekt.gesamtMiete.toLocaleString('de-DE')} €
                          </p>
                          <p className="text-xs text-gray-400">
                            (Kalt: {objekt.kaltMiete.toLocaleString('de-DE')} + NK: {objekt.nebenkosten.toLocaleString('de-DE')})
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sağ taraf - Butonlar */}
                    <div className="flex gap-2 w-full md:w-auto">
                      <Link href={`/mietverhaeltnisse/${vertrag.id}`} className="flex-1 md:flex-none">
                        <button className="w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-bold">
                          Details
                        </button>
                      </Link>
                      
                      {/* Reaktivier butonu (opsiyonel) */}
                      <button
                        onClick={() => handleReactivate(vertrag.id)}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 text-sm font-bold"
                        title="Wieder aktivieren"
                      >
                        🔄
                      </button>
                      
                      {/* Aus Historie löschen butonu */}
                      <button
                        onClick={() => handleDeleteFromHistory(vertrag.id)}
                        disabled={loading}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-bold disabled:opacity-50"
                        title="Endgültig löschen"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Ödeme geçmişi özeti (opsiyonel) */}
                  {vertrag.zahlungen.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Letzte Zahlungen:</p>
                      <div className="flex flex-wrap gap-2">
                        {vertrag.zahlungen.map(z => (
                          <span key={z.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {new Date(z.zahlungsdatum).toLocaleDateString('de-DE')}: {z.betrag}€
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hiç sözleşme yoksa */}
      {objekt.mietverhaeltnisse.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-400 mb-4">Keine Mietverhältnisse für dieses Objekt</p>
          <Link href={`/mietverhaeltnisse/neu?mietobjektId=${objekt.id}`}>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold">
              + Erstes Mietverhältnis anlegen
            </button>
          </Link>
        </div>
      )}

      {/* Bemerkungen (varsa) */}
      {objekt.bemerkungen && (
        <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Bemerkungen</h3>
          <p className="text-gray-700 whitespace-pre-line">{objekt.bemerkungen}</p>
        </div>
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) {
    return { redirect: { destination: '/auth/anmelden', permanent: false } }
  }

  const { id } = context.params!
  
  const objekt = await prisma.mietobjekt.findUnique({
    where: { id: String(id) },
    include: {
      mietverhaeltnisse: {
        include: {
          mieter: true,
          zahlungen: {
            orderBy: { zahlungsdatum: 'desc' }
          }
        },
        orderBy: {
          startDatum: 'desc'
        }
      }
    }
  })

  if (!objekt) {
    return { notFound: true }
  }

  return {
    props: {
      objekt: JSON.parse(JSON.stringify(objekt))
    }
  }
}
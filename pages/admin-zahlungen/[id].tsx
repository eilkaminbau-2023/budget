import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const authOptions = nextAuthOptions as NextAuthOptions

interface AdminZahlung {
  id: string
  betrag: number
  zahlungsdatum: string
  betrifftMonat: string | null
  bemerkungen: string | null
  mietobjektId: string
  mietobjekt: {
    id: string
    adresse: string | null
    gesamtMiete: number | null
  }
}

export default function AdminZahlungDetail({ zahlung }: { zahlung: AdminZahlung }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    betrag: zahlung.betrag.toString(),
    zahlungsdatum: new Date(zahlung.zahlungsdatum).toISOString().split('T')[0],
    betrifftMonat: zahlung.betrifftMonat || '',
    bemerkungen: zahlung.bemerkungen || ''
  })

  const handleDelete = async () => {
    if (!confirm('Diese Zahlung wirklich löschen?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin-zahlungen/${zahlung.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        router.push('/admin-zahlungen')
      } else {
        alert('Fehler beim Löschen')
      }
    } catch (error) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const res = await fetch(`/api/admin-zahlungen/${zahlung.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setIsEditing(false)
        router.replace(router.asPath)
      } else {
        alert('Fehler beim Aktualisieren')
      }
    } catch (error) {
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  // Monat formatlayıcı
  const formatMonat = (monat: string | null) => {
    if (!monat) return '-';
    return new Date(monat + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  if (isEditing) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button 
              onClick={() => setIsEditing(false)}
              className="text-blue-600 hover:underline text-sm flex items-center gap-1 mb-2"
            >
              ← Zurück
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Zahlung bearbeiten</h1>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Betrag (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.betrag}
                  onChange={(e) => setFormData({ ...formData, betrag: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Zahlungsdatum</label>
                <input
                  type="date"
                  required
                  value={formData.zahlungsdatum}
                  onChange={(e) => setFormData({ ...formData, zahlungsdatum: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Betrifft Monat</label>
                <input
                  type="month"
                  value={formData.betrifftMonat}
                  onChange={(e) => setFormData({ ...formData, betrifftMonat: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bemerkungen</label>
                <textarea
                  value={formData.bemerkungen}
                  onChange={(e) => setFormData({ ...formData, bemerkungen: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <button 
              onClick={() => router.back()}
              className="text-blue-600 hover:underline text-sm flex items-center gap-1 mb-2"
            >
              ← Zurück
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Zahlungsdetails</h1>
            <p className="text-gray-500 mt-1">ID: {zahlung.id}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
            >
              Bearbeiten
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
            >
              Löschen
            </button>
          </div>
        </div>

        {/* Mietobjekt Bilgileri */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Mietobjekt</h2>
          </div>
          <div className="p-6">
            <p className="text-lg font-bold text-gray-900">{zahlung.mietobjekt.adresse}</p>
            <p className="text-sm text-gray-600 mt-1">
              Monatliche Soll-Miete: {zahlung.mietobjekt.gesamtMiete?.toLocaleString('de-DE')} €
            </p>
          </div>
        </div>

        {/* Zahlungsdetails */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Zahlungsinformationen</h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-bold text-gray-500 uppercase mb-1">Betrag</dt>
                <dd className="text-2xl font-black text-green-600">{zahlung.betrag.toLocaleString('de-DE')} €</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-gray-500 uppercase mb-1">Zahlungsdatum</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {new Date(zahlung.zahlungsdatum).toLocaleDateString('de-DE')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-gray-500 uppercase mb-1">Betrifft Monat</dt>
                <dd className="text-lg font-medium text-gray-900">{formatMonat(zahlung.betrifftMonat)}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-gray-500 uppercase mb-1">Bemerkungen</dt>
                <dd className="text-gray-700">{zahlung.bemerkungen || '-'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
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

  const id = context.params?.id as string

  const zahlung = await prisma.adminZahlung.findUnique({
    where: { id },
    include: {
      mietobjekt: true
    }
  })

  if (!zahlung) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      zahlung: JSON.parse(JSON.stringify(zahlung))
    }
  }
}
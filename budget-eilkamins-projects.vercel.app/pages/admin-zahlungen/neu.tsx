import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const authOptions = nextAuthOptions as NextAuthOptions

interface Mietobjekt {
  id: string
  adresse: string | null
  gesamtMiete: number | null
}

export default function NeueAdminZahlung({ mietobjekte }: { mietobjekte: Mietobjekt[] }) {
  const router = useRouter()
  const { mietobjektId, monat } = router.query
  
  const [formData, setFormData] = useState({
    mietobjektId: '',
    betrag: '',
    zahlungsdatum: new Date().toISOString().split('T')[0],
    betrifftMonat: '',
    bemerkungen: ''
  })
  
  const [loading, setLoading] = useState(false)

  // URL'den gelen parametreleri forma ekle
  useEffect(() => {
    const updates: any = {}
    if (mietobjektId) updates.mietobjektId = mietobjektId
    if (monat) updates.betrifftMonat = monat
    
    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }))
    }
  }, [mietobjektId, monat])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin-zahlungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/admin-zahlungen')
      } else {
        const error = await res.json()
        alert(error.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  // Seçili mietobjekt'in bilgilerini bul
  const selectedMietobjekt = mietobjekte.find(m => m.id === formData.mietobjektId)

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            ← Zurück
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Neue Admin Zahlung</h1>
        <p className="text-gray-500 mt-1">Mietobjekt bazında ödeme ekle (kiracılardan bağımsız)</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mietobjekt Seçimi */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Mietobjekt *
            </label>
            <select
              required
              value={formData.mietobjektId}
              onChange={(e) => setFormData({ ...formData, mietobjektId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">-- Bitte wählen --</option>
              {mietobjekte.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.adresse} (Soll: {obj.gesamtMiete?.toLocaleString('de-DE')} €)
                </option>
              ))}
            </select>
            {selectedMietobjekt && (
              <p className="text-xs text-gray-500 mt-2">
                Monatliche Soll-Miete: <span className="font-bold">{selectedMietobjekt.gesamtMiete?.toLocaleString('de-DE')} €</span>
              </p>
            )}
          </div>

          {/* Betrag */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Betrag (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.betrag}
              onChange={(e) => setFormData({ ...formData, betrag: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Zahlungsdatum */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Zahlungsdatum *
            </label>
            <input
              type="date"
              required
              value={formData.zahlungsdatum}
              onChange={(e) => setFormData({ ...formData, zahlungsdatum: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Betrifft Monat */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Betrifft Monat
            </label>
            <input
              type="month"
              value={formData.betrifftMonat}
              onChange={(e) => setFormData({ ...formData, betrifftMonat: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM (z.B. 2026-03)</p>
          </div>

          {/* Bemerkungen */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Bemerkungen
            </label>
            <textarea
              value={formData.bemerkungen}
              onChange={(e) => setFormData({ ...formData, bemerkungen: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Optional..."
            />
          </div>

          {/* Butonlar */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
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

  // Tüm mietobjekt'leri getir
  const mietobjekte = await prisma.mietobjekt.findMany({
    select: {
      id: true,
      adresse: true,
      gesamtMiete: true
    },
    orderBy: {
      adresse: 'asc'
    }
  })

  return {
    props: {
      mietobjekte: JSON.parse(JSON.stringify(mietobjekte))
    }
  }
}
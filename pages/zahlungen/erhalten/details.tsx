import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

const authOptions = nextAuthOptions as NextAuthOptions

export default function MietobjektZahlungen({ mietobjekt, zahlungen }: { mietobjekt: any, zahlungen: any[] }) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState('')

  // İlk yüklemede bugünün ayını seç
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(currentMonth)
  }, [])

  // Seçilen aya ait ödemeyi bul (varsa)
  const selectedZahlung = zahlungen.find(z => z.betrifftMonat === selectedMonth)

  // Monat formatlayıcı
  const formatMonat = (monat: string) => {
    if (!monat) return '-';
    return new Date(monat + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  // Takvim için günleri oluştur
  const generateCalendar = () => {
    if (!selectedMonth) return []
    
    const [year, month] = selectedMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    const daysInMonth = lastDay.getDate()
    const startDay = firstDay.getDay()
    
    // Almanca hafta başı Pazartesi
    const startOffset = startDay === 0 ? 6 : startDay - 1
    
    const calendar = []
    let week = []
    
    // Boş günler
    for (let i = 0; i < startOffset; i++) {
      week.push(null)
    }
    
    // Ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day)
      if (week.length === 7) {
        calendar.push(week)
        week = []
      }
    }
    
    // Kalan boşluklar
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null)
      }
      calendar.push(week)
    }
    
    return calendar
  }

  const calendar = generateCalendar()
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  // Ödeme gününü bul
  const zahlungsTag = selectedZahlung ? new Date(selectedZahlung.zahlungsdatum).getDate() : null

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            ← Zurück zur Übersicht
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{mietobjekt.adresse}</h1>
        <p className="text-gray-500 mt-1">Mieter: {mietobjekt.mieterName}</p>
      </div>

      {/* 🔥 MONTH PICKER - neu.tsx'teki gibi */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-bold text-gray-700">Monat auswählen:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Takvim */}
          {selectedMonth && (
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-3">
                {formatMonat(selectedMonth)}
              </h3>
              
              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekdays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendar.map((week, weekIndex) => (
                    week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`
                          aspect-square flex items-center justify-center text-sm rounded-md
                          ${day ? 'bg-gray-50 border border-gray-200' : ''}
                          ${zahlungsTag && day === zahlungsTag 
                            ? 'bg-green-100 border-green-300 font-bold text-green-700' 
                            : day ? 'hover:bg-gray-100' : ''
                          }
                        `}
                      >
                        {day}
                      </div>
                    ))
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Zahlung eingegangen</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seçilen Ayın Ödemesi */}
          {selectedZahlung ? (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Zahlung für {formatMonat(selectedMonth)}
              </h3>
              
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-3xl font-black text-green-700">
                      {selectedZahlung.betrag.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Eingegangen am {new Date(selectedZahlung.zahlungsdatum).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800">
                    BEZAHLT
                  </span>
                </div>

                <Link href={`/zahlungen/${selectedZahlung.id}`}>
                  <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                    Zahlungsdetails ansehen
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            selectedMonth && (
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 text-center">
                  <p className="text-gray-700">
                    Für {formatMonat(selectedMonth)} liegt noch keine Zahlung vor.
                  </p>
                </div>
              </div>
            )
          )}

          {/* Toplam Bilgi */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Erhalten Gesamt (alle Monate):</span>
              <span className="text-2xl font-black text-green-600">
                {zahlungen.reduce((sum, z) => sum + z.betrag, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  if (!session) return { redirect: { destination: '/auth/anmelden', permanent: false } }

  const mietobjektId = context.query.mietobjektId as string

  if (!mietobjektId) {
    return { notFound: true }
  }

  const mietobjekt = await prisma.mietobjekt.findUnique({
    where: { id: mietobjektId },
    include: {
      mietverhaeltnisse: {
        include: {
          mieter: true,
          zahlungen: {
            where: { status: 'BEZAHLT' },
            orderBy: { zahlungsdatum: 'desc' }
          }
        }
      }
    }
  })

  if (!mietobjekt) {
    return { notFound: true }
  }

  const alleZahlungen = mietobjekt.mietverhaeltnisse.flatMap(v => v.zahlungen)
  const aktiverVertrag = mietobjekt.mietverhaeltnisse.find(v => v.status === 'AKTIV')
  const mieterName = aktiverVertrag?.mieter?.name || 'Unbekannt'

  return {
    props: {
      mietobjekt: {
        id: mietobjekt.id,
        adresse: mietobjekt.adresse,
        mieterName: mieterName
      },
      zahlungen: JSON.parse(JSON.stringify(alleZahlungen))
    }
  }
}
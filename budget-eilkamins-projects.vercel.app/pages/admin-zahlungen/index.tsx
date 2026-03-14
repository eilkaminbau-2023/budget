import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import nextAuthOptions from '../api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'

const authOptions = nextAuthOptions as NextAuthOptions

// Tip tanımlamaları
interface Mietobjekt {
  id: string
  adresse: string | null
  gesamtMiete: number | null
}

interface AdminZahlungMitMietobjekt {
  id: string
  betrag: number
  zahlungsdatum: Date
  betrifftMonat: string | null
  bemerkungen: string | null
  mietobjektId: string
  mietobjekt: Mietobjekt
}

interface ZahlungForDisplay {
  id: string
  betrag: number
  zahlungsdatum: string
  betrifftMonat: string | null
  bemerkungen: string | null
}

interface MietobjektMitZahlungen {
  mietobjekt: Mietobjekt
  zahlungen: ZahlungForDisplay[]
  toplamOdenen: number
}

interface GruppiertType {
  [key: string]: MietobjektMitZahlungen
}

export default function AdminZahlungen({ gruppiert, alleMonate }: { gruppiert: MietobjektMitZahlungen[], alleMonate: string[] }) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // Monat formatlayıcı
  const formatMonat = (monat: string): string => {
    if (!monat) return '-';
    return new Date(monat + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  // Seçilen aya ait ödemeleri filtrele
  const gefilterteGruppiert: MietobjektMitZahlungen[] = gruppiert.map((item: MietobjektMitZahlungen) => ({
    ...item,
    zahlungen: item.zahlungen.filter((z: ZahlungForDisplay) => z.betrifftMonat === selectedMonth)
  })).filter((item: MietobjektMitZahlungen) => item.zahlungen.length > 0 || (item.mietobjekt.gesamtMiete || 0) > 0)

  // Toplam hesaplamalar
  const toplamSoll: number = gruppiert.reduce((sum: number, item: MietobjektMitZahlungen) => sum + (item.mietobjekt.gesamtMiete || 0), 0)
  const toplamOdenen: number = gruppiert.reduce((sum: number, item: MietobjektMitZahlungen) => sum + item.toplamOdenen, 0)
  const toplamKalan: number = toplamSoll - toplamOdenen

  // Seçilen ay için toplamlar
  const ayToplamOdenen: number = gefilterteGruppiert.reduce((sum: number, item: MietobjektMitZahlungen) => 
    sum + item.zahlungen.reduce((s: number, z: ZahlungForDisplay) => s + z.betrag, 0), 0
  )

  const getStatusColor = (soll: number, odenen: number): string => {
    if (odenen === 0) return 'text-red-600 bg-red-50 border-red-200'
    if (odenen < soll) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getStatusText = (soll: number, odenen: number): string => {
    if (odenen === 0) return '❌ Nicht bezahlt'
    if (odenen < soll) return '⚠️ Teilweise bezahlt'
    return '✅ Bezahlt'
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            ← Zurück zum Dashboard
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Zahlungen</h1>
        <p className="text-gray-500 mt-1">Mietobjekt bazında ödeme takibi (kiracılardan bağımsız)</p>
      </div>

      {/* Monat Seçici ve Yeni Ödeme Butonu */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-gray-700">Monat auswählen:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <Link href="/admin-zahlungen/neu">
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm shadow-sm">
                + Neue Admin Zahlung
              </button>
            </Link>
          </div>

          {/* Seçilen Ayın Özeti */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Seçilen Ay</p>
                <p className="text-xl font-bold text-blue-900">{formatMonat(selectedMonth)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Aylık Ödenen</p>
                <p className="text-xl font-bold text-blue-900">{ayToplamOdenen.toLocaleString('de-DE')} €</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase">Toplam Kalan</p>
                <p className="text-xl font-bold text-blue-900">{toplamKalan.toLocaleString('de-DE')} €</p>
              </div>
            </div>
          </div>

          {/* Mietobjekt Listesi */}
          <div className="space-y-4">
            {gefilterteGruppiert.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-400">Bu ay için ödeme bulunamadı.</p>
                <Link href="/admin-zahlungen/neu" className="inline-block mt-4">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                    İlk Ödemeyi Ekle
                  </button>
                </Link>
              </div>
            ) : (
              gefilterteGruppiert.map((item: MietobjektMitZahlungen) => {
                const ayZahlungen: ZahlungForDisplay[] = item.zahlungen
                const ayOdenen: number = ayZahlungen.reduce((sum: number, z: ZahlungForDisplay) => sum + z.betrag, 0)
                const soll: number = item.mietobjekt.gesamtMiete || 0
                const statusClass: string = getStatusColor(soll, ayOdenen)
                const statusText: string = getStatusText(soll, ayOdenen)

                return (
                  <div key={item.mietobjekt.id} className={`border rounded-xl p-5 ${statusClass}`}>
                    {/* Mietobjekt Başlık */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{item.mietobjekt.adresse}</h3>
                        <p className="text-sm text-gray-600">Soll: {soll.toLocaleString('de-DE')} €</p>
                      </div>
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        <span className="text-sm font-bold">{statusText}</span>
                        <Link href={`/admin-zahlungen/neu?mietobjektId=${item.mietobjekt.id}&monat=${selectedMonth}`}>
                          <button className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-bold">
                            + Ödeme Ekle
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Ödeme Listesi */}
                    {ayZahlungen.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Bu ayki ödemeler</p>
                        <div className="space-y-2">
                          {ayZahlungen.map((zahlung: ZahlungForDisplay) => (
                            <div key={zahlung.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                              <div>
                                <p className="font-medium">{zahlung.betrag.toLocaleString('de-DE')} €</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(zahlung.zahlungsdatum).toLocaleDateString('de-DE')}
                                  {zahlung.bemerkungen && ` · ${zahlung.bemerkungen}`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/admin-zahlungen/${zahlung.id}`}>
                                  <button className="text-xs text-blue-600 hover:underline px-2 py-1">
                                    Details
                                  </button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Genel Toplam */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-bold uppercase">Toplam Soll</p>
                <p className="text-2xl font-bold text-gray-900">{toplamSoll.toLocaleString('de-DE')} €</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-bold uppercase">Toplam Ödenen</p>
                <p className="text-2xl font-bold text-green-600">{toplamOdenen.toLocaleString('de-DE')} €</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 font-bold uppercase">Toplam Kalan</p>
                <p className={`text-2xl font-bold ${toplamKalan > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {toplamKalan.toLocaleString('de-DE')} €
                </p>
              </div>
            </div>
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

  // Tüm admin ödemelerini getir
  const adminZahlungen = await prisma.adminZahlung.findMany({
    include: {
      mietobjekt: {
        select: {
          id: true,
          adresse: true,
          gesamtMiete: true
        }
      }
    },
    orderBy: {
      zahlungsdatum: 'desc'
    }
  }) as AdminZahlungMitMietobjekt[]

  // Tüm mietobjekt'leri getir (ödemesi olmayanlar da listelensin diye)
  const alleMietobjekte = await prisma.mietobjekt.findMany({
    select: {
      id: true,
      adresse: true,
      gesamtMiete: true
    }
  }) as Mietobjekt[]

  // Mietobjekt bazında grupla
  const gruppiert: GruppiertType = {}

  // Önce tüm mietobjekt'leri ekle (boş listeyle)
  alleMietobjekte.forEach((obj: Mietobjekt) => {
    gruppiert[obj.id] = {
      mietobjekt: obj,
      zahlungen: [],
      toplamOdenen: 0
    }
  })

  // Sonra ödemeleri ekle
  adminZahlungen.forEach((zahlung: AdminZahlungMitMietobjekt) => {
    const mietobjektId = zahlung.mietobjektId
    if (gruppiert[mietobjektId]) {
      gruppiert[mietobjektId].zahlungen.push({
        id: zahlung.id,
        betrag: zahlung.betrag,
        zahlungsdatum: zahlung.zahlungsdatum.toISOString(),
        betrifftMonat: zahlung.betrifftMonat,
        bemerkungen: zahlung.bemerkungen
      })
      gruppiert[mietobjektId].toplamOdenen += zahlung.betrag
    }
  })

  // Benzersiz ayları bul
  const monatValues: string[] = adminZahlungen
    .map((z: AdminZahlungMitMietobjekt) => z.betrifftMonat)
    .filter((monat: string | null): monat is string => monat !== null)
  
  const alleMonate: string[] = monatValues.filter((value: string, index: number, self: string[]) => 
    self.indexOf(value) === index
  ).sort().reverse()

  return {
    props: {
      gruppiert: Object.values(gruppiert),
      alleMonate
    }
  }
}
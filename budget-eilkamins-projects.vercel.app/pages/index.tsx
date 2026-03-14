import { useSession } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'
import nextAuthOptions from './api/auth/[...nextauth]'

// Dashboard Komponenten
import QuickActions from '@/components/dashboard/QuickActions'
import KpiCards from '@/components/dashboard/KpiCards'
import FinancialSummary from '@/components/dashboard/FinancialSummary'
import { DashboardProps } from '@/components/dashboard/types'

const authOptions = nextAuthOptions as NextAuthOptions

export default function Dashboard(props: DashboardProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-gray-600">Laden...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Willkommen zurück, {session.user?.name || session.user?.email}
        </p>
      </div>

      <QuickActions />

      <div className="mt-8">
        <KpiCards {...props} />
      </div>

      <div className="mt-8">
        <FinancialSummary 
          sollMiete={props.sollMiete} 
          adminGezahlt={props.adminGezahlt} 
          adminOffen={props.adminOffen} 
        />
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

  try {
    // 1. Tüm mietobjekt'lerin toplam kirası (Soll)
    const alleMietobjekte = await prisma.mietobjekt.findMany({
      select: { gesamtMiete: true }
    })
    const sollMiete = alleMietobjekte.reduce((sum: number, obj: any) => sum + (obj.gesamtMiete || 0), 0)

    // 2. Admin ödemeleri toplamı (Gezahlt)
    let adminGezahlt = 0
    try {
      const adminZahlungen = await prisma.adminZahlung.findMany({
        select: { betrag: true }
      })
      adminGezahlt = adminZahlungen.reduce((sum: number, z: any) => sum + (z.betrag || 0), 0)
    } catch (error) {
      adminGezahlt = 0
    }
    const adminOffen = sollMiete - adminGezahlt

    // 3. Kiracı ödemeleri (KpiCards için)
    const aktiveVertraege = await prisma.mietverhaeltnis.findMany({
      where: { status: 'AKTIV' },
      include: { mietobjekt: true, mieter: true }
    })
    
    const alleZahlungen = await prisma.zahlung.findMany({
      include: { 
        mietverhaeltnis: { 
          include: { 
            mieter: true, 
            mietobjekt: true 
          } 
        } 
      }
    })
    
    const erhalteneZahlungen = alleZahlungen.reduce((sum: number, z: any) => sum + (z.betrag || 0), 0)
    const offeneForderungen = sollMiete - erhalteneZahlungen

    // 4. Diğer veriler
    const anzahlObjekte = await prisma.mietobjekt.count()
    const anzahlAktiveVertraege = aktiveVertraege.length
    
    const bezahlteIds = alleZahlungen.map((z: any) => z.mietverhaeltnisId)
    const anzahlAusstehendeZahlungen = aktiveVertraege.filter((v: any) => !bezahlteIds.includes(v.id)).length

    // 5. Überfällige Zahlungen
    const heute = new Date()
    const ueberfaelligeZahlungen = alleZahlungen
      .filter((z: any) => z.status === 'AUSSTEHEND' && z.zahlungsdatum)
      .map((z: any) => {
        const diffTime = heute.getTime() - new Date(z.zahlungsdatum).getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return {
          id: z.id,
          betrag: z.betrag || 0,
          zahlungsdatum: z.zahlungsdatum.toISOString(),
          mieter: z.mietverhaeltnis?.mieter?.name || 'Unbekannt',
          mietobjekt: z.mietverhaeltnis?.mietobjekt?.adresse || 'Unbekannt',
          tageUeberfaellig: diffDays
        }
      })
      .filter((z: any) => z.tageUeberfaellig > 30)

    // 6. Leerstehende Objekte
    const leerstehendeObjekte = await prisma.mietobjekt.findMany({
      where: { status: 'FREI' },
      select: { id: true, adresse: true, gesamtMiete: true, status: true }
    })

    // 7. Auslaufende Verträge
    const in30Tagen = new Date()
    in30Tagen.setDate(in30Tagen.getDate() + 30)
    
    const auslaufendeVertraege = aktiveVertraege
      .filter((v: any) => v.endeDatum && new Date(v.endeDatum) <= in30Tagen)
      .map((v: any) => {
        const diffTime = new Date(v.endeDatum).getTime() - heute.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return {
          id: v.id,
          mietobjekt: v.mietobjekt?.adresse || 'Unbekannt',
          mieter: v.mieter?.name || v.mieter?.email || 'Unbekannt',
          mietende: v.endeDatum.toISOString(),
          tageBisAblauf: diffDays
        }
      })

    return {
      props: {
        // Admin Finanzdaten (FinancialSummary)
        sollMiete,
        adminGezahlt,
        adminOffen,
        
        // Kiracı ödemeleri (KpiCards)
        erhalteneZahlungen,
        offeneForderungen,
        
        // KpiCards
        anzahlObjekte,
        anzahlAktiveVertraege,
        anzahlAusstehendeZahlungen,
        
        // WarningCards
        ueberfaelligeZahlungen: JSON.parse(JSON.stringify(ueberfaelligeZahlungen)),
        leerstehendeObjekte: JSON.parse(JSON.stringify(leerstehendeObjekte)),
        auslaufendeVertraege: JSON.parse(JSON.stringify(auslaufendeVertraege))
      }
    }
  } catch (error) {
    console.error('Dashboard Fehler:', error)
    return {
      props: {
        sollMiete: 0,
        adminGezahlt: 0,
        adminOffen: 0,
        erhalteneZahlungen: 0,
        offeneForderungen: 0,
        anzahlObjekte: 0,
        anzahlAktiveVertraege: 0,
        anzahlAusstehendeZahlungen: 0,
        ueberfaelligeZahlungen: [],
        leerstehendeObjekte: [],
        auslaufendeVertraege: []
      }
    }
  }
}
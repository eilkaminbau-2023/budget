import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useState } from 'react'
import authOptions from './api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/ui/Layout'
import KpiCards from '@/components/dashboard/KpiCards'
import FinancialSummary from '@/components/dashboard/FinancialSummary'
import WarningCards from '@/components/dashboard/WarningCards'
import QuickActions from '@/components/dashboard/QuickActions'
import FilterButtons from '@/components/dashboard/FilterButtons'
import { DashboardProps } from '@/components/dashboard/types'

interface HomeProps {
  dashboardData: DashboardProps
}

export default function Home({ dashboardData }: HomeProps) {
  const [showNurUeberfaellig, setShowNurUeberfaellig] = useState(false)
  const [showNurBaldAblaufend, setShowNurBaldAblaufend] = useState(false)

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <FilterButtons 
          showNurUeberfaellig={showNurUeberfaellig}
          showNurBaldAblaufend={showNurBaldAblaufend}
          onUeberfaelligChange={setShowNurUeberfaellig}
          onBaldAblaufendChange={setShowNurBaldAblaufend}
        />
        
        {/* KpiCards: Spread operatörü ile tüm props'ları geçir */}
        <KpiCards {...dashboardData} />
        
        {/* FinancialSummary: Ayrı ayrı props olarak geçir (DÜZELTİLDİ) */}
        <FinancialSummary 
          erhalteneZahlungen={dashboardData.erhalteneZahlungen}
          offeneForderungen={dashboardData.offeneForderungen}
          sollMiete={dashboardData.sollMiete}
        />
        
        {/* WarningCards: data objesi olarak geçir */}
        <WarningCards 
          data={dashboardData}
          showNurUeberfaellig={showNurUeberfaellig}
          showNurBaldAblaufend={showNurBaldAblaufend}
        />
        
        <QuickActions />
      </div>
    </Layout>
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
    // 1. TEMEL VERİLER
    const mietobjekteCount = await prisma.mietobjekt.count()
    
    const aktiveVertraege = await prisma.mietverhaeltnis.findMany({
      where: { status: 'AKTIV' },
      include: {
        mietobjekt: true,
        mieter: true,
        zahlungen: true,
      },
    })
    
    // 2. FİNANSAL HESAPLAMALAR
    const sollMiete = aktiveVertraege.reduce(
      (sum, v) => sum + (v.mietobjekt?.gesamtMiete || 0),
      0
    )
    
    const erhalteneZahlungen = await prisma.zahlung.aggregate({
      where: { status: 'BEZAHLT' },
      _sum: { betrag: true },
    })
    
    const offeneZahlungen = await prisma.zahlung.aggregate({
      where: { status: { in: ['AUSSTEHEND', 'VERSPAETET'] } },
      _sum: { betrag: true },
    })
    
    // 3. VADESİ GEÇMİŞ ÖDEMELER
    const heute = new Date()
    const ueberfaelligeZahlungen = await prisma.zahlung.findMany({
      where: {
        status: { in: ['AUSSTEHEND', 'VERSPAETET'] },
        zahlungsdatum: { lt: heute },
      },
      include: {
        mietverhaeltnis: {
          include: {
            mietobjekt: true,
            mieter: true,
          },
        },
      },
      take: 5,
      orderBy: { zahlungsdatum: 'asc' },
    })
    
    // 4. BOŞ MİETOBJEKTE
    const leerstehendeObjekte = await prisma.mietobjekt.findMany({
      where: { status: 'FREI' },
      take: 5,
      orderBy: { erstellDatum: 'desc' },
    })
    
    // 5. YAKLAŞAN SÖZLEŞME BİTİŞLERİ
    const in30Tagen = new Date()
    in30Tagen.setDate(in30Tagen.getDate() + 30)
    
    const auslaufendeVertraege = await prisma.mietverhaeltnis.findMany({
      where: {
        status: 'AKTIV',
        endeDatum: {
          lte: in30Tagen,
          not: null,
        },
      },
      include: {
        mietobjekt: true,
        mieter: true,
      },
      take: 5,
      orderBy: { endeDatum: 'asc' },
    })
    
    // 6. VERİYİ DASHBOARD FORMATINA DÖNÜŞTÜR
    const dashboardData: DashboardProps = {
      anzahlObjekte: mietobjekteCount,
      anzahlAktiveVertraege: aktiveVertraege.length,
      anzahlAusstehendeZahlungen: await prisma.zahlung.count({
        where: { status: { in: ['AUSSTEHEND', 'VERSPAETET'] } },
      }),
      
      erhalteneZahlungen: erhalteneZahlungen._sum.betrag || 0,
      offeneForderungen: offeneZahlungen._sum.betrag || 0,
      sollMiete: sollMiete,
      
      ueberfaelligeZahlungen: ueberfaelligeZahlungen.map(z => ({
        id: z.id,
        betrag: z.betrag || 0,
        zahlungsdatum: z.zahlungsdatum?.toISOString().split('T')[0] || '',
        mieter: z.mietverhaeltnis?.mieter?.name || 'Bilinmiyor',
        mietobjekt: z.mietverhaeltnis?.mietobjekt?.adresse || 'Bilinmiyor',
        tageUeberfaellig: z.zahlungsdatum 
          ? Math.floor((heute.getTime() - new Date(z.zahlungsdatum).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      })),
      
      leerstehendeObjekte: leerstehendeObjekte.map(o => ({
        id: o.id,
        adresse: o.adresse || 'Adres yok',
        gesamtMiete: o.gesamtMiete || 0,
        status: o.status,
      })),
      
      auslaufendeVertraege: auslaufendeVertraege.map(v => ({
        id: v.id,
        mietobjekt: v.mietobjekt?.adresse || 'Bilinmiyor',
        mieter: v.mieter?.name || 'Bilinmiyor',
        mietende: v.endeDatum?.toISOString().split('T')[0] || '',
        tageBisAblauf: v.endeDatum
          ? Math.floor((new Date(v.endeDatum).getTime() - heute.getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      })),
    }
    
    return {
      props: {
        dashboardData,
      },
    }
  } catch (error) {
    console.error('Dashboard verisi yüklenirken hata:', error)
    return {
      props: {
        dashboardData: {
          anzahlObjekte: 0,
          anzahlAktiveVertraege: 0,
          anzahlAusstehendeZahlungen: 0,
          erhalteneZahlungen: 0,
          offeneForderungen: 0,
          sollMiete: 0,
          ueberfaelligeZahlungen: [],
          leerstehendeObjekte: [],
          auslaufendeVertraege: [],
        },
      },
    }
  }
}
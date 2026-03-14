import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/prisma'
import nextAuthOptions from '../auth/[...nextauth]'

const authOptions = nextAuthOptions as NextAuthOptions

// 🔥 Tip tanımlamaları
interface AdminZahlungMitMietobjekt {
  id: string
  betrag: number
  zahlungsdatum: Date
  betrifftMonat: string | null
  bemerkungen: string | null
  mietobjektId: string
  mietobjekt: {
    id: string
    adresse: string | null
    gesamtMiete: number | null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' })
  }

  // GET - Tüm admin ödemelerini getir (opsiyonel: monat filtresiyle)
  if (req.method === 'GET') {
    try {
      const { monat } = req.query
      
      const where: any = {}
      if (monat) {
        where.betrifftMonat = monat
      }

      const adminZahlungen = await prisma.adminZahlung.findMany({
        where,
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

      // 🔥 DÜZELTİLDİ: zahlung parametresine tip eklendi
      const gruppiert = adminZahlungen.reduce((acc: any, zahlung: AdminZahlungMitMietobjekt) => {
        const mietobjektId = zahlung.mietobjektId
        if (!acc[mietobjektId]) {
          acc[mietobjektId] = {
            mietobjekt: zahlung.mietobjekt,
            zahlungen: [],
            toplamOdenen: 0
          }
        }
        acc[mietobjektId].zahlungen.push(zahlung)
        acc[mietobjektId].toplamOdenen += zahlung.betrag
        return acc
      }, {})

      return res.status(200).json({
        gruppiert: Object.values(gruppiert),
        alleZahlungen: adminZahlungen
      })
    } catch (error) {
      console.error('GET Admin Zahlungen Fehler:', error)
      return res.status(500).json({ message: 'Server Fehler' })
    }
  }

  // POST - Yeni admin ödemesi ekle
  if (req.method === 'POST') {
    try {
      const { mietobjektId, betrag, zahlungsdatum, betrifftMonat, bemerkungen } = req.body

      if (!mietobjektId || !betrag || !zahlungsdatum) {
        return res.status(400).json({ message: 'MietobjektId, betrag und zahlungsdatum sind Pflichtfelder' })
      }

      const neueZahlung = await prisma.adminZahlung.create({
        data: {
          mietobjektId,
          betrag: parseFloat(betrag),
          zahlungsdatum: new Date(zahlungsdatum),
          betrifftMonat: betrifftMonat || null,
          bemerkungen: bemerkungen || ''
        },
        include: {
          mietobjekt: true
        }
      })

      return res.status(201).json(neueZahlung)
    } catch (error) {
      console.error('POST Admin Zahlung Fehler:', error)
      return res.status(500).json({ message: 'Server Fehler' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
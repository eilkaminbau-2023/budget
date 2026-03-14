import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import nextAuthOptions from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, nextAuthOptions)
  if (!session) {
    return res.status(401).json({ message: 'Nicht authentifiziert' })
  }

  const { id } = req.query

  // --- GET METHODU (GÜNCELLENDİ) ---
  if (req.method === 'GET') {
    try {
      const mietobjekt = await prisma.mietobjekt.findUnique({
        where: { id: String(id) },
        include: {
          // 🔥 TÜM sözleşmeleri getir (AKTIV ve BEENDET)
          mietverhaeltnisse: {
            include: {
              mieter: true,  // Kiracı bilgileri
              zahlungen: {
                orderBy: { zahlungsdatum: 'desc' },
                take: 5  // Son 5 ödeme
              }
            },
            orderBy: {
              startDatum: 'desc'  // En yeniden eskiye
            }
          }
        }
      })

      if (!mietobjekt) {
        return res.status(404).json({ message: 'Mietobjekt nicht gefunden' })
      }

      return res.status(200).json(mietobjekt)
    } catch (error) {
      console.error('GET Fehler:', error)
      return res.status(500).json({ message: 'Fehler beim Laden' })
    }
  }

  // --- PUT (GÜNCELLEME) ---
  if (req.method === 'PUT') {
    try {
      const data = req.body

      const zimmerVal = data.zimmer ? parseInt(data.zimmer.toString(), 10) : null
      const flaecheVal = data.flaeche ? parseFloat(data.flaeche.toString()) : null
      const kaltMieteVal = data.kaltMiete ? parseFloat(data.kaltMiete.toString()) : 0
      const nebenkostenVal = data.nebenkosten ? parseFloat(data.nebenkosten.toString()) : 0
      
      const gesamtMieteVal = kaltMieteVal + nebenkostenVal

      const updatedObjekt = await prisma.mietobjekt.update({
        where: { id: String(id) },
        data: {
          adresse: data.adresse,
          zimmer: isNaN(zimmerVal as number) ? undefined : zimmerVal,
          flaeche: isNaN(flaecheVal as number) ? undefined : flaecheVal,
          kaltMiete: isNaN(kaltMieteVal) ? undefined : kaltMieteVal,
          nebenkosten: isNaN(nebenkostenVal) ? undefined : nebenkostenVal,
          gesamtMiete: isNaN(gesamtMieteVal) ? undefined : gesamtMieteVal,
          status: data.status,
          bemerkungen: data.bemerkungen,
          aktualisiert: new Date()
        }
      })

      return res.status(200).json(updatedObjekt)
    } catch (error: any) {
      console.error('PUT Fehler:', error)
      return res.status(500).json({ message: 'Hata: Güncellenemedi', error: error.message })
    }
  }

  // --- DELETE METHODU ---
  if (req.method === 'DELETE') {
    try {
      // 1. Önce bu mülke bağlı olan kira sözleşmelerini bul
      const verhaeltnisse = await prisma.mietverhaeltnis.findMany({
        where: { mietobjektId: String(id) }
      })

      // 2. Her bir sözleşmeye bağlı olan ödemeleri ve sözleşmenin kendisini sil
      for (const v of verhaeltnisse) {
        await prisma.zahlung.deleteMany({
          where: { mietverhaeltnisId: v.id }
        })
        await prisma.dokument.deleteMany({
          where: { mietverhaeltnisId: v.id }
        })
        await prisma.mietverhaeltnis.delete({
          where: { id: v.id }
        })
      }

      // 3. Mülkü sil
      await prisma.mietobjekt.delete({
        where: { id: String(id) }
      })

      return res.status(200).json({ message: 'Objekt ve bağlı tüm veriler başarıyla silindi' })
    } catch (error) {
      console.error('DELETE Fehler:', error)
      return res.status(500).json({ message: 'Fehler beim Löschen' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ message: `Method ${req.method} not allowed` })
}
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  // --- GET METODU (TEKIL ZAHLUNG) ---
  if (req.method === 'GET') {
    try {
      // 🔥 DÜZELTİLDİ: Tek bir ödemeyi ID'ye göre getir
      const zahlung = await prisma.zahlung.findUnique({
        where: { 
          id: String(id)  // Doğru: id'ye göre ara
        },
        include: {
          mietverhaeltnis: {
            include: {
              mieter: true,
              mietobjekt: true,
            }
          }
        }
      })

      if (!zahlung) {
        return res.status(404).json({ message: 'Zahlung nicht gefunden' })
      }

      return res.status(200).json(zahlung)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Fehler beim Laden der Zahlung' })
    }
  }

  // --- PUT METODU (GÜNCELLEME İÇİN) ---
  if (req.method === 'PUT') {
    try {
      const { betrag, zahlungsdatum, status, methode, bemerkungen, betrifftMonat } = req.body
      
      const updated = await prisma.zahlung.update({
        where: { id: String(id) },
        data: { 
          betrag: parseFloat(betrag),
          zahlungsdatum: new Date(zahlungsdatum),
          status: status,
          methode: methode,
          bemerkungen: bemerkungen,
          betrifftMonat: betrifftMonat || null  // 🔥 YENİ ALAN EKLENDİ
        }
      })
      return res.status(200).json(updated)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Error' })
    }
  }

  // --- DELETE METODU (SİLMEK İÇİN) ---
  if (req.method === 'DELETE') {
    try {
      await prisma.zahlung.delete({
        where: { id: String(id) }
      })
      return res.status(200).json({ message: 'Erfolgreich gelöscht' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Löschen fehlgeschlagen' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
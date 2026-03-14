export interface DashboardProps {
  // Admin Finanzdaten (FinancialSummary için)
  sollMiete: number;           // Tüm mietobjekt'lerin toplam kirası
  adminGezahlt: number;        // Admin'in ödediği toplam
  adminOffen: number;          // Kalan (Soll - Gezahlt)

  // KpiCards için (Kiracı ödemeleri)
  erhalteneZahlungen: number;  // Kiracılardan alınan toplam
  offeneForderungen: number;   // Kiracılardan alınacak toplam

  // Statistische Grunddaten
  anzahlObjekte: number;
  anzahlAktiveVertraege: number;
  anzahlAusstehendeZahlungen: number;

  // Listen für Tabellen (WarningCards için)
  ueberfaelligeZahlungen: {
    id: string;
    betrag: number;
    zahlungsdatum: string;
    mieter: string;
    mietobjekt: string;
    tageUeberfaellig: number;
  }[];

  leerstehendeObjekte: {
    id: string;
    adresse: string;
    gesamtMiete: number;
    status: string;
  }[];

  auslaufendeVertraege: {
    id: string;
    mietobjekt: string;
    mieter: string;
    mietende: string;
    tageBisAblauf: number;
  }[];
}
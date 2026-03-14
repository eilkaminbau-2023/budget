-- CreateEnum
CREATE TYPE "Rolle" AS ENUM ('ADMIN', 'VERMIETER', 'MIETER');

-- CreateEnum
CREATE TYPE "MietobjektStatus" AS ENUM ('FREI', 'VERMIETET', 'INSTANDHALTUNG');

-- CreateEnum
CREATE TYPE "MietverhaeltnisStatus" AS ENUM ('AKTIV', 'BEENDET', 'GEKUENDIGT');

-- CreateEnum
CREATE TYPE "ZahlungStatus" AS ENUM ('BEZAHLT', 'AUSSTEHEND', 'VERSPAETET');

-- CreateEnum
CREATE TYPE "Zahlungsmethode" AS ENUM ('BAR', 'UBERWEISUNG', 'LASTSCHRIFT');

-- CreateTable
CREATE TABLE "Benutzer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwort" TEXT,
    "name" TEXT,
    "rolle" "Rolle" NOT NULL DEFAULT 'MIETER',
    "bild" TEXT,
    "telefon" TEXT,
    "erstellDatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benutzer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mietobjekt" (
    "id" TEXT NOT NULL,
    "adresse" TEXT,
    "zimmer" INTEGER,
    "flaeche" DOUBLE PRECISION,
    "kaltMiete" DOUBLE PRECISION,
    "nebenkosten" DOUBLE PRECISION,
    "gesamtMiete" DOUBLE PRECISION,
    "status" "MietobjektStatus" NOT NULL DEFAULT 'FREI',
    "bemerkungen" TEXT,
    "erstellDatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mietobjekt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dokument" (
    "id" TEXT NOT NULL,
    "mietverhaeltnisId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "erstellDatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dokument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mietverhaeltnis" (
    "id" TEXT NOT NULL,
    "mietobjektId" TEXT,
    "vermieterId" TEXT,
    "mieterId" TEXT,
    "startDatum" TIMESTAMP(3),
    "endeDatum" TIMESTAMP(3),
    "kaution" DOUBLE PRECISION,
    "status" "MietverhaeltnisStatus" NOT NULL DEFAULT 'AKTIV',
    "vertragUrl" TEXT,
    "erstellDatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mietverhaeltnis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zahlung" (
    "id" TEXT NOT NULL,
    "mietverhaeltnisId" TEXT,
    "betrag" DOUBLE PRECISION,
    "zahlungsdatum" TIMESTAMP(3),
    "methode" "Zahlungsmethode",
    "status" "ZahlungStatus" NOT NULL DEFAULT 'AUSSTEHEND',
    "bemerkungen" TEXT,
    "betrifftMonat" TEXT,
    "erstellDatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert" TIMESTAMP(3) NOT NULL,
    "erstellerId" TEXT,

    CONSTRAINT "Zahlung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AktivitaetsLog" (
    "id" TEXT NOT NULL,
    "benutzerId" TEXT,
    "aktion" TEXT,
    "details" TEXT,
    "ipAdresse" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AktivitaetsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Benutzer_email_key" ON "Benutzer"("email");

-- AddForeignKey
ALTER TABLE "Dokument" ADD CONSTRAINT "Dokument_mietverhaeltnisId_fkey" FOREIGN KEY ("mietverhaeltnisId") REFERENCES "Mietverhaeltnis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mietverhaeltnis" ADD CONSTRAINT "Mietverhaeltnis_mietobjektId_fkey" FOREIGN KEY ("mietobjektId") REFERENCES "Mietobjekt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mietverhaeltnis" ADD CONSTRAINT "Mietverhaeltnis_vermieterId_fkey" FOREIGN KEY ("vermieterId") REFERENCES "Benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mietverhaeltnis" ADD CONSTRAINT "Mietverhaeltnis_mieterId_fkey" FOREIGN KEY ("mieterId") REFERENCES "Benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zahlung" ADD CONSTRAINT "Zahlung_mietverhaeltnisId_fkey" FOREIGN KEY ("mietverhaeltnisId") REFERENCES "Mietverhaeltnis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zahlung" ADD CONSTRAINT "Zahlung_erstellerId_fkey" FOREIGN KEY ("erstellerId") REFERENCES "Benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AktivitaetsLog" ADD CONSTRAINT "AktivitaetsLog_benutzerId_fkey" FOREIGN KEY ("benutzerId") REFERENCES "Benutzer"("id") ON DELETE SET NULL ON UPDATE CASCADE;


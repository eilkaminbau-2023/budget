import React from 'react'

interface FilterButtonsProps {
  showNurUeberfaellig: boolean
  showNurBaldAblaufend: boolean   // DÜZELTİLDİ: Ahlaufend -> Ablaufend
  onUeberfaelligChange: (value: boolean) => void
  onBaldAblaufendChange: (value: boolean) => void   // DÜZELTİLDİ
}

export default function FilterButtons({
  showNurUeberfaellig,
  showNurBaldAblaufend,           // DÜZELTİLDİ
  onUeberfaelligChange,
  onBaldAblaufendChange            // DÜZELTİLDİ
}: FilterButtonsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => onUeberfaelligChange(!showNurUeberfaellig)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          showNurUeberfaellig
            ? 'bg-red-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {showNurUeberfaellig ? 'Alle anzeigen' : 'Nur überfällige anzeigen'}
      </button>
      
      <button
        onClick={() => onBaldAblaufendChange(!showNurBaldAblaufend)}  // DÜZELTİLDİ
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          showNurBaldAblaufend   // DÜZELTİLDİ
            ? 'bg-yellow-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {showNurBaldAblaufend ? 'Alle anzeigen' : 'Nur bald ablaufende anzeigen'}  // DÜZELTİLDİ
      </button>
    </div>
  )
}
import Link from 'next/link'

export default function QuickActions() {
  return (
    <div className="mb-8 px-1">
      {/* Başlık Alanı - Resimdeki gibi sarı şimşek ikonlu */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-yellow-500 text-xl">⚡</span>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Quick Actions</h2>
      </div>
      
      {/* MOBİL GÜNCELLEME: 
          'grid-cols-2' -> Mobilde yan yana 2 tane
          'lg:grid-cols-4' -> Büyük ekranlarda yan yana 4 tane
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* + Mietobjekt - Mavi Renk */}
        <Link href="/mietobjekte/neu" className="w-full">
          <button className="w-full py-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="text-lg">+</span> Mietobjekt
          </button>
        </Link>

        {/* + Mietverhältnis - Yeşil Renk */}
        <Link href="/mietverhaeltnisse/neu" className="w-full">
          <button className="w-full py-4 bg-[#48a14d] hover:bg-[#3d8b41] text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="text-lg">+</span> Mietverhältnis
          </button>
        </Link>

        {/* + Zahlung - Mor Renk */}
        <Link href="/zahlungen/neu" className="w-full">
          <button className="w-full py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span className="text-lg">+</span> Zahlung
          </button>
        </Link>

        {/* Dokumente - Turuncu Renk */}
        <Link href="/dokumente" className="w-full">
          <button className="w-full py-4 bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm">
            <span>📄</span> Dokumente
          </button>
        </Link>

      </div>
    </div>
  )
}
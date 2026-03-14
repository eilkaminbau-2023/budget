import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Mietobjekte', href: '/mietobjekte' },
    { name: 'Mietverhältnisse', href: '/mietverhaeltnisse' },
    { name: 'Zahlungen', href: '/zahlungen' },
  ]

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4">
        {/* Üst Satır: Kullanıcı adı ve Çıkış Butonu (Mobilde de düzgün durması için) */}
        <div className="flex justify-between items-center h-14 border-b border-gray-100 md:border-none">
           <span className="text-xs sm:text-sm font-medium text-gray-600 truncate max-w-[150px]">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all"
            >
              Abmelden
            </button>
        </div>

        {/* Alt Satır: Menü Linkleri (Mobilde sağa kaydırılabilir yapıldı) */}
        <div className="flex items-center h-12 overflow-x-auto no-scrollbar scrollbar-hide whitespace-nowrap">
          <div className="flex space-x-1 sm:space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors ${
                  router.pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
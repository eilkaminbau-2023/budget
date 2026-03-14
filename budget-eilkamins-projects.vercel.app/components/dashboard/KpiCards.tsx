import { 
  HomeIcon, 
  UsersIcon, 
  CurrencyEuroIcon, 
  ExclamationTriangleIcon,
  BanknotesIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { DashboardProps } from './types'
import Link from 'next/link'

export default function KpiCards(props: DashboardProps) {
  const stats = [
    {
      name: 'Gesamte Objekte',
      value: props.anzahlObjekte,
      icon: HomeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/mietobjekte'
    },
    {
      name: 'Vermietete Wohnungen',
      value: props.anzahlAktiveVertraege,
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/mietverhaeltnisse'
    },
    {
      name: 'Ausstehende Zahlungen',
      value: props.anzahlAusstehendeZahlungen,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/zahlungen?filter=ausstehend'
    },
    {
      name: 'Soll-Miete (Gesamt)',
      value: `${(props.sollMiete || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
      icon: CurrencyEuroIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/aktive-mietobjekte'
    },
    {
      name: 'Erhaltener Betrag',
      value: `${(props.erhalteneZahlungen || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
      icon: BanknotesIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/zahlungen/erhalten' 
    },
    {
      name: 'Offener Betrag',
      value: `${(props.offeneForderungen || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/zahlungen/offen'
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 px-1">
      {stats.map((item) => {
        const CardContent = (
          <div className={`relative overflow-hidden rounded-lg bg-white px-3 pt-4 pb-6 shadow sm:px-6 sm:pt-6 transition-all duration-200 ${item.href ? 'hover:bg-gray-50 hover:shadow-md cursor-pointer active:scale-95' : ''}`}>
            <dt>
              <div className={`absolute rounded-md p-2 sm:p-3 ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 sm:h-6 ${item.color}`} aria-hidden="true" />
              </div>
              <p className="ml-12 sm:ml-16 truncate text-xs sm:text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-12 sm:ml-16 flex items-baseline">
              <p className={`text-lg sm:text-2xl font-semibold ${item.name === 'Erhaltener Betrag' ? 'text-green-600' : 'text-gray-900'}`}>
                {item.value}
              </p>
            </dd>
          </div>
        )

        return item.href ? (
          <Link key={item.name} href={item.href}>
            {CardContent}
          </Link>
        ) : (
          <div key={item.name}>{CardContent}</div>
        )
      })}
    </div>
  )
}
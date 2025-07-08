import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  ClipboardDocumentListIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline'
import './globals.css'

export const metadata = {
  title: 'ESA Control Tower',
  description: 'Admin dashboard for ESA Vendor Dashboard monitoring and management',
}

function Navigation() {
  const navItems = [
    { href: '/dashboard', icon: HomeIcon, label: 'Overview' },
    { href: '/dashboard/change-review', icon: ClipboardDocumentListIcon, label: 'Change Review' },
    { href: '/dashboard/logs', icon: DocumentTextIcon, label: 'Logs' },
    { href: '/dashboard/costs', icon: CurrencyDollarIcon, label: 'Costs' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ESA Control Tower</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent transition-colors"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleString('en-US', { 
                timeZone: 'UTC',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Password gate for production
  if (process.env.NODE_ENV === 'production') {
    const cookieStore = cookies()
    const passwordCookie = cookieStore.get('ctl_pwd')
    
    if (passwordCookie?.value !== process.env.DASHBOARD_PASSWORD) {
      redirect('/dashboard/login')
    }
  }

  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <div className="min-h-full">
          <Navigation />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
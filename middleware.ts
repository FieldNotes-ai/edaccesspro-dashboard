import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip authentication for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check for authentication cookie
  const authCookie = request.cookies.get('demo-auth')?.value

  // If no auth cookie, redirect to login
  if (!authCookie || authCookie !== 'authenticated') {
    // If already on login page, allow access
    if (request.nextUrl.pathname === '/login') {
      return NextResponse.next()
    }
    
    // Redirect to login page
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login, redirect to home
  if (request.nextUrl.pathname === '/login') {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
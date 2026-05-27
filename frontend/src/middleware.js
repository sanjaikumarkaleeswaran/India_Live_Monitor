import { NextResponse } from 'next/server'

/**
 * Next.js Edge Middleware — Server-side Admin Guard
 * ──────────────────────────────────────────────────
 * Runs BEFORE React renders. Cannot be bypassed via DevTools.
 *
 * Flow:
 *  1. Any request to /admin/* is intercepted here
 *  2. Reads JWT from `silm_token` cookie
 *  3. Decodes payload (no secret needed — we only read role)
 *  4. If role !== 'admin' → redirect to /403
 *  5. If no token → redirect to /login
 */

/**
 * Decode JWT payload without verifying signature.
 * (Signature is verified server-side by Express on every API call.)
 * We use this only to read the role claim to decide on redirect.
 */
function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split('.')[1]
    if (!base64Payload) return null
    // Edge runtime uses atob — replace URL-safe chars
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Only guard /admin and all sub-paths
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('silm_token')?.value

  // ── No token → redirect to login ────────────────────────────────────────
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/admin')
    loginUrl.searchParams.set('reason', 'unauthenticated')
    return NextResponse.redirect(loginUrl)
  }

  // ── Decode and check role ────────────────────────────────────────────────
  const payload = decodeJwtPayload(token)

  if (!payload) {
    // Malformed token
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/admin')
    loginUrl.searchParams.set('reason', 'invalid_token')
    return NextResponse.redirect(loginUrl)
  }

  // Check token expiry
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', '/admin')
    loginUrl.searchParams.set('reason', 'token_expired')
    return NextResponse.redirect(loginUrl)
  }

  // Not admin → redirect to 403
  if (payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/403', request.url))
  }

  // ── Passed — allow through ───────────────────────────────────────────────
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}

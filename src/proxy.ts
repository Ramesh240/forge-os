import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

const GUEST_COOKIE = 'forge_guest_id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function proxy(request: NextRequest) {
  const existingGuestId = request.cookies.get(GUEST_COOKIE)?.value;
  if (existingGuestId && UUID_PATTERN.test(existingGuestId)) {
    return NextResponse.next();
  }

  const guestId = randomUUID();
  request.cookies.set(GUEST_COOKIE, guestId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

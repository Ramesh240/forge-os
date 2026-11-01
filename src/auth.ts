// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const isGoogleAuthConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

const authSecret = process.env.AUTH_SECRET;

if (
  process.env.NODE_ENV === 'production' &&
  (!authSecret || authSecret.trim().length < 32 || authSecret.startsWith('replace-with-'))
) {
  throw new Error('AUTH_SECRET must be configured in production.');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret || 'forge-os-development-only-auth-secret',
  trustHost: true,
  providers: isGoogleAuthConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});

// src/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const isGoogleAuthConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || 'forge-os-dev-auth-secret-change-in-prod-32c',
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

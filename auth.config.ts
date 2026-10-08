import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = (user as unknown as { workspaceId: string }).workspaceId;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { workspaceId: string }).workspaceId = token.workspaceId as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

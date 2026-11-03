
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "@/lib/login-rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";

        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }


        // Only use a client IP supplied by a trusted reverse proxy.
        // Until the hosting proxy is configured and verified,
        // IP-based limits remain disabled.
        const ip: string | null = null;

        const allowed = await checkLoginRateLimit(email, ip);

        if (!allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
          },
        });

        const passwordMatches = user?.passwordHash
          ? await bcrypt.compare(password, user.passwordHash)
          : false;

        if (!user || !passwordMatches) {
          await recordFailedLogin(email, ip);
          return null;
        }

        await clearLoginRateLimit(email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
});

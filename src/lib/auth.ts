import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();
          const email = user.email;
          if (!email) return false;

          const existingUser = await UserModel.findOne({ email });

          if (!existingUser) {
            await UserModel.create({
              email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
            });
          } else {
            existingUser.accessToken = account.access_token;
            existingUser.refreshToken = account.refresh_token;
            await existingUser.save();
          }

          return true;
        } catch (error) {
          console.error("NextAuth | signIn error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

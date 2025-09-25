import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInUser } from "@/lib/auth/neon-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Extend the User type to include our custom fields
interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Extend the JWT type to include our custom fields
interface CustomJWT extends JWT {
  id?: string;
  role?: string;
}

// Extend the Session type to include our custom user fields
interface CustomSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string | null;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        // Use Neon database for authentication
        try {
          const user = await signInUser({
            email: credentials.email,
            password: credentials.password,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // If the user object is passed, it means the user just signed in
      // Update the token with the user information
      if (user) {
        // Type assertion to use our custom user type
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.email = customUser.email;
        token.name = customUser.name;
        token.role = customUser.role;
        
        // Log token creation for debugging
        console.log('JWT token created with role:', customUser.role);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Performance optimization: Only update session if token exists
      if (token) {
        if (!session.user) {
          session.user = {
            name: '',
            email: '',
            image: null
          };
        }
        
        // Add custom properties to the user object
        (session.user as any).id = (token as CustomJWT).id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).role = (token as CustomJWT).role as string;
      }
      return session as CustomSession;
    },
  },
  pages: {
    signIn: "/signin",
    signOut: "/signout",
    error: "/signin", // Redirect to signin page on error
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-for-development",
};

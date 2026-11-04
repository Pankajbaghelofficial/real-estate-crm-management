import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Generic message: do not reveal whether the email exists (user enumeration).
const INVALID = 'Invalid email or password';

// Simple in-memory login throttle (per email). Good enough for a single-node
// deployment; use Redis or a reverse-proxy limit if running multiple instances.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; first: number }>();

function isLocked(key: string): boolean {
    const a = attempts.get(key);
    if (!a) return false;
    if (Date.now() - a.first > WINDOW_MS) {
        attempts.delete(key);
        return false;
    }
    return a.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
    const a = attempts.get(key);
    if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
    else a.count++;
}

// Precomputed hash so a missing user costs the same time as a wrong password.
let dummyHash: string | null = null;
function getDummyHash() {
    if (!dummyHash) dummyHash = bcrypt.hashSync('dummy-password-for-timing', 12);
    return dummyHash;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = String(credentials?.email || '').trim().toLowerCase();
                const password = String(credentials?.password || '');
                if (!email || !password || password.length > 200) throw new Error(INVALID);

                if (isLocked(email)) {
                    throw new Error('Too many login attempts. Please try again in 15 minutes.');
                }

                // Emails may have been stored with mixed case in the past.
                const user =
                    (await prisma.adminUser.findUnique({ where: { email } })) ??
                    (await prisma.adminUser.findUnique({ where: { email: String(credentials?.email || '').trim() } }));

                const valid = await bcrypt.compare(password, user?.password || getDummyHash());
                if (!user || !valid) {
                    recordFailure(email);
                    throw new Error(INVALID);
                }

                attempts.delete(email);
                return {
                    id: user.id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
                token.id = user.id;
                return token;
            }
            // Re-validate on every request so deleted / demoted users lose access
            // immediately instead of keeping a stale role for the JWT lifetime.
            const id = Number(token.id);
            if (!Number.isInteger(id)) return {};
            const dbUser = await prisma.adminUser.findUnique({
                where: { id },
                select: { id: true, name: true, email: true, role: true },
            });
            if (!dbUser) return {};
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.email = dbUser.email;
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: unknown }).role = token.role;
                (session.user as { id?: unknown }).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60, // 8h admin sessions
    },
    secret: process.env.NEXTAUTH_SECRET,
};

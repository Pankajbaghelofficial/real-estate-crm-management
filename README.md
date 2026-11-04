# Sampatti Kendra — Real Estate CRM

Next.js 16 (App Router) + Prisma (SQLite) + NextAuth (credentials) website with an admin CRM
for properties, blogs, enquiries (leads), media gallery and users.

## Setup

```bash
npm ci
npx prisma generate
npx prisma db push          # create / sync the SQLite schema
```

Create the first super admin (run on the server shell; it never overwrites an existing user):

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node prisma/seed.js
```

## Environment variables

| Variable          | Required | Description                                              |
|-------------------|----------|----------------------------------------------------------|
| `DATABASE_URL`    | yes      | e.g. `file:./prod.db` (relative to `prisma/`)            |
| `NEXTAUTH_SECRET` | yes      | long random string (`openssl rand -base64 32`)           |
| `NEXTAUTH_URL`    | yes      | public site URL, e.g. `https://sampattikendra.com`       |

## Run

```bash
npm run build
node .next/standalone/server.js   # output: "standalone"
```

For standalone, copy `public/`, `.next/static/` and `data/` next to `server.js` as usual.

## Roles

| Role         | Access                                                                 |
|--------------|------------------------------------------------------------------------|
| `superadmin` | everything, incl. users, site settings, hero slider, notifications     |
| `admin`      | dashboard, properties, blogs, gallery, all enquiries                   |
| `agent`      | own properties, enquiries assigned to them / on their properties       |

All permissions are enforced server-side (`src/lib/authz.ts`) in pages, server actions and API routes.

## Security notes

- There is no HTTP seed endpoint; create admins with `prisma/seed.js` or from the Users page.
- Uploads are validated by file content (magic bytes); the extension is chosen by the server.
- Rich text (blog content, property descriptions) is sanitised with `sanitize-html`.
- Login and the public enquiry form have in-memory rate limits (single instance only).

# Sampatti Kendra — Real Estate CRM

Next.js 16 (App Router) + Prisma + PostgreSQL + NextAuth (credentials) website with an admin CRM
for properties, blogs, enquiries (leads), media gallery and users.

- **Database:** PostgreSQL (Prisma Postgres or Neon on Vercel). Site settings are stored in the database too.
- **Images:** Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise `public/uploads` on disk.
  Images already committed in `public/uploads` keep working everywhere.

## Deploy on Vercel

> Vercel's **Hobby** plan is for non-commercial use only. A business website needs the **Pro** plan.

1. **Import the repository**: Vercel → *Add New… → Project* → pick this GitHub repo.
   The build command comes from `vercel.json` (`npm run vercel-build`), so leave the defaults.
2. **Database**: in the project, open *Storage → Create Database* and connect **Prisma Postgres** or **Neon**
   to the project (don't set a custom env-variable prefix). Both work as-is:
   - Prisma Postgres adds `DATABASE_URL` (direct) and `DATABASE_URL_POOLED`.
   - Neon adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct).

   Migrations automatically use the direct connection (`scripts/db-migrate.mjs`).
   Keep the functions region (*Settings → Functions*) the same as the database region, otherwise
   every page waits on a far-away database.
3. **Images**: *Storage → Create → Blob* and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Secret**: add `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`).
   `NEXTAUTH_URL` is not needed on Vercel.
5. **First admin** (fresh start): add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (min 10 characters) as
   environment variables. The build creates that super admin **only if the database has no users yet**,
   so afterwards the variables have no effect. Change the password after the first login, then you can
   delete `ADMIN_PASSWORD`. Moving an existing site instead? Skip this and import the old data (below).
6. **Deploy.** Every build runs the migrations, which create/update the tables.
7. Add your domain under *Settings → Domains*.

**Preview deployments** also run migrations against whatever database their environment points to.
Give previews their own database (e.g. Neon's "branch per preview deployment" option), or scope the
database variables to *Production* only.

## Moving data from the old SQLite database

Needs Node.js 22.13+. Copies every table (IDs preserved) plus `data/site-settings.json` into an
**empty** Postgres database. It never deletes or overwrites anything and refuses a non-empty target.

```bash
npm run db:migrate               # with the database variables from Vercel in .env (vercel env pull)
SQLITE_FILE=./path/to/prod.db npm run db:import-sqlite -- --dry-run   # check first
SQLITE_FILE=./path/to/prod.db npm run db:import-sqlite
```

Existing logins keep their passwords. Old image URLs (`/uploads/...`) keep working because those
files are committed in `public/uploads`; new uploads go to Blob.

## Local development

```bash
cp .env.example .env              # then fill in values
npm ci
npm run db:migrate                # needs a running PostgreSQL (local, or a cloud dev database)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run db:seed
npm run dev
```

Without `BLOB_READ_WRITE_TOKEN`, uploads are saved to `public/uploads`.

## Environment variables

| Variable                | Required | Description                                                     |
|-------------------------|----------|-----------------------------------------------------------------|
| `DATABASE_URL`          | yes      | PostgreSQL connection used by the app                           |
| `DATABASE_URL_UNPOOLED` | Neon only | Direct connection for migrations (Neon's `DATABASE_URL` is pooled) |
| `NEXTAUTH_SECRET`       | yes      | long random string                                              |
| `NEXTAUTH_URL`          | not on Vercel | public site URL when hosting elsewhere                     |
| `BLOB_READ_WRITE_TOKEN` | on Vercel | Vercel Blob store token (uploads)                              |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | First super admin, created by the build only while the database has no users |

## Other hosting (VPS / Hostinger)

`npm run build` then `node .next/standalone/server.js` (`output: "standalone"`), copying `public/`
and `.next/static/` next to `server.js`. Set the same database variables (cloud Postgres works from
anywhere) and run `npm run db:migrate` on each release.

## Roles

| Role         | Access                                                                 |
|--------------|------------------------------------------------------------------------|
| `superadmin` | everything, incl. users, site settings, hero slider, notifications     |
| `admin`      | dashboard, properties, blogs, gallery, all enquiries                   |
| `agent`      | own properties, enquiries assigned to them / on their properties       |

All permissions are enforced server-side (`src/lib/authz.ts`) in pages, server actions and API routes.

## Security notes

- There is no HTTP seed endpoint; create admins with `npm run db:seed` or from the Users page.
- Uploads are validated by file content (magic bytes); the extension is chosen by the server. Max 4 MB
  (Vercel rejects request bodies over 4.5 MB).
- Rich text (blog content, property descriptions) is sanitised with `sanitize-html`.
- Login and the public enquiry form have in-memory rate limits. On Vercel each function instance
  keeps its own counter, so treat them as basic protection; use a shared store (e.g. Upstash Redis)
  if you need strict limits.

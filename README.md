# Sampatti Kendra — Real Estate CRM

Next.js 16 (App Router) + Prisma + PostgreSQL + NextAuth (credentials) website with an admin CRM
for properties, blogs, enquiries (leads), media gallery and users.

- **Database:** PostgreSQL (Neon on Vercel). Site settings are stored in the database too.
- **Images:** Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise `public/uploads` on disk.
  Images already committed in `public/uploads` keep working everywhere.

## Deploy on Vercel

> Vercel's **Hobby** plan is for non-commercial use only. A business website needs the **Pro** plan.

1. **Import the repository**: Vercel → *Add New… → Project* → pick this GitHub repo.
   The build command comes from `vercel.json` (`npm run vercel-build`), so leave the defaults.
2. **Database**: in the project, open *Storage → Create Database → Neon* and connect it to the project.
   This adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct). Check the names under
   *Settings → Environment Variables*; if you chose a custom prefix, rename them to these.
   Pick a region close to your users (e.g. Singapore `aws-ap-southeast-1`) and set the same region
   for functions under *Settings → Functions* (e.g. `sin1`), otherwise every page waits on a far-away database.
3. **Images**: *Storage → Create → Blob* and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Secret**: add `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`).
   `NEXTAUTH_URL` is not needed on Vercel.
5. **Deploy.** Every build runs `prisma migrate deploy`, which creates/updates the tables.
6. **Data**, pick one:
   - *Fresh start*: create the first super admin from your computer, pointing at the Neon database:

     ```bash
     DATABASE_URL="<neon url>" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run db:seed
     ```

   - *Move the existing site*: copy the old SQLite database (see below) **before** seeding.
7. Add your domain under *Settings → Domains*.

**Preview deployments** also run migrations against whatever database their environment points to.
Either enable Neon's "create a database branch for each preview deployment" option in the integration,
or scope the database variables to *Production* only.

## Moving data from the old SQLite database

Needs Node.js 22.13+. Copies every table (IDs preserved) plus `data/site-settings.json` into an
**empty** Postgres database. It never deletes or overwrites anything and refuses a non-empty target.

```bash
npx prisma migrate deploy        # with DATABASE_URL / DATABASE_URL_UNPOOLED set to Neon
SQLITE_FILE=./path/to/prod.db npm run db:import-sqlite -- --dry-run   # check first
SQLITE_FILE=./path/to/prod.db npm run db:import-sqlite
```

Existing logins keep their passwords. Old image URLs (`/uploads/...`) keep working because those
files are committed in `public/uploads`; new uploads go to Blob.

## Local development

```bash
cp .env.example .env              # then fill in values
npm ci
npm run db:migrate                # needs a running PostgreSQL (local, or a Neon dev branch)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run db:seed
npm run dev
```

Without `BLOB_READ_WRITE_TOKEN`, uploads are saved to `public/uploads`.

## Environment variables

| Variable                | Required | Description                                                     |
|-------------------------|----------|-----------------------------------------------------------------|
| `DATABASE_URL`          | yes      | PostgreSQL connection used by the app (pooled on Neon)          |
| `DATABASE_URL_UNPOOLED` | yes      | Direct connection used by migrations and the import script      |
| `NEXTAUTH_SECRET`       | yes      | long random string                                              |
| `NEXTAUTH_URL`          | not on Vercel | public site URL when hosting elsewhere                     |
| `BLOB_READ_WRITE_TOKEN` | on Vercel | Vercel Blob store token (uploads)                              |

## Other hosting (VPS / Hostinger)

`npm run build` then `node .next/standalone/server.js` (`output: "standalone"`), copying `public/`
and `.next/static/` next to `server.js`. Set the same database variables (Neon works from
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

# Independently deployed suite apps

The suite uses six Next.js applications with shared source packages. Each app
owns its pages, API endpoints, assets, build and deployment. Cross-app navigation
uses full-page links from the shared app switcher and side rail.

The default deployment topology is separate subdomains. Every app currently
owns `/`, `/login` and `/api`; sending only page routes to a child app under one
domain would send its API calls to the wrong app. A single-domain Vercel
Microfrontends group requires a separate route migration before activation.

| Vercel project | Root directory | URL variable |
| --- | --- | --- |
| zsyio-pms | apps/pms | NEXT_PUBLIC_PMS_URL |
| zsyio-notes | apps/notes | NEXT_PUBLIC_NOTES_URL |
| zsyio-hrms | apps/hrms | NEXT_PUBLIC_HRMS_URL |
| zsyio-admin | apps/admin | NEXT_PUBLIC_ADMIN_URL |
| zsyio-sales | apps/sales | NEXT_PUBLIC_SALES_URL |
| zsyio-recruit | apps/recruit | NEXT_PUBLIC_RECRUIT_URL |

## Configure and deploy

1. Import `Itz-Abhishek-Tiwari/zsyio-suit` into Vercel once for each row, using
   its root directory and the Next.js framework preset. Enable source files
   outside the root directory so shared workspace packages are bundled.
2. Use the repository's pnpm version and lockfile. Keep the default `next build`
   build command for each app; dependency installation runs the root postinstall
   hook to generate Prisma Client. All six apps specify Frankfurt (`fra1`) for
   their functions; confirm this matches the production database location.
3. Configure each project's production environment directly in Vercel:
   `DATABASE_URL`, `DIRECT_URL` for separately run migrations, the same
   `AUTH_SECRET`, `AUTH_TRUST_HOST=1`, and all six URL variables from the table.
   Set `NEXT_PUBLIC_APP_URL` to that project's own HTTPS origin. Configure email,
   storage and other integrations as described in [deployment.md](deployment.md).
   Cloud installs use Vercel's environment and do not create local env files.
4. For shared sign-in, attach six subdomains of a domain you own and set
   `COOKIE_DOMAIN` to that parent domain in every project. Unrelated
   `*.vercel.app` hosts require a separate sign-in per app; they cannot share a
   parent-domain cookie. Do not point production projects to localhost.
5. Run `pnpm deploy:check` with the intended production environment, or
   `pnpm deploy:check --env-file=/absolute/path/to/production.env` with a private
   local file. It prints validation results without exposing values. This checks
   configuration shape, not database connectivity or ownership of the domains.
6. Build and deploy each project to preview first. Verify login, an authenticated
   API request and a database-backed page in every app, then verify app-switcher
   links and session sharing on custom subdomains. Release each tested app to
   production independently. Schema migration execution is a separate release
   step and must keep existing app deployments compatible.

Public URL variables are compiled into the client bundle. Redeploy affected apps
when URLs change. Turbo includes `NEXT_PUBLIC_*` in its environment and build
cache inputs so builds use the configured navigation destinations.

Shared packages are bundled into each application; they do not need their own
Vercel projects. A shared package update can require rebuilding multiple apps,
while feature changes confined to one app can ship independently.

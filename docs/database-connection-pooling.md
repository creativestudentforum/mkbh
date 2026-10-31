# Database Connection Pooling Guide

This project leverages Supabase PostgreSQL with built-in connection pooling via **Supavisor**.

## Architecture

1. **HTTP/REST & GraphQL Connection Pooling (Client-Side & SSR)**:
   - Managed by `@supabase/ssr` with persistent HTTP Keep-Alive (`keepalive: true`).
   - Sockets and TLS handshakes are reused across requests, preventing TCP connection exhaustion.

2. **Direct PostgreSQL Connection Pooling (Supavisor)**:
   - For direct database access (Prisma, Drizzle, migrations, or node-postgres `pg.Pool`), connect to port `6543` instead of the direct database port `5432`.
   - **Transaction Mode** (recommended for serverless/Next.js):
     ```
     postgres://[db-user].[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```
   - **Session Mode** (for persistent stateful daemons):
     ```
     postgres://[db-user].[project-ref]:[db-password]@aws-0-[region].pooler.supabase.com:5432/postgres
     ```

## Best Practices

- Always use the Supavisor Pooler URL (`:6543`) in high-concurrency environments like Next.js API routes or server actions.
- Avoid creating new Supabase client instances in loops; use the exported singleton `createClient()` on the client and `createServerSupabaseClient()` per server request.
- Keep transaction lifetimes minimal.

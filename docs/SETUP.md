# Atlas ERP — Next.js source

An integrated ERP starter with sales orders, purchasing, inventory, customer and supplier records, employees, expenses, dashboard, reports, and CSV export. Data is stored in Cloudflare D1.

## Requirements

- Node.js 22.13 or newer
- pnpm (run `corepack enable`, or install it with `npm install -g pnpm`)

## Run locally

Extract the ZIP, open a terminal in the `atlas-erp` folder, and run:

```bash
pnpm install
pnpm build
pnpm exec wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_familiar_raider.sql
pnpm dev
```

Open the local address printed by `pnpm dev` (normally http://localhost:5173). The first build creates the local Worker configuration; the Wrangler command creates the six tables in the local D1 database. Run that migration once per new local database. The included `.openai/hosting.json` declares a logical `DB` binding without tying the source to the original deployment. This is a Vinext/Cloudflare Workers project, so plain `next dev` does not supply its database binding.

In the dashboard, use **Load sample data** to populate eight products, five contacts, four employees, and three expenses, or enter your own records. Create draft orders and complete them to update stock. Completed sales decrease stock; received purchase orders increase it. Reports export a CSV of orders and expenses.

## Structure

- `app/page.tsx`: interface and client workflows
- `app/api/erp/route.ts`: API and input validation
- `db/schema.ts`: relational schema
- `drizzle/0000_familiar_raider.sql`: initial database migration
- `app/globals.css`: responsive layout

## Deployment

Provision a Cloudflare D1 database and bind it as `DB` for your Worker. Apply the generated migration before using the API. The hosted ChatGPT Site already has its own D1 database and is private to its owner. This ZIP contains no deployment credentials or original Site identity.

## Scope

This is a working ERP foundation, not a certified accounting or payroll product. It does not include user roles, approval chains, taxes, invoice compliance, returns, payroll, audit trails, or external integrations. The dashboard's net figure is sales less recorded expenses and is not accounting profit; it excludes cost of goods sold. Review authentication, finance rules and access controls before using real business data.

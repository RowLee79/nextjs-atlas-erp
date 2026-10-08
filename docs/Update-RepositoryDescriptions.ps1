# Requires GitHub CLI (gh), installed from https://cli.github.com/ and signed in as RowLee79.
# Run: gh auth login
# Then: powershell -ExecutionPolicy Bypass -File .\Update-RepositoryDescriptions.ps1
# Updates only the description field on these 15 existing public repositories.
$ErrorActionPreference = 'Stop'
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI from https://cli.github.com/ first.' }
gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login first.' }
$login = gh api user --jq .login
if ($LASTEXITCODE -ne 0 -or $login.Trim() -ne 'RowLee79') { throw 'Sign in to GitHub CLI as RowLee79.' }
$projects = @(
    @{ Repository = 'RowLee79/nextjs-atlas-erp'; Description = 'ERP portfolio demo: sales, purchasing, inventory, contacts, employees, expenses and CSV reporting. React, TypeScript, Next.js-compatible Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-aquaflow-water-refilling'; Description = 'Water refilling operations demo: customers, products, stock, pickup/delivery orders, containers, balances and manual payments. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-bytehaven-internet-cafe'; Description = 'Internet cafe management demo: stations, hourly plans, timed sessions, billing, counter sales and stock. React, TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-campus-student-management'; Description = 'Student management portfolio demo: student records, courses, enrollment, attendance, gradebook and academic reports. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-expressway-nexus'; Description = 'Toll expressway operations demo: plazas, lanes, vehicles, RFID records, simulated wallets, trips, fare matrix and toll ledger. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-firestone-pizza-delivery'; Description = 'Pizza ordering portfolio demo: menu customization, cart, delivery checkout, tracking, staff fulfillment and manual cash recording. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-iron-club'; Description = 'Gym management portfolio demo with memberships, attendance, classes, bookings and manual payment records. React, TypeScript, Next.js-compatible Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-kusina-pinoy'; Description = 'Filipino food ordering demo with menu, cart, guest checkout, order tracking and staff management. React, TypeScript, Next.js-compatible Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-ledgerlane-online-banking'; Description = 'Educational banking simulation with fictional accounts, transfers, beneficiaries and a transaction ledger. No real money or banking integrations. TypeScript, Vinext and D1.' }
    @{ Repository = 'RowLee79/nextjs-linenloop-laundry'; Description = 'Laundry management demo: customers, services, order workflow, balances, manual payment records and CSV export. React, TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-lumina-cinema'; Description = 'Cinema reservation demo: films, showtimes, seat maps, guest booking, lookup, cancellation and screening management. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-peopleflow-hris'; Description = 'HRIS portfolio demo: employees, departments, positions, attendance, leave, base-salary payroll snapshots and reports. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-skyline-air'; Description = 'Airline reservation demo: flight search, fare packages, passenger details, seat selection, booking lookup and staff operations. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-solstice-hotel'; Description = 'Hotel reservation demo: date-based availability, room inventory, guest bookings, lookup, cancellation and inventory management. TypeScript, Vinext and Cloudflare D1.' }
    @{ Repository = 'RowLee79/nextjs-supermarket-pos'; Description = 'Supermarket POS frontend demo with barcode lookup, cart, discounts, receipt printing, inventory and transactions. React and TypeScript; data resets on reload.' }
)
foreach ($project in $projects) {
    gh repo edit $project.Repository --description $project.Description
    if ($LASTEXITCODE -ne 0) { throw "Description update failed: $($project.Repository)" }
    $actual = gh api "repos/$($project.Repository)" --jq .description
    if ($LASTEXITCODE -ne 0 -or $actual.Trim() -ne $project.Description) { throw "Description verification failed: $($project.Repository)" }
    Write-Host "Updated and verified: $($project.Repository)"
}

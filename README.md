# NeoCloud Operator Console

NeoCloud Operator Console is a private neocloud operations app built on top of the Brokkr API.

The product is intentionally framed from the supply side, not the renter side:

- stand up GPU supply
- understand where revenue is coming from
- see what capacity is idle
- identify what is blocking monetization
- map physical Brokkr resources to sellable commercial instances

## Why This Exists

- `Dashboard` focuses on revenue, idle opportunity, and operational attention
- `Datacenters` and `Network` represent facility and bridge readiness
- `Devices` focuses on hardware that can be brought online and monetized
- `Instances` is the app-owned commercial layer on top of Brokkr devices
- `Reservations` and `Deployments` show pipeline and live operating load

## Product Model

### Brokkr remains the infrastructure source of truth for:

- datacenters
- zones
- bridge requests
- bridges
- devices
- reservation invites
- deployments
- inventory, but only as a demo fallback for `Devices`

### This app adds a local commercial model for:

- sellable instance identity
- hourly pricing
- market status
- visibility
- notes
- revenue snapshots

That local commercial model exists because Brokkr exposes infrastructure resources, but it does not expose a full neocloud product catalog or payout ledger.

## Architecture

### Frontend

- React
- React Router
- React Query
- Supabase auth
- shadcn/ui

### Backend

- FastAPI
- SQLAlchemy async
- Alembic
- Supabase-backed Postgres
- Brokkr integration adapter

### Local tables added for the operator product

- `operator_instances`
- `instance_revenue_snapshots`

## Brokkr Endpoints Used

These are the Brokkr endpoints the operator experience actively depends on today.

### Core operator data

- `GET /api/v1/datacenters`
- `GET /api/v1/datacenters/{datacenterId}/contacts`
- `GET /api/v1/zones`
- `GET /api/v1/bridge-requests`
- `GET /api/v1/bridges`
- `GET /api/v1/devices`
- `GET /api/v1/devices/{deviceId}/reservation-invites`
- `GET /api/v1/deployments`
- `GET /api/v1/deployments/{id}`

### Demo fallback for the `Devices` view

- `GET /api/v1/inventory`

## The `Devices` Demo Fallback

The Brokkr org used for this demo does not currently expose real operator-side `devices` data.

To keep the operator story presentable, the `Devices` page falls back to Brokkr inventory when `GET /api/v1/devices` returns no rows.

Important detail:

- the fallback happens in the backend
- the frontend still receives one normalized `DeviceRow` shape
- the UI does not handle two formats
- inventory is being used only to populate a credible operator demo surface
- this is explicitly a demo strategy, not a claim that Brokkr inventory equals operator devices

In other words: the app is not pretending inventory is the same thing as onboarded supply. It is using live inventory to mock device-level supply in a way that keeps the demo useful while preserving a clean contract boundary.

## Revenue Model

The dashboard does not invent fake finance data.

Instead it uses run-rate and opportunity semantics:

- `current hourly revenue`: sum of active earning instances
- `idle hourly opportunity`: listed, visible, healthy instances that are not currently earning
- `attention`: instances blocked from earning because they are offline, unlisted, deprecated, or lack prerequisites

That keeps the product honest while still making the operator objective clear: get more capacity online and earning.

## What Had To Be Created To Pull This Off

Brokkr gives infrastructure resources. A neocloud operator product needs more than that. To bridge the gap, this project adds:

- an operator aggregation layer that joins Brokkr infrastructure with local commercial state
- a local `Instance` abstraction on top of a Brokkr device
- derived revenue and attention calculations
- synthetic `Devices` fallback behavior when the operator account has no live devices
- operator-specific page structure and terminology

This is the core product move in the project:

`Brokkr device` is the physical or operational asset.

`Operator instance` is the sellable business object layered on top of that asset.

## Running Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend/neocloud
uv sync
uv run python -m uvicorn api.app:app --reload --host 0.0.0.0 --port 8081
```

### Database migrations

```bash
cd backend/neocloud
.venv/bin/alembic upgrade head
```

## Current Scope

This version is strongest as an operator demo, not a full production platform.

What is in place:

- supply-side dashboard
- datacenter and network visibility
- device view
- local instance creation and editing
- reservation pipeline visibility
- deployment visibility

What is still a reasonable next phase:

- writable datacenter creation and editing
- bridge request creation
- device onboarding and listing controls
- reservation invite management
- onboarding flow for operator-provided Brokkr API keys with encrypted storage

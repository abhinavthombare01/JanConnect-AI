# JanConnect AI

JanConnect AI is a hackathon prototype for collecting multilingual civic-service
requests and turning them into a reviewable, location-aware picture of local
needs. It is not affiliated with a government agency and is not an official
complaint channel.

## Demo flow

1. Open the home page and choose **Make a request**.
2. Submit an English, Hindi, or Marathi request and select one of the supported
   pilot areas. The app classifies the request and saves it for review.
3. Open **Insights** to review category and priority totals, area demand,
   calculated hotspots, and aggregate recommendations.
4. Use **Add synthetic records** to create labeled demonstration data. Synthetic
   records are identified in the request list and map.
5. Open a request in the administrator workspace to change its review status.

The database starts empty. Adding the 100 synthetic records from the dashboard
makes the charts and map easier to demonstrate.

## Application routes

- `/` — landing page and prototype overview
- `/citizen` and `/submit` — citizen information and request submission
- `/dashboard` — aggregate metrics, synthetic-data controls, and generated
  development insights
- `/complaints` — searchable, filterable request review and status updates
- `/map` — OpenStreetMap markers for individual requests and calculated
  concentration circles
- `/about` — prototype scope, data limitations, and privacy information

## Run in Replit

Start the managed workflows from the Replit **Workflows** panel:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/janconnect-ai run dev
```

The managed workflows supply the ports and paths used by the Replit proxy. The
API is served under `/api`, while the web app is served at `/`. For local runs
outside Replit, provide compatible `PORT` and `BASE_PATH` values and a reverse
proxy that routes `/api` to the API server.

## AI configuration and privacy

Set `OPENAI_API_KEY` through Replit Secrets to enable OpenAI analysis. The key is
optional: without it, multilingual keyword rules classify requests and generate
aggregate insights locally.

When OpenAI analysis is enabled, the complaint text, selected language, and area
are sent to OpenAI for classification. Optional name and phone fields are stored
with the request but are not included in AI requests. Do not submit sensitive
personal, financial, or health information. AI analysis may be incomplete and
requires human review.

## Data and safeguards

- Requests are stored in SQLite at
  `artifacts/api-server/data/janconnect.sqlite` by default. Set
  `JANCONNECT_DB_PATH` to choose another location.
- The database and its WAL files are excluded from Git.
- Synthetic records are explicitly labeled and must not be presented as real
  citizen submissions.
- The administrator workspace has no authentication in this MVP. Keep it within
  a controlled hackathon/demo environment; do not use it for real citizen data
  or operational decisions.
- The map uses OpenStreetMap tiles and attribution. Coordinates represent
  approximate pilot-area centers, not exact addresses or service boundaries.
- Voice and messaging integrations are not enabled; they remain future work.

## API

The API contract is defined in `lib/api-spec/openapi.yaml`. Its generated React
Query hooks and Zod schemas are in `lib/api-client-react` and `lib/api-zod`.

- `GET /api/healthz`
- `GET|POST /api/complaints`
- `GET|PUT /api/complaints/:id`
- `POST /api/analyze-complaint`
- `GET /api/analytics`
- `GET /api/hotspots`
- `POST /api/generate-demo-data`
- `POST /api/generate-insights`
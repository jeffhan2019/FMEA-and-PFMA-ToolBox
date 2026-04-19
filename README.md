# FMEA-and-PFMA-ToolBox

Node web app under `app/` (see `app/README.md` for API and features).

## Run locally

```bash
npm start
```

Or: `node app/server.js`, then open `http://localhost:8080`.

## Deploy

**Docker (any host with containers):**

```bash
docker build -t tsf-fmea .
docker run --rm -p 8080:8080 tsf-fmea
```

The server listens on `PORT` (default `8080`). Data is written to `app/data/store.json` inside the container unless you mount a volume at `/app/data`.

**Heroku-style platforms:** a `Procfile` is included (`web: node app/server.js`). Set the stack to Node and ensure `PORT` is provided by the platform.

**GitHub:** pushes and pull requests to `main` or `master` run CI (syntax check + Docker image build) via `.github/workflows/ci.yml`.
# Roomscape

Browser-based 3D apartment visualizer: free camera, selectable/configurable elements, apartments generated from floor plans.

## Stack

TypeScript, React, Three.js via React Three Fiber + drei, Vite, zod, Vitest.

## Running

Requires Node 22+.

```bash
npm install
npm run dev
```

| Script            | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Dev server with hot reload      |
| `npm run build`   | Type-check and production build |
| `npm run preview` | Serve the production build      |
| `npm test`        | Unit tests                      |
| `npm run lint`    | ESLint                          |
| `npm run format`  | Prettier                        |

The build uses a relative base path, so `dist/` can be served from any sub-path (e.g. GitHub Pages).

## Layout

| Path              | Contents                                 |
| ----------------- | ---------------------------------------- |
| `src/schema`      | Apartment JSON schema and validation     |
| `src/catalogue`   | Material catalogue (and furniture types) |
| `src/scene`       | 3D scene components                      |
| `src/ui`          | App shell and panels                     |
| `public/projects` | Apartment JSON files                     |
| `plans`           | Source floor plans and extraction config |
| `tools`           | Floor plan extraction (Python)           |
| `docs`            | Schema reference and decisions           |

Open a specific apartment with `/?project=<id>`. To turn a floor plan PDF into an apartment draft, see [tools/README.md](tools/README.md).

See [docs/schema.md](docs/schema.md) for the apartment format.

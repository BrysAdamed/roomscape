# Roomscape

Browser 3D apartment viewer (TypeScript, React, React Three Fiber) plus a Python tool that turns vector floor-plan PDFs into apartment JSON.

- Apartment format: [docs/schema.md](docs/schema.md)
- Authoring workflow (new apartment from a PDF, applying the user's exported JSON, adding materials and furniture types): [docs/authoring.md](docs/authoring.md)
- Extraction tool: [tools/README.md](tools/README.md)

Checks before committing: `npm run lint`, `npm test`, `npm run build`, `npx prettier --check .`, and `python -m unittest discover -s tools -t .` when the tool changed.

Tickets live in the RSC project of the ticketing app.

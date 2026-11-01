# Authoring apartments

How an apartment goes from a floor plan to `public/projects/<id>.json`, and how the user's changes come back. Written for whoever (human or Claude) continues the work.

## Ground rules

- The apartment JSON is the source of truth; the viewer never saves, it only exports. Format: [schema.md](schema.md).
- Units are metres; plan points are `[x, y]` with y pointing down the plan; rotations are degrees, counter-clockwise in plan view.
- Every apartment in `public/projects/` must be listed in `public/projects/index.json` (a test enforces both directions) and must validate (`npm test` runs the validator on every file).
- Keep the file in the export layout (2-space indent, plan points on one line). Prettier ignores these files on purpose so that an export from the viewer diffs line by line against the committed file.

## New apartment from a PDF

1. Put the PDF and an `extract.json` in `plans/<id>/` (see [tools/README.md](../tools/README.md) for the config fields: clip per floor, origin, scale, wall colour).
2. Run the extractor with a debug overlay and read the report:

   ```bash
   python -m tools.plan_extract plans/<id>/extract.json --debug-dir .debug
   ```

   Check that the fitted scale matches the configured one, that room areas are within ~1% of the plan's table, and that doors open the right way (compare the PNGs with the PDF).

3. Write the draft: add `--out public/projects/<id>.json`, add the id to `index.json`, run `npm test`.
4. Fix what extraction cannot know, in the config `overrides` when it is about openings (window sills and heights, balcony doors), or directly in the JSON afterwards: wall materials, floor materials, furniture.
5. Furniture: the report lists candidates per room (centre and footprint). Map each to a furniture type and add it to the floor's `furniture` array. Rotation `0` means the front faces +y (down the plan).
6. Open `/?project=<id>`, check both floors, measure a few things with the ruler against the plan.

Keep the manual decisions reproducible in `plans/<id>/author.py` (see `plans/harmonia-ii-5-1-1/author.py`): it reruns the extraction and then applies stairs, room fixes, materials and furniture, so the JSON can be rebuilt at any time. Changes the user makes in the viewer come back as exported JSON; fold them into `author.py` too, or the next rebuild drops them.

## Applying a user's exported JSON

The user changes materials in the viewer, exports, and sends the file back.

1. Validate it: drop it on the viewer, or copy it over the project file and run `npm test`.
2. Diff it against the committed file (`git diff --no-index public/projects/<id>.json <export>.json`). Thanks to the shared layout, each change is one line.
3. Copy it over the project file (the export is the complete apartment), review the diff once more, commit with a message that lists the changes.

## Adding a material

Add an entry to `src/catalogue/materials.ts` with a unique id, category, colour, roughness and metalness. The category decides the procedural texture (`src/scene/textures/patterns.ts`) and in which pickers it appears. Ids are referenced from apartments, so never rename or remove one that is in use.

## Adding a furniture type

1. Create `src/catalogue/furniture/<type>.tsx` with `defineFurniture`: `id`, `name`, default `params` (metres), material `slots` (label, allowed categories, default material), `size(params)` returning `[width, depth, height]`, and the component. Build it from `Box` (metre UVs, shadows) and place it with its footprint centred on the origin, standing on y = 0, front towards +z.
2. Register it in `src/catalogue/furniture/registry.ts`. The registry test checks slot defaults.

## Conventions worth knowing

- Walls meeting at a corner share the end point; the wall listed first is extended to fill the corner.
- Openings: `offset` is measured from the wall start to the opening's near edge. A door without `door` settings is an open doorway.
- Room polygons follow the inner wall faces; their area is what the viewer shows.

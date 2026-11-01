# Tools

## `plan_extract` – floor plan PDF → apartment JSON draft

Reads a vector floor-plan PDF (tested with Archicad exports and a Microsoft Print to PDF sales sheet) and produces an apartment JSON draft with walls, openings and rooms, plus a report used to finish the apartment by hand.

### Setup

Python 3.12+:

```bash
pip install -r tools/requirements.txt
```

### Usage

Run from the repository root:

```bash
python -m tools.plan_extract plans/harmonia-ii-5-1-1/extract.json --out public/projects/harmonia-ii-5-1-1.json --debug-dir .debug
```

| Option        | Purpose                                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config`      | Extraction config (see below).                                                                                                                           |
| `--out`       | Write the apartment JSON (same layout as the viewer's export).                                                                                           |
| `--debug-dir` | Write one PNG per floor: walls (red centre lines), openings (blue doors, green windows, orange passages), rooms (purple), furniture candidates (orange). |

Without `--out` it only prints the report:

- **scale**: configured drawing scale and the scale fitted to the listed room areas (least squares, rooms more than 10% off the median ignored). A difference above ~1% means the configured scale or the plan is off.
- **rooms**: listed vs extracted area per room. Rooms with no wall between them (e.g. a hall open to the living room) come out merged; a room whose listed area excludes the stair opening comes out larger.
- **openings**: kind, width, and for doors the hinge end and swing side.
- **furniture candidates**: clusters of symbol strokes per room, with centre and footprint in plan metres, to be mapped to furniture types by hand.

Open the result in the viewer at `/?project=<id>`.

### Config

One folder per plan in `plans/`, holding the PDF and an `extract.json`:

```json
{
  "pdf": "plan.pdf",
  "id": "harmonia-ii-5-1-1",
  "name": "Harmonia II – 5.1.1",
  "pointsPerMetre": 19.843,
  "wallFill": [0.7529, 0.7529, 0.7529],
  "defaults": { "wallMaterial": "paint-white", "floorMaterial": "wood-oak-natural" },
  "floors": [
    {
      "id": "parter",
      "name": "Parter",
      "elevation": 0,
      "height": 2.65,
      "clip": [90, 238, 275, 492],
      "origin": [137.42, 245.46]
    }
  ],
  "overrides": { "openings": { "parter-o-01": { "sillHeight": 0, "height": 2.2 } } }
}
```

| Field                | Meaning                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pointsPerMetre`     | PDF points per metre. Scale 1:N printed at P% is `72 / 0.0254 / N × P/100` (1:100 at 70% → 19.843). Check it against the fitted value in the report. |
| `wallFill`           | RGB fill colour of cut walls (0–1).                                                                                                                  |
| `floors[].clip`      | PDF rectangle `[x0, y0, x1, y1]` (points, y down) holding that floor's drawing and nothing else.                                                     |
| `floors[].origin`    | PDF point that becomes plan `[0, 0]`. Pick the same building corner on every floor so the floors line up.                                            |
| `floors[].elevation` | Floor level in metres (e.g. stairs 16 × 18.25 cm → 2.92).                                                                                            |
| `defaults`           | Materials and opening sizes: `doorHeight` 2.05, `windowSill` 0.85, `windowHeight` 1.5, `glazedHeight` 2.2.                                           |
| `overrides.openings` | Fields merged into a generated opening by id (`null` removes a field). Window sills and heights are not on plans, so they live here.                 |

Finding clips and colours: list the drawings with PyMuPDF (`page.get_drawings()`) and look for the fill colour used by walls only.

### How it works

1. Wall fills inside the clip are cut to the clip paths they are drawn under (some exporters draw a wall as one rectangle and cut the door gaps out with a clip path), then unioned on a grid over their distinct coordinates (walls are rectilinear, so this is exact).
2. The union is split into rectangles; wall layers ending at slightly offset jambs are merged; each rectangle becomes a centre line with a thickness. End points are snapped to the centre line of the wall they meet, so the viewer's corner rule rebuilds the drawn corners.
3. Collinear gaps between walls, and gaps between a wall end and a perpendicular wall, become openings. A swing arc next to the gap (a Bézier curve, or a run of short line segments turning the same way when the exporter flattened it) makes it a door (hinge and side from the arc); a dashed arc a glazed door; no arc a window in thick walls or an open passage in thin ones.
4. Openings (except passages) are closed and the free space is flood-filled; enclosed regions are matched to the room labels (`NN / NAME / area m2`, `area m2 / Name`, or a bare `Name` with the area below it; unnumbered rooms get ids from their names) they contain.

### Tests

```bash
python -m unittest discover -s tools -t .
```

`test_harmonia.py` and `test_lofty.py` run the whole extraction on the two reference plans and check room areas and door counts (and the fitted scale on Harmonia, whose rooms are all full height).

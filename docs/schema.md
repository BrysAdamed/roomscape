# Apartment schema

An apartment is a single JSON file in `public/projects/`. The viewer renders it, Claude authors it, and the viewer's export produces the same format. The source of truth for the shape is [`src/schema/apartment.ts`](../src/schema/apartment.ts); semantic checks live in [`src/schema/validate.ts`](../src/schema/validate.ts).

## Conventions

| Topic          | Rule                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Units          | Metres. Rotations in degrees.                                                                                                                     |
| Plan points    | `[x, y]` as drawn on the floor plan, x to the right and y downwards. In 3D, plan x is world X and plan y is world Z (Y-up).                       |
| Ids            | Lower-case kebab-case (`w-north`, `bed-1`), unique across the whole apartment.                                                                    |
| Materials      | Referenced by id from the catalogue in [`src/catalogue/materials.ts`](../src/catalogue/materials.ts), or a custom colour `#rrggbb` (matte paint). |
| Wall sides     | `left` / `right` as seen when walking from `start` to `end`.                                                                                      |
| Rotation       | Counter-clockwise in plan view around the item's position. At `0` a piece's front faces +y (the bottom of the plan).                              |
| Schema version | `schemaVersion` is `1`. Breaking changes bump it.                                                                                                 |

## Structure

```
Apartment { schemaVersion, id, name, north?, location?, floors[] }
Floor     { id, name, elevation, height, walls[], openings[], rooms[], furniture[], stairs[]?, railings[]?, roof?, planImage? }
Wall      { id, start, end, thickness, height?, materials { left, right } }
Opening   { id, wallId, kind, offset, width, height, sillHeight, frameMaterial?, door? }
Door      { hinge, opensTo, material? }
Room      { id, name, polygon[], floorMaterial, outdoor? }
Furniture { id, type, position, elevation?, rotation, params, materials }
Stairs    { id, riserHeight, steps[][], closed?, material }
Railing   { id, points[], height?, style?, material? }
Roof      { slopes[], dormers[]?, windows[]? }
PlanImage { src, bounds }
```

### Apartment

- `north`: optional bearing of north in degrees, clockwise from plan up (the top of the drawing, -y). Read it from the plan's north arrow; the viewer shows a compass when it is set.
- `location`: optional `{ latitude, longitude, timeZone? }` (IANA zone, e.g. `Europe/Warsaw`) used by the viewer's sun clock to place the sun. Defaults to Warsaw.

### Floor

- `elevation`: height of the floor surface above the apartment's ground level.
- `height`: floor-to-ceiling height; walls default to it.

### Wall

- `start` / `end`: centre-line end points. Walls meeting at a corner share the end point.
- `thickness`: full wall thickness, centred on the centre line.
- `height`: optional, defaults to the floor height. Must not exceed it.

### Opening

- `wallId`: wall on the same floor that holds the opening.
- `kind`: `door` or `window`.
- `offset`: distance along the wall from `start` to the opening's near edge.
- `width`, `height`: clear opening size. `sillHeight`: distance from the floor to the bottom of the opening (`0` for doors).
- `frameMaterial`: optional material of the window frame or the door lining and architraves (default white lacquer).
- `door` (doors only): `hinge` is the wall end (`start` or `end`) the leaf hangs on; `opensTo` is the wall side (`left` or `right`) the leaf swings into. A door without `door` settings is an open doorway (no leaf).
- `door.material`: optional leaf material (default white lacquer).

### Room

- `polygon`: floor outline (at least three points), usually traced along the inner wall faces.
- `floorMaterial`: material of the floor surface.
- `outdoor`: balconies, terraces and gardens; they get no ceiling under a roof.

### Furniture

- `type`: furniture type id from the furniture registry (e.g. `bed`, `desk`).
- `position`: plan point of the item's footprint centre. `elevation`: optional height above the floor (e.g. wall cabinets).
- `params`: type-specific values such as dimensions (`width`, `depth`, `height`).
- `materials`: map of the type's material slots (e.g. `frame`, `bedding`) to material ids.

### Stairs

- `steps`: one polygon per tread, bottom to top; tread `k` (1-based) tops out at `k × riserHeight`, the last riser leads onto the floor above. Any shape (straight, L, winders) is a list of polygons.
- `closed`: risers, side stringers and a sloped soffit underneath (for stairs over a room, such as a WC below); open treads otherwise.
- `material`: tread material.

### Railing

- Balcony and terrace railings. `points` is the railing's polyline (at least two plan points), usually inset a few centimetres from the balcony's open edges. `height` defaults to 1.1 m, `style` is `glass` (default) or `bars`, `material` is the frame (default black metal).

### Roof

- Sloped ceilings of an attic storey. The ceiling at a point is the lowest slope there, capped at the storey `height`; walls are cut to follow it and indoor rooms get a ceiling surface.
- `slopes[]`: `{ origin, uphill, height, pitch }`: the slope is `height` metres above the floor along the line through `origin`, and rises at `pitch` degrees in the horizontal unit direction `uphill`.
- `dormers[]`: plan rectangles `[x0, y0, x1, y1]` where the ceiling stays at full height.
- `windows[]`: roof windows `{ id, position, width, length, material? }`, set into the slope above `position` (plan point of the window centre); `width` runs along the eaves, `length` up the slope.

### Plan image

- Optional source plan for the floor, shown under the model by the viewer's Plan toggle. `src` is relative to the web root; `bounds` is `[x0, y0, x1, y1]` in plan metres. The extractor writes both (`--plan-images`).

## Validation

`validateApartment(json)` returns either the typed apartment or a list of errors prefixed with the JSON path, for example:

```
floors.0.openings.0: opening 'door-1' extends past the end of wall 'w-south'
floors.0.walls.0.materials.right: unknown material 'paint-neon'
```

It checks the shape and also: unique ids, known materials, openings referencing an existing wall on the same floor and fitting within its length and height, non-zero wall lengths, and no door settings on windows.

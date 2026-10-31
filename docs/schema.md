# Apartment schema

An apartment is a single JSON file in `public/projects/`. The viewer renders it, Claude authors it, and the viewer's export produces the same format. The source of truth for the shape is [`src/schema/apartment.ts`](../src/schema/apartment.ts); semantic checks live in [`src/schema/validate.ts`](../src/schema/validate.ts).

## Conventions

| Topic          | Rule                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Units          | Metres. Rotations in degrees.                                                                                               |
| Plan points    | `[x, y]` as drawn on the floor plan, x to the right and y downwards. In 3D, plan x is world X and plan y is world Z (Y-up). |
| Ids            | Lower-case kebab-case (`w-north`, `bed-1`), unique across the whole apartment.                                              |
| Materials      | Referenced by id from the catalogue in [`src/catalogue/materials.ts`](../src/catalogue/materials.ts).                       |
| Wall sides     | `left` / `right` as seen when walking from `start` to `end`.                                                                |
| Rotation       | Counter-clockwise in plan view around the item's position. At `0` a piece's front faces +y (the bottom of the plan).        |
| Schema version | `schemaVersion` is `1`. Breaking changes bump it.                                                                           |

## Structure

```
Apartment { schemaVersion, id, name, floors[] }
Floor     { id, name, elevation, height, walls[], openings[], rooms[], furniture[] }
Wall      { id, start, end, thickness, height?, materials { left, right } }
Opening   { id, wallId, kind, offset, width, height, sillHeight, door? }
Door      { hinge, opensTo, material? }
Room      { id, name, polygon[], floorMaterial }
Furniture { id, type, position, elevation?, rotation, params, materials }
```

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
- `door` (doors only): `hinge` is the wall end (`start` or `end`) the leaf hangs on; `opensTo` is the wall side (`left` or `right`) the leaf swings into.

### Room

- `polygon`: floor outline (at least three points), usually traced along the inner wall faces.
- `floorMaterial`: material of the floor surface.

### Furniture

- `type`: furniture type id from the furniture registry (e.g. `bed`, `desk`).
- `position`: plan point of the item's footprint centre. `elevation`: optional height above the floor (e.g. wall cabinets).
- `params`: type-specific values such as dimensions (`width`, `depth`, `height`).
- `materials`: map of the type's material slots (e.g. `frame`, `bedding`) to material ids.

## Validation

`validateApartment(json)` returns either the typed apartment or a list of errors prefixed with the JSON path, for example:

```
floors.0.openings.0: opening 'door-1' extends past the end of wall 'w-south'
floors.0.walls.0.materials.right: unknown material 'paint-neon'
```

It checks the shape and also: unique ids, known materials, openings referencing an existing wall on the same floor and fitting within its length and height, non-zero wall lengths, and no door settings on windows.

# Roomscape

Walk through an apartment before it exists. Roomscape turns a developer's floor plan PDF into a 3D model you can explore in the browser.

**Live demo:** https://brysadamed.github.io/roomscape/

## What it does

- **Explore in 3D.** Orbit around the whole apartment or switch to first-person and walk through the rooms. Preset views include a top view for comparing the model against the plan.
- **Realistic enough to judge a space.** Wood floors, tiles, plaster and fabrics are generated procedurally at real-world scale. Sunlight casts soft shadows through the windows, and ambient occlusion shades corners and the gaps under furniture.
- **Measure anything.** Select a wall, room or piece of furniture to see its dimensions in the side panel and in the scene. Toggle labels for every wall length, or use the ruler to measure between any two points, for example from the sofa to the TV.
- **Try out finishes.** Pick paint for each side of a wall, and choose floor finishes, furniture and stair materials from a catalogue. Export the result as JSON to keep it.
- **Multi-storey apartments.** Switch between floors while the floor below shows through faintly. Stairs are modelled from the plan. A cutaway view lowers the walls to see into the rooms from above.
- **Compare versions.** An apartment can come with variants, such as a study turned into a guest room or a partition wall removed. Pick one from the project bar to see it; the link includes the variant, so it can be shared.
- **Check against the source.** Lay the original floor plan under the model to see how well it lines up.

Each apartment is a single JSON file (walls, doors, windows, rooms, furniture, stairs; see [docs/schema.md](docs/schema.md)). A Python tool reads the PDF's vector drawing to get the walls, openings and rooms. It works out the scale from the room areas printed on the plan, and an AI agent finishes the model: it fixes what the extraction got wrong and furnishes the rooms.

## Running

Requires Node 22+.

```bash
npm install
npm run dev
```

Open the printed URL and pick a project. `/?project=<id>` opens one directly. You can also open an exported JSON file from the picker or drop it anywhere on the page.

## How to add a new apartment

Ask a coding agent (for example Claude Code) working in this repository to do it, and give it the plan:

> Add a new apartment from `C:\path\to\plan.pdf`.

The agent follows [docs/authoring.md](docs/authoring.md):

1. Copy the PDF into `plans/<id>/`.
2. Run the extraction tool ([tools/README.md](tools/README.md)), which needs Python 3 and PyMuPDF.
3. Correct the result and furnish the rooms in a per-apartment `author.py` script.
4. Check the room areas against the plan's area table.
5. Register the project in `public/projects/index.json`.

It works best with vector PDFs exported from CAD software (most developer plans are). Scanned plans need far more manual work.

To get another version of an apartment to compare, ask for a variant, for example "add a variant of Lofty B8 where the study is a guest room". To change an existing apartment, edit it in the viewer, export the JSON and hand it to the agent along with what you changed. The agent then writes the changes into that apartment's `author.py`, so they survive the next regeneration.

## How to add or modify furniture

Furniture is drawn in code, not loaded from model files: each type (sofa, wardrobe, kitchen counter, ...) is a small component in [`src/catalogue/furniture/`](src/catalogue/furniture/) built from simple shapes, with sizes in metres and material slots you can recolour in the viewer.

To see everything that exists, open the **Furniture showroom** from the project picker (or `/?project=showroom`). It lays out every type on one floor, grouped by room, with its name and type id above it; select a piece to see its dimensions and materials.

The easiest way to change furniture is again to ask the agent, for example:

> Put the bed from the showroom in the study instead of the desk.

> Add a round dining table and an armchair to the catalogue and use them in the living room.

> Make the kitchen counter in Lofty B8 longer and move the sink under the window.

Asking for more variety is welcome: the agent adds a new furniture type (following [docs/authoring.md](docs/authoring.md#adding-a-furniture-type)), it shows up in the showroom automatically, and it can then be placed in any apartment.

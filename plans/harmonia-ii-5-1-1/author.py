"""Builds public/projects/harmonia-ii-5-1-1.json: the extraction draft plus what the plan cannot tell.

Run from the repository root: python -m plans.harmonia-ii-5-1-1.author  (or: python plans/harmonia-ii-5-1-1/author.py)
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from tools.plan_extract.__main__ import write_plan_images  # noqa: E402
from tools.plan_extract.apartment import build_apartment, serialize  # noqa: E402
from tools.plan_extract.config import load_config  # noqa: E402
from tools.plan_extract.extract import extract_floor  # noqa: E402
from tools.plan_extract.geometry import polygon_area  # noqa: E402
from tools.plan_extract.lamps import pendant_lamps  # noqa: E402
from tools.plan_extract.translate import english_room_name  # noqa: E402
from tools.plan_extract.pdf import read_plan  # noqa: E402

CONFIG = Path(__file__).with_name('extract.json')
OUTPUT = ROOT / 'public' / 'projects' / 'harmonia-ii-5-1-1.json'

LISTED_AREAS = {
    'room-01-02': 7.14 + 32.05, 'room-03': 3.99, 'room-04': 13.75, 'room-05': 4.69, 'room-06': 7.23,
    'room-07': 10.29, 'room-08': 14.06, 'room-09': 2.53, 'room-10': 3.87, 'room-11': 13.75, 'room-12': 4.69,
    'room-13': 3.24,
}

ROOM_POLYGONS = {
    # Extraction notches at window jambs removed; 06 excludes the stairwell void (as the plan's area does).
    'room-01-02': [[0.385, 5.16], [2.375, 5.16], [2.375, 2.87], [3.605, 2.87], [3.605, 5.16], [6.115, 5.16],
                   [6.115, 11.61], [0.385, 11.61], [0.385, 6.6], [1.735, 6.6], [1.735, 7.22], [2.375, 7.22],
                   [2.375, 6.5], [0.385, 6.5]],
    'room-06': [[3.602, 6.49], [4.77, 6.49], [4.77, 7.49], [2.372, 7.49], [2.372, 2.87], [3.602, 2.87]],
    'room-08': [[3.492, 7.57], [3.492, 11.61], [0.382, 11.61], [0.382, 6.6], [1.732, 6.6], [1.732, 7.22],
                [2.292, 7.22], [2.292, 7.57]],
}

BALCONY = {'id': 'room-13', 'name': 'Balkon', 'polygon': [[0.08, -1.165], [2.86, -1.165], [2.86, 0.0], [0.08, 0.0]],
           'floorMaterial': 'tile-grey-concrete', 'outdoor': True}
BALCONY_RAILING = {'id': 'railing-13', 'points': [[0.11, 0.0], [0.11, -1.135], [2.83, -1.135], [2.83, 0.0]]}

TILED = {'room-05', 'room-09', 'room-12', 'room-13'}


def item(item_id: str, type_id: str, x: float, y: float, rotation: float = 0, elevation: float = 0,
         **params: float) -> dict:
    placed = {'id': item_id, 'type': type_id, 'position': [x, y], 'rotation': rotation, 'params': params,
              'materials': {}}
    return {**placed, 'elevation': elevation} if elevation else placed


FURNITURE = {
    'parter': [
        item('desk-04', 'desk', 2.19, 0.69),
        item('chair-04', 'chair', 2.19, 1.12, 180),
        item('wardrobe-04', 'wardrobe', 1.39, 2.48, 180, width=2.0, depth=0.6, doors=3),
        item('bed-04', 'bed', 5.12, 2.33, -90, width=0.9, length=2.0),
        item('shelves-03-west', 'wardrobe', 0.635, 3.92, 90, width=1.9, depth=0.5, doors=3),
        item('shelves-03-north', 'wardrobe', 1.63, 3.12, 0, width=1.2, depth=0.5, doors=2),
        item('washbasin-05', 'washbasin', 4.26, 3.12),
        item('toilet-05', 'toilet', 4.5, 4.29, 180),
        item('bathtub-05', 'bathtub', 5.76, 3.68, 90, width=1.5, depth=0.7),
        item('counter-west', 'kitchen-counter', 0.685, 8.0, 90, width=2.8, sinkOffset=1.25),
        item('counter-north', 'kitchen-counter', 1.06, 6.9, 0, width=1.35, hobOffset=0.7),
        item('wall-cabinets-west', 'wall-cabinet', 0.56, 8.0, 90, 1.45, width=2.8),
        item('hood', 'cooker-hood', 1.085, 6.85, 0, 1.55, chimney=1.02),
        item('pantry', 'wardrobe', 0.685, 10.45, 90, width=2.2, depth=0.6, height=2.3, doors=4),
        item('table-02', 'table', 4.545, 7.315, 0, width=1.6, depth=0.8),
        *[item(f'chair-02-n{i}', 'chair', x, 6.81) for i, x in enumerate((3.945, 4.545, 5.145), 1)],
        *[item(f'chair-02-s{i}', 'chair', x, 7.82, 180) for i, x in enumerate((3.945, 4.545, 5.145), 1)],
        item('sofa-02', 'sofa', 2.375, 9.94, 90, width=2.24, depth=0.95, chaise=2.0),
        item('coffee-table-02', 'table', 3.375, 9.6, 0, width=0.55, depth=0.85, height=0.4),
        item('tv-02', 'tv-unit', 5.91, 9.6, -90, width=1.6),
    ],
    'pietro-1': [
        item('desk-11', 'desk', 2.59, 0.69),
        item('chair-11', 'chair', 2.59, 1.12, 180),
        item('wardrobe-11', 'wardrobe', 1.39, 2.48, 180, width=2.0, depth=0.6, doors=3),
        item('bed-11', 'bed', 5.12, 2.33, -90, width=0.9, length=2.0),
        item('shelves-10-west', 'wardrobe', 0.632, 3.9, 90, width=2.0, depth=0.5, doors=3),
        item('shelves-10-north', 'wardrobe', 1.6, 3.12, 0, width=1.2, depth=0.5, doors=2),
        item('washbasin-12', 'washbasin', 4.26, 3.12),
        item('toilet-12', 'toilet', 4.5, 4.29, 180),
        item('bathtub-12', 'bathtub', 5.76, 3.69, 90, width=1.5, depth=0.7),
        item('washer-09', 'washing-machine', 0.672, 5.5, 90),
        item('dryer-09', 'washing-machine', 0.672, 6.12, 90),
        item('wardrobe-08', 'wardrobe', 1.06, 6.9, 0, width=1.34, depth=0.6, doors=2),
        item('bed-08', 'bed', 1.38, 9.49, 90, width=1.6, length=2.0),
        item('wardrobe-07', 'wardrobe', 5.42, 7.88, 0, width=1.4, depth=0.6, doors=2),
        item('desk-07', 'desk', 3.87, 9.91, 90),
        item('chair-07', 'chair', 4.32, 9.91, -90),
        item('bed-07', 'bed', 5.67, 10.61, 0, width=0.9, length=2.0),
    ],
}


def stairs_steps() -> list[list[list[float]]]:
    """U-shaped flight from the plan: 6 straight treads east, 8 winders turning 180° along the east wall, top tread."""
    steps = [[[x, 5.165], [x + 0.25, 5.165], [x + 0.25, 6.165], [x, 6.165]]
             for x in (3.605 + 0.25 * i for i in range(6))]
    pivot = (5.105, 6.3275)
    box = (5.105, 6.115, 5.165, 7.49)

    def hit(theta: float) -> list[float]:
        dx, dy = math.sin(theta), -math.cos(theta)
        distances = [(box[1] - pivot[0]) / dx] if dx > 1e-9 else []
        if dy < -1e-9:
            distances.append((box[2] - pivot[1]) / dy)
        if dy > 1e-9:
            distances.append((box[3] - pivot[1]) / dy)
        t = min(distances)
        return [pivot[0] + dx * t, pivot[1] + dy * t]

    corners = [(math.atan2(box[1] - pivot[0], pivot[1] - box[2]), [box[1], box[2]]),
               (math.pi - math.atan2(box[1] - pivot[0], box[3] - pivot[1]), [box[1], box[3]])]
    winders = 8
    for k in range(1, winders + 1):
        a, b = math.pi * (k - 1) / winders, math.pi * k / winders
        steps.append([list(pivot), hit(a), *[c for angle, c in corners if a < angle < b], hit(b)])
    steps.append([[5.105, 6.49], [5.105, 7.49], [4.77, 7.49], [4.77, 6.49]])
    return [[[round(x, 3), round(y, 3)] for x, y in polygon] for polygon in steps]


def author() -> dict:
    config = load_config(CONFIG)
    results = [extract_floor(read_plan(config.pdf, f.clip, config.wall_fill, config.page), f, config.points_per_metre)
               for f in config.floors]
    images = write_plan_images(config, OUTPUT.with_suffix(''), ROOT / 'public')
    apartment = build_apartment(config, results, config.points_per_metre, images)
    floors = {floor['id']: floor for floor in apartment['floors']}

    floors['pietro-1']['rooms'].append(dict(BALCONY))
    floors['pietro-1']['railings'] = [BALCONY_RAILING]
    for floor in apartment['floors']:
        for room in floor['rooms']:
            room['polygon'] = ROOM_POLYGONS.get(room['id'], room['polygon'])
            if room['id'] in TILED:
                room['floorMaterial'] = 'tile-grey-concrete'
        floor['furniture'] = FURNITURE[floor['id']]
    for floor in apartment['floors']:
        for room_ in floor['rooms']:
            room_['name'] = english_room_name(room_['name'])
    floors['parter']['stairs'] = [
        {'id': 'stairs-1', 'riserHeight': 0.1825, 'steps': stairs_steps(), 'material': 'wood-oak-natural'}]
    for floor in apartment['floors']:
        floor['furniture'] = floor['furniture'] + pendant_lamps(floor)
    return apartment


def report(apartment: dict) -> None:
    for floor in apartment['floors']:
        for room in floor['rooms']:
            area = polygon_area([tuple(p) for p in room['polygon']])
            listed = LISTED_AREAS.get(room['id'])
            error = f'{(area / listed - 1) * 100:+.1f}%' if listed else ''
            print(f"{floor['id']:9} {room['id']:11} {room['name']:32} {area:6.2f} / {listed or 0:6.2f} {error}")


if __name__ == '__main__':
    result = author()
    report(result)
    OUTPUT.write_text(serialize(result), encoding='utf-8', newline='\n')
    print(f'wrote {OUTPUT}')

"""Builds public/projects/lofty-madalinskiego-b8.json: the extraction draft plus what the plan cannot tell.

Run from the repository root: python plans/lofty-madalinskiego-b8/author.py
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
OUTPUT = ROOT / 'public' / 'projects' / 'lofty-madalinskiego-b8.json'
TILES = 'tile-grey-concrete'

LISTED_AREAS = {
    'room-komunikacja-1': 11.05, 'room-salon-z-aneksem': 20.14, 'room-wc-1': 1.89, 'room-gabinet': 9.52,
    'room-komunikacja-2': 7.91, 'room-sypialnia-1': 17.16, 'room-sypialnia-2': 7.95, 'room-garderoba': 1.49,
    'room-wc-2': 2.76, 'room-sypialnia-3': 10.07, 'room-sypialnia-4': 18.36, 'room-lazienka': 6.95,
    'room-balkon-1': 3.05, 'room-balkon-2': 3.05,
}

# Attic headroom from the plan's H=220cm / H=140cm lines (the roof ridge runs north-south). PN-ISO 9836 counts
# floor under 1.4–2.2 m at half and under 1.4 m not at all; the dormers at the balcony doors are full height.
HEADROOM_BANDS = [((-math.inf, 0.875), 0.0), ((0.875, 2.448), 0.5), ((8.33, 9.898), 0.5), ((9.898, math.inf), 0.0)]
DORMERS = [(-math.inf, 3.582, 2.448, 5.623), (8.33, 3.829, math.inf, 5.871)]

# The same roof for the viewer: slopes 1.4 m high at the H=140cm lines rising to 2.2 m at the H=220cm lines, dormers
# kept at full height. Roof windows are the plan's dashed rectangles (1.03 m wide); the plan draws them from the knee
# wall, a 1.6 m long window is aligned with their upper edge.
ROOF_PITCH = math.degrees(math.atan((2.2 - 1.4) / (2.448 - 0.875)))
ROOF_WINDOW = {'width': 1.03, 'length': 1.6}
ROOF = {
    'slopes': [
        {'origin': [0.875, 0.0], 'uphill': [1.0, 0.0], 'height': 1.4, 'pitch': round(ROOF_PITCH, 3)},
        {'origin': [9.898, 0.0], 'uphill': [-1.0, 0.0], 'height': 1.4, 'pitch': round(ROOF_PITCH, 3)},
    ],
    'dormers': [[-2.0, 3.582, 2.448, 5.623], [8.33, 3.829, 12.5, 5.871]],
    'windows': [
        {'id': 'roof-window-sypialnia-4', 'position': [1.315, 1.971], **ROOF_WINDOW},
        {'id': 'roof-window-sypialnia-3', 'position': [1.315, 7.196], **ROOF_WINDOW},
        {'id': 'roof-window-sypialnia-1', 'position': [9.472, 1.813], **ROOF_WINDOW},
        {'id': 'roof-window-sypialnia-2', 'position': [9.472, 7.796], **ROOF_WINDOW},
    ],
}

WALL_REMOVALS = {
    # The entrance jamb read as a wall across the vestibule, corner stubs of the garden wall, the split east wall.
    'parter': {'parter-w-02', 'parter-w-05', 'parter-w-06', 'parter-w-13', 'parter-w-26'},
    # Door jambs read as walls across the corridor; the split east and west walls.
    'poddasze': {'poddasze-w-09', 'poddasze-w-10', 'poddasze-w-17', 'poddasze-w-32'},
}
WALL_ENDS = {
    'parter-w-01': {'end': [8.386, 3.935]},
    'parter-w-03': {'start': [0.341, 5.845]},
    'parter-w-14': {'start': [0.341, 5.845]},
    'parter-w-24': {'start': [8.386, 3.935]},
    'parter-w-25': {'end': [10.446, 10.55]},
    'poddasze-w-16': {'end': [0.186, 10.553]},
    'poddasze-w-31': {'end': [10.591, 10.553]},
}
NEW_WALLS = {
    'poddasze': [{'id': 'poddasze-w-33', 'start': [4.286, 6.443], 'end': [4.286, 7.613], 'thickness': 0.1}],
}

GLASS_DOOR = {'kind': 'window', 'height': 2.2, 'sillHeight': 0}
OPENING_CHANGES = {
    'parter-o-05': {'offset': 0.41},
    'poddasze-o-09': {**GLASS_DOOR, 'door': None},
}
NEW_OPENINGS = {
    'parter': [
        {'id': 'parter-o-06', 'wallId': 'parter-w-14', 'offset': 0.36, 'width': 2.01, **GLASS_DOOR},
        {'id': 'parter-o-07', 'wallId': 'parter-w-25', 'offset': 1.26, 'width': 1.34, **GLASS_DOOR},
    ],
    'poddasze': [
        {'id': 'poddasze-o-10', 'wallId': 'poddasze-w-33', 'offset': 0.15, 'width': 0.92, 'kind': 'door',
         'height': 2.05, 'sillHeight': 0, 'door': {'hinge': 'start', 'opensTo': 'right'}},
        {'id': 'poddasze-o-11', 'wallId': 'poddasze-w-16', 'offset': 3.855, 'width': 1.29, **GLASS_DOOR},
    ],
}


def room(room_id: str, name: str, polygon: list[list[float]], material: str = 'wood-oak-natural',
         outdoor: bool = False) -> dict:
    result = {'id': room_id, 'name': name, 'polygon': polygon, 'floorMaterial': material}
    return {**result, 'outdoor': True} if outdoor else result


ROOMS = {
    'parter': [
        room('room-komunikacja-1', 'Komunikacja 1',
             [[6.581, 4.085], [8.221, 4.085], [8.221, 7.175], [7.561, 7.175], [7.561, 10.445], [5.591, 10.445],
              [5.591, 9.405], [6.661, 9.405], [6.661, 7.175], [5.141, 7.175], [5.141, 5.945], [6.581, 5.945]]),
        room('room-salon-z-aneksem', 'Salon z aneksem', [[0.681, 5.945], [5.141, 5.945], [5.141, 10.445], [0.681, 10.445]]),
        room('room-wc-1', 'WC 1',
             [[5.251, 7.275], [6.561, 7.275], [6.561, 7.955], [6.301, 7.955], [6.301, 8.695], [6.561, 8.695],
              [6.561, 9.305], [5.251, 9.305]], TILES),
        room('room-gabinet', 'Gabinet',
             [[8.321, 6.095], [10.111, 6.095], [10.111, 10.445], [8.261, 10.445], [8.261, 9.845], [7.661, 9.845],
              [7.661, 7.275], [8.321, 7.275]]),
    ],
    'poddasze': [
        room('room-komunikacja-2', 'Komunikacja 2',
             [[4.336, 3.963], [6.456, 3.963], [6.456, 7.87], [5.556, 7.87], [5.556, 7.563], [4.336, 7.563]]),
        room('room-sypialnia-1', 'Sypialnia 1', [[6.536, 0.203], [10.406, 0.203], [10.406, 5.893], [6.536, 5.893]]),
        room('room-sypialnia-2', 'Sypialnia 2', [[6.536, 5.973], [10.406, 5.973], [10.406, 9.063], [6.536, 9.063]]),
        room('room-garderoba', 'Garderoba',
             [[7.656, 9.143], [10.406, 9.143], [10.406, 10.453], [8.256, 10.453], [8.256, 9.853], [7.656, 9.853]]),
        room('room-wc-2', 'WC 2',
             [[4.336, 7.663], [5.456, 7.663], [5.456, 9.303], [5.146, 9.303], [5.146, 10.453], [4.336, 10.453]], TILES),
        room('room-sypialnia-3', 'Sypialnia 3', [[0.376, 6.543], [4.236, 6.543], [4.236, 10.453], [0.376, 10.453]]),
        room('room-sypialnia-4', 'Sypialnia 4',
             [[0.376, 0.203], [4.236, 0.203], [4.236, 5.753], [4.126, 5.753], [4.126, 6.343], [0.376, 6.343]]),
        room('room-lazienka', 'Łazienka',
             [[4.336, 0.203], [5.936, 0.203], [5.936, 0.783], [6.436, 0.783], [6.436, 3.083], [5.856, 3.083],
              [5.856, 3.863], [4.336, 3.863]], TILES),
        room('room-balkon-1', 'Balkon', [[-1.111, 3.23], [-0.004, 3.23], [-0.004, 5.975], [-1.111, 5.975]], TILES,
             outdoor=True),
        room('room-balkon-2', 'Balkon', [[10.776, 3.477], [11.884, 3.477], [11.884, 6.222], [10.776, 6.222]], TILES,
             outdoor=True),
    ],
}


def item(item_id: str, type_id: str, x: float, y: float, rotation: float = 0, elevation: float = 0,
         **params: float) -> dict:
    placed = {'id': item_id, 'type': type_id, 'position': [x, y], 'rotation': rotation, 'params': params,
              'materials': {}}
    return {**placed, 'elevation': elevation} if elevation else placed


RAILINGS = {
    'poddasze': [
        {'id': 'railing-balkon-1', 'points': [[-0.004, 3.26], [-1.081, 3.26], [-1.081, 5.945], [-0.004, 5.945]]},
        {'id': 'railing-balkon-2', 'points': [[10.776, 3.507], [11.854, 3.507], [11.854, 6.192], [10.776, 6.192]]},
    ],
}

FURNITURE = {
    'parter': [
        item('table-salon', 'table', 2.27, 6.83, 0, width=1.8, depth=0.8),
        *[item(f'chair-salon-n{i}', 'chair', x, 6.23) for i, x in enumerate((1.67, 2.27, 2.87), 1)],
        *[item(f'chair-salon-s{i}', 'chair', x, 7.43, 180) for i, x in enumerate((1.67, 2.27, 2.87), 1)],
        item('sofa-salon', 'sofa', 2.1, 8.675, 0, width=2.26, depth=0.9, chaise=1.43),
        item('tv-salon', 'tv-unit', 2.13, 10.27, 180, width=1.4, depth=0.35),
        item('fridge-kitchen', 'fridge', 4.816, 7.5, -90),
        item('counter-east', 'kitchen-counter', 4.841, 9.123, -90, width=2.645, sinkOffset=1.32),
        item('counter-south', 'kitchen-counter', 3.911, 10.145, 180, width=1.26, hobOffset=0.63),
        item('wall-cabinets-east', 'wall-cabinet', 4.966, 9.1225, -90, 1.45, width=2.645),
        item('hood', 'cooker-hood', 3.911, 10.195, 180, 1.55, chimney=1.07),
        item('washbasin-wc-1', 'washbasin', 5.4, 8.13, 90, width=0.4, depth=0.3),
        item('toilet-wc-1', 'toilet', 5.91, 8.98, 180),
        item('wardrobe-komunikacja-1', 'wardrobe', 7.916, 6.415, -90, width=1.47, depth=0.6, doors=2),
        item('desk-gabinet', 'desk', 9.22, 6.44, 0, width=1.2, depth=0.65),
        item('chair-gabinet', 'chair', 9.22, 7.0, 180),
        item('wardrobe-gabinet', 'wardrobe', 9.186, 10.2, 180, width=1.85, depth=0.49, doors=3),
    ],
    'poddasze': [
        item('bed-sypialnia-4', 'bed', 2.86, 1.19, 0, width=1.4, length=2.0),
        item('desk-sypialnia-4', 'desk', 1.27, 3.0, 90, width=1.2, depth=0.7),
        item('chair-sypialnia-4', 'chair', 1.77, 3.0, -90),
        item('wardrobe-sypialnia-4', 'wardrobe', 2.965, 6.04, 180, width=2.31, depth=0.6, doors=3),
        item('desk-sypialnia-3', 'desk', 1.65, 6.85, 0),
        item('chair-sypialnia-3', 'chair', 1.65, 7.35, 180),
        item('bed-sypialnia-3', 'bed', 2.01, 10.05, 90, width=0.8, length=2.0),
        item('wardrobe-sypialnia-3', 'wardrobe', 3.936, 9.55, -90, width=1.8, depth=0.6, doors=3),
        item('bed-sypialnia-1', 'bed', 8.36, 1.28, 0, width=1.4, length=2.0),
        item('wardrobe-sypialnia-1', 'wardrobe', 6.836, 1.72, 90, width=3.05, depth=0.6, doors=4),
        item('desk-sypialnia-1', 'desk', 9.3, 5.59, 180),
        item('chair-sypialnia-1', 'chair', 9.3, 5.05),
        item('bed-sypialnia-2', 'bed', 8.53, 6.37, 90, width=0.8, length=2.0),
        item('desk-sypialnia-2', 'desk', 9.54, 7.67, -90, width=1.2, depth=0.7),
        item('chair-sypialnia-2', 'chair', 9.07, 7.67, 90),
        item('wardrobe-garderoba', 'wardrobe', 9.08, 10.153, 180, width=1.64, depth=0.6, doors=3),
        item('bathtub-lazienka', 'bathtub', 5.14, 0.51, 0, width=1.44, depth=0.62),
        item('washer-lazienka', 'washing-machine', 6.14, 1.46, -90),
        item('washbasin-lazienka', 'washbasin', 4.54, 2.13, 90, width=0.5, depth=0.4),
        item('toilet-lazienka', 'toilet', 6.13, 2.69, -90),
        item('toilet-wc-2', 'toilet', 4.74, 10.15, 180),
        item('washbasin-wc-2', 'washbasin', 5.31, 8.66, -90, width=0.4, depth=0.3),
    ],
}


def stairs_steps() -> list[list[list[float]]]:
    """Dog-leg flight from the plan: 3 treads south from the hall, 7 winders turning 180° under the WC, 6 treads north
    arriving at the attic corridor."""
    flight_down = [[[6.661, y], [7.561, y], [7.561, y + 0.3], [6.661, y + 0.3]] for y in (8.555, 8.855, 9.155)]
    pivot = (6.611, 9.455)
    box = (5.591, 7.561, 10.445)

    def hit(phi: float) -> list[float]:
        dx, dy = math.cos(phi), math.sin(phi)
        distances = [(box[2] - pivot[1]) / dy] if dy > 1e-9 else []
        if dx > 1e-9:
            distances.append((box[1] - pivot[0]) / dx)
        if dx < -1e-9:
            distances.append((box[0] - pivot[0]) / dx)
        t = min(distances)
        return [pivot[0] + dx * t, pivot[1] + dy * t]

    corners = [(math.atan2(box[2] - pivot[1], box[1] - pivot[0]), [box[1], box[2]]),
               (math.atan2(box[2] - pivot[1], box[0] - pivot[0]), [box[0], box[2]])]
    winders = 7
    steps = list(flight_down)
    for k in range(1, winders + 1):
        a, b = math.pi * (k - 1) / winders, math.pi * k / winders
        steps.append([list(pivot), hit(a), *[c for angle, c in corners if a < angle < b], hit(b)])
    depth = (9.455 - 7.87) / 6
    steps += [[[5.591, y - depth], [6.561, y - depth], [6.561, y], [5.591, y]]
              for y in (9.455 - depth * i for i in range(6))]
    return [[[round(x, 3), round(y, 3)] for x, y in polygon] for polygon in steps]


def author() -> dict:
    config = load_config(CONFIG)
    results = [extract_floor(read_plan(config.pdf, f.clip, config.wall_fill, config.page), f, config.points_per_metre)
               for f in config.floors]
    images = write_plan_images(config, OUTPUT.with_suffix(''), ROOT / 'public')
    apartment = build_apartment(config, results, config.points_per_metre, images)
    for floor in apartment['floors']:
        removed = WALL_REMOVALS.get(floor['id'], set())
        floor['walls'] = [wall | WALL_ENDS.get(wall['id'], {}) for wall in floor['walls'] if wall['id'] not in removed]
        material = config.defaults.wall_material
        floor['walls'] += [wall | {'materials': {'left': material, 'right': material}}
                           for wall in NEW_WALLS.get(floor['id'], [])]
        openings = [opening for opening in floor['openings'] if opening['wallId'] not in removed]
        for opening in openings:
            for key, value in OPENING_CHANGES.get(opening['id'], {}).items():
                if value is None:
                    opening.pop(key, None)
                else:
                    opening[key] = value
        floor['openings'] = openings + NEW_OPENINGS.get(floor['id'], [])
        floor['rooms'] = ROOMS[floor['id']]
        floor['furniture'] = FURNITURE[floor['id']]
        if floor['id'] == 'poddasze':
            floor['roof'] = ROOF
        if floor['id'] in RAILINGS:
            floor['railings'] = RAILINGS[floor['id']]
        floor['furniture'] = floor['furniture'] + pendant_lamps(floor)
    for floor in apartment['floors']:
        for room_ in floor['rooms']:
            room_['name'] = english_room_name(room_['name'])
    apartment['floors'][0]['stairs'] = [
        {'id': 'stairs-1', 'riserHeight': 0.1753, 'steps': stairs_steps(), 'material': 'wood-oak-natural'}]
    return apartment


def usable_area(polygon: list[list[float]]) -> float:
    """Area counted the PN-ISO 9836 way under the attic roof slopes."""
    area = polygon_area([tuple(p) for p in polygon])
    for (x0, x1), weight in HEADROOM_BANDS:
        band = _clip(polygon, (x0, -math.inf, x1, math.inf))
        lost = polygon_area(band) if len(band) > 2 else 0
        for dormer in DORMERS:
            inside = _clip(band, dormer)
            lost -= polygon_area(inside) if len(inside) > 2 else 0
        area -= lost * (1 - weight)
    return area


def _clip(polygon: list, rect: tuple[float, float, float, float]) -> list[tuple[float, float]]:
    points = [tuple(p) for p in polygon]
    for axis, limit, keep_below in ((0, rect[0], False), (0, rect[2], True), (1, rect[1], False), (1, rect[3], True)):
        if math.isinf(limit) or not points:
            continue
        inside = (lambda p: p[axis] <= limit) if keep_below else (lambda p: p[axis] >= limit)
        clipped = []
        for i, current in enumerate(points):
            previous = points[i - 1]
            if inside(current) != inside(previous):
                t = (limit - previous[axis]) / (current[axis] - previous[axis])
                clipped.append(tuple(a + (b - a) * t for a, b in zip(previous, current)))
            if inside(current):
                clipped.append(current)
        points = clipped
    return points


def report(apartment: dict) -> None:
    for floor in apartment['floors']:
        for room_ in floor['rooms']:
            area = polygon_area([tuple(p) for p in room_['polygon']])
            indoor = floor['id'] == 'poddasze' and not room_.get('outdoor')
            counted = usable_area(room_['polygon']) if indoor else area
            listed = LISTED_AREAS[room_['id']]
            print(f"{floor['id']:9} {room_['id']:21} {area:6.2f} floor, {counted:6.2f} counted / {listed:6.2f} listed"
                  f" {(counted / listed - 1) * 100:+.1f}%")


if __name__ == '__main__':
    result = author()
    report(result)
    OUTPUT.write_text(serialize(result), encoding='utf-8', newline='\n')
    print(f'wrote {OUTPUT}')

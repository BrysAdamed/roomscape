from __future__ import annotations

import json
import re
from typing import Any

from .config import Defaults, PlanConfig
from .extract import FloorResult
from .geometry import Point
from .openings import OpeningCandidate

PRIMITIVE_ARRAY = re.compile(
    r'\[\s*((?:-?[\d.e+-]+|"[^"]*"|true|false|null)(?:,\s*(?:-?[\d.e+-]+|"[^"]*"|true|false|null))*)\s*\]'
)


def build_apartment(
    config: PlanConfig,
    results: list[FloorResult],
    points_per_metre: float,
    plan_images: dict[str, str] | None = None,
) -> dict[str, Any]:
    """plan_images maps floor ids to image paths (relative to the web root) rendered from each floor's clip."""
    floors = [_floor(config, result, points_per_metre) for result in results]
    for floor, result in zip(floors, results):
        if plan_images and result.floor.id in plan_images:
            clip, (ox, oy) = result.floor.clip, result.floor.origin
            floor['planImage'] = {
                'src': plan_images[result.floor.id],
                'bounds': [_metres(value - origin, points_per_metre) for value, origin in
                           ((clip.x0, ox), (clip.y0, oy), (clip.x1, ox), (clip.y1, oy))],
            }
    apartment: dict[str, Any] = {'schemaVersion': 1, 'id': config.id, 'name': config.name}
    if config.north is not None:
        apartment['north'] = config.north
    if config.location is not None:
        apartment['location'] = config.location
    return {**apartment, 'floors': floors}


def opening_ids(result: FloorResult) -> dict[int, str]:
    return {id(opening): f'{result.floor.id}-o-{n:02d}' for n, opening in enumerate(result.openings, 1)}


def wall_ids(result: FloorResult) -> dict[int, str]:
    return {id(wall): f'{result.floor.id}-w-{n:02d}' for n, wall in enumerate(result.walls, 1)}


def _floor(config: PlanConfig, result: FloorResult, unit: float) -> dict[str, Any]:
    floor = result.floor
    ox, oy = floor.origin

    def point(p: Point) -> list[float]:
        return [_metres(p[0] - ox, unit), _metres(p[1] - oy, unit)]

    walls = wall_ids(result)
    openings = opening_ids(result)
    material = config.defaults.wall_material
    return {
        'id': floor.id,
        'name': floor.name,
        'elevation': floor.elevation,
        'height': floor.height,
        'walls': [
            {
                'id': walls[id(wall)],
                'start': point(wall.point(wall.start)),
                'end': point(wall.point(wall.end)),
                'thickness': _metres(wall.thickness, unit),
                'materials': {'left': material, 'right': material},
            }
            for wall in result.walls
        ],
        'openings': [
            _opening(
                openings[id(opening)],
                walls[id(opening.segment)],
                opening,
                unit,
                config.defaults,
                floor.height,
                config.opening_overrides.get(openings[id(opening)], {}),
            )
            for opening in result.openings
        ],
        'rooms': [
            {
                'id': 'room-' + '-'.join(label.key for label in room.labels),
                'name': ' + '.join(label.name for label in room.labels),
                'polygon': [point(p) for p in room.polygon],
                'floorMaterial': config.defaults.floor_material,
            }
            for room in result.rooms
            if room.labels
        ],
        'furniture': [],
    }


def _opening(
    opening_id: str,
    wall_id: str,
    opening: OpeningCandidate,
    unit: float,
    defaults: Defaults,
    floor_height: float,
    overrides: dict[str, Any],
) -> dict[str, Any]:
    if opening.kind == 'window':
        sill, height = defaults.window_sill, defaults.window_height
    elif opening.kind == 'glazed':
        sill, height = 0, defaults.glazed_height
    elif opening.kind == 'passage':
        sill, height = 0, floor_height
    else:
        sill, height = 0, defaults.door_height
    result: dict[str, Any] = {
        'id': opening_id,
        'wallId': wall_id,
        'kind': 'window' if opening.kind in ('window', 'glazed') else 'door',
        'offset': _metres(opening.start - opening.segment.start, unit),
        'width': _metres(opening.width, unit),
        'height': height,
        'sillHeight': sill,
    }
    if opening.kind == 'door':
        result['door'] = {
            'hinge': 'start' if opening.hinge_at_start else 'end',
            'opensTo': 'left' if opening.opens_left else 'right',
        }
    for key, value in overrides.items():
        if value is None:
            result.pop(key, None)
        else:
            result[key] = value
    return result


def _metres(value: float, unit: float) -> float:
    metres = round(value / unit, 3)
    return int(metres) if metres == int(metres) else metres


def serialize(apartment: dict[str, Any]) -> str:
    """Same layout as the viewer's export, so a regenerated file diffs cleanly against an exported one."""
    text = json.dumps(apartment, indent=2, ensure_ascii=False)
    return PRIMITIVE_ARRAY.sub(lambda m: '[' + ', '.join(re.split(r',\s*', m.group(1))) + ']', text) + '\n'

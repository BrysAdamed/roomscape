"""Pendant lamps for authored apartments: one per indoor room, hung from the ceiling above the room's centre."""
from __future__ import annotations

import math
from typing import Any

SHADE_HEIGHT = 0.22
SHADE_BOTTOM = 2.1
MIN_DROP = 0.1
MAX_DROP = 0.8


def centroid(polygon: list[list[float]]) -> tuple[float, float]:
    """Area centroid; for a concave room whose centroid lies outside, the inside point farthest from the walls."""
    area = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(polygon, polygon[1:] + polygon[:1]):
        cross = x0 * y1 - x1 * y0
        area += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if abs(area) > 1e-9:
        point = (cx / (3 * area), cy / (3 * area))
        if contains(polygon, point):
            return point
    return deepest_point(polygon)


def deepest_point(polygon: list[list[float]], steps: int = 40) -> tuple[float, float]:
    xs, ys = [p[0] for p in polygon], [p[1] for p in polygon]
    step = max(max(xs) - min(xs), max(ys) - min(ys)) / steps
    candidates = [(min(xs) + step * (i + 0.5), min(ys) + step * (j + 0.5))
                  for i in range(steps) for j in range(steps)]
    inside = [point for point in candidates if contains(polygon, point)]
    return max(inside, key=lambda point: distance_to_edges(polygon, point))


def distance_to_edges(polygon: list[list[float]], point: tuple[float, float]) -> float:
    px, py = point
    best = math.inf
    for (x0, y0), (x1, y1) in zip(polygon, polygon[1:] + polygon[:1]):
        dx, dy = x1 - x0, y1 - y0
        t = max(0.0, min(1.0, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy or 1)))
        best = min(best, math.hypot(px - x0 - t * dx, py - y0 - t * dy))
    return best


def hanging_point(floor: dict[str, Any], polygon: list[list[float]], steps: int = 40) -> tuple[float, float] | None:
    """The room centre, or under a sloped ceiling the nearest point with full lamp headroom (None if there is none)."""
    centre = centroid(polygon)
    headroom = SHADE_BOTTOM + SHADE_HEIGHT + MIN_DROP
    if ceiling_at(floor, centre) >= headroom:
        return centre
    xs, ys = [p[0] for p in polygon], [p[1] for p in polygon]
    step = max(max(xs) - min(xs), max(ys) - min(ys)) / steps
    candidates = [(min(xs) + step * (i + 0.5), min(ys) + step * (j + 0.5))
                  for i in range(steps) for j in range(steps)]
    tall = [point for point in candidates
            if contains(polygon, point) and ceiling_at(floor, point) >= headroom
            and distance_to_edges(polygon, point) > 0.4]
    if not tall:
        return None
    return min(tall, key=lambda point: math.dist(point, centre))


def contains(polygon: list[list[float]], point: tuple[float, float]) -> bool:
    x, y = point
    inside = False
    for (x0, y0), (x1, y1) in zip(polygon, polygon[1:] + polygon[:1]):
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            inside = not inside
    return inside


def ceiling_at(floor: dict[str, Any], point: tuple[float, float]) -> float:
    """Same rule as the viewer: the lowest roof slope, capped at the storey height; dormers keep full height."""
    height = floor['height']
    roof = floor.get('roof')
    if not roof:
        return height
    x, y = point
    if any(x0 < x < x1 and y0 < y < y1 for x0, y0, x1, y1 in roof.get('dormers', [])):
        return height
    slopes = [slope['height'] + ((x - slope['origin'][0]) * slope['uphill'][0]
                                 + (y - slope['origin'][1]) * slope['uphill'][1]) * math.tan(math.radians(slope['pitch']))
              for slope in roof['slopes']]
    return min([height, *slopes])


def pendant_lamps(floor: dict[str, Any]) -> list[dict[str, Any]]:
    lamps = []
    for room in floor['rooms']:
        if room.get('outdoor'):
            continue
        point = hanging_point(floor, room['polygon'])
        if point is None:
            continue
        x, y = point
        ceiling = ceiling_at(floor, (x, y))
        drop = min(MAX_DROP, max(MIN_DROP, ceiling - SHADE_BOTTOM - SHADE_HEIGHT))
        lamps.append({
            'id': f"lamp-{room['id'].removeprefix('room-')}",
            'type': 'pendant-lamp',
            'position': [round(x, 3), round(y, 3)],
            'elevation': round(ceiling - drop - SHADE_HEIGHT, 3),
            'rotation': 0,
            'params': {'drop': round(drop, 3)},
            'materials': {},
        })
    return lamps

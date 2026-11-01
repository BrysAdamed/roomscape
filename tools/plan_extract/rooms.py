from __future__ import annotations

import math
import re
from dataclasses import dataclass

from .geometry import Point
from .grid import Grid

NAME = re.compile(r'^(\d{2})\s*\n\s*([^\W\d_]{2,}[^\n]*?)(?:\s+(\d+[.,]\d+)\s*m2)?$', re.DOTALL)
AREA = re.compile(r'^(\d+[.,]\d+)\s*m2$')


@dataclass(frozen=True)
class RoomLabel:
    number: str
    name: str
    area: float
    anchor: Point


@dataclass
class RoomRegion:
    labels: list[RoomLabel]
    polygon: list[Point]
    area: float
    holes: int


def parse_labels(blocks: list[tuple[Point, str]]) -> list[RoomLabel]:
    """Room labels `NN / NAME / area m2`; the area may sit in its own text block just below the name."""
    areas = [(anchor, match.group(1)) for anchor, text in blocks if (match := AREA.match(text.strip()))]
    labels = []
    for anchor, text in blocks:
        match = NAME.match(text.strip())
        if not match:
            continue
        number, name, area = match.groups()
        if area is None:
            below = [(a[1] - anchor[1] + abs(a[0] - anchor[0]), value) for a, value in areas if a[1] > anchor[1]]
            if not below:
                continue
            area = min(below)[1]
        name = ' '.join(name.split())
        labels.append(RoomLabel(number, name[:1].upper() + name[1:].lower(), float(area.replace(',', '.')), anchor))
    return labels


def detect_rooms(grid: Grid, labels: list[RoomLabel], min_area: float) -> tuple[list[RoomRegion], list[RoomLabel]]:
    """Free regions enclosed by walls (and closed openings), matched to the labels they contain."""
    rooms = []
    matched: set[RoomLabel] = set()
    for region in grid.free_regions():
        if region.touches_border:
            continue
        inside = [label for label in labels if _cell_of(grid, label.anchor) in region.cells]
        area = grid.area(region.cells)
        if not inside and area < min_area:
            continue
        polygon, holes = grid.outline(region.cells)
        inside.sort(key=lambda label: label.number)
        rooms.append(RoomRegion(inside, polygon, area, holes))
        matched.update(inside)
    rooms.sort(key=lambda room: room.labels[0].number if room.labels else '~')
    return rooms, [label for label in labels if label not in matched]


def calibrate(rooms: list[RoomRegion], outlier: float = 0.1) -> float | None:
    """Least-squares drawing units per metre from single-label rooms, ignoring rooms far off the median ratio."""
    candidates = [(room.area, room.labels[0].area) for room in rooms if len(room.labels) == 1]
    if not candidates:
        return None
    ratios = sorted(drawn / listed for drawn, listed in candidates)
    median = ratios[len(ratios) // 2]
    pairs = [(drawn, listed) for drawn, listed in candidates if abs(drawn / listed / median - 1) <= outlier]
    squares_per_m2 = sum(drawn * listed for drawn, listed in pairs) / sum(listed * listed for _, listed in pairs)
    return math.sqrt(squares_per_m2)


def _cell_of(grid: Grid, point: Point) -> tuple[int, int] | None:
    x, y = point
    for i in range(grid.columns):
        if grid.xs[i] <= x < grid.xs[i + 1]:
            for j in range(grid.rows):
                if grid.ys[j] <= y < grid.ys[j + 1]:
                    return i, j
    return None

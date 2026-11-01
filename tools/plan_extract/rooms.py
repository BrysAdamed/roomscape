from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import dataclass

from .geometry import Point
from .grid import Grid

NUMBERED = re.compile(r'^(\d{2})\s*\n\s*([^\W\d_]{2,}[^\n]*?)(?:\s+(\d+[.,]\d+)\s*m[2²])?$', re.DOTALL)
AREA_FIRST = re.compile(r'^()(\d+[.,]\d+)\s*m[2²]\s*\n\s*([^\W\d_]{2,}[^\n]*)$')
NAME_ONLY = re.compile(r'^()([^\W\d_]{3,}[^\n]*)()$')
AREA = re.compile(r'^(\d+[.,]\d+)\s*m[2²]$')


@dataclass(frozen=True)
class RoomLabel:
    """`number` is empty on plans that name rooms without numbering them; `key` then falls back to the name."""

    number: str
    name: str
    area: float
    anchor: Point

    @property
    def key(self) -> str:
        return self.number or slug(self.name)

    @property
    def caption(self) -> str:
        return f'{self.number} {self.name}'.strip()


@dataclass
class RoomRegion:
    labels: list[RoomLabel]
    polygon: list[Point]
    area: float
    holes: int


def parse_labels(blocks: list[tuple[Point, str]]) -> list[RoomLabel]:
    """Room labels `NN / NAME / area m2`, `area m2 / Name` or a bare `Name`; a missing area is taken from the
    nearest area-only text block below the name. Bare names only take areas no numbered label claimed, so stray
    words on the plan (symbol captions) cannot steal a room's area."""
    areas = [(anchor, match.group(1)) for anchor, text in blocks if (match := AREA.match(text.strip()))]
    parsed = []
    for anchor, text in blocks:
        text = text.strip()
        if match := NUMBERED.match(text):
            parsed.append((anchor, *match.groups(), False))
        elif match := AREA_FIRST.match(text):
            number, area, name = match.groups()
            parsed.append((anchor, number, name, area, False))
        elif match := NAME_ONLY.match(text):
            parsed.append((anchor, *match.groups(), True))

    claimed: set[int] = set()
    labels = []
    for anchor, number, name, area, bare in sorted(parsed, key=lambda label: label[-1]):
        if not area:
            below = [
                (a[1] - anchor[1] + abs(a[0] - anchor[0]), i)
                for i, (a, _) in enumerate(areas)
                if a[1] > anchor[1] and not (bare and i in claimed)
            ]
            if not below:
                continue
            index = min(below)[1]
            claimed.add(index)
            area = areas[index][1]
        name = ' '.join(name.split())
        if name.isupper() and re.search(r'[^\W\d_]{3,}', name):
            name = name[:1] + name[1:].lower()
        labels.append(RoomLabel(number, name, float(area.replace(',', '.')), anchor))
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
        inside.sort(key=lambda label: label.key)
        rooms.append(RoomRegion(inside, polygon, area, holes))
        matched.update(inside)
    rooms.sort(key=lambda room: room.labels[0].key if room.labels else '~')
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


def slug(text: str) -> str:
    ascii_text = unicodedata.normalize('NFKD', text.translate(str.maketrans('łŁ', 'lL'))).encode('ascii', 'ignore')
    return re.sub(r'[^a-z0-9]+', '-', ascii_text.decode().lower()).strip('-')

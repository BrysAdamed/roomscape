from __future__ import annotations

from dataclasses import dataclass

from .geometry import Rect, point_in_polygon
from .openings import OpeningCandidate
from .rooms import RoomRegion


@dataclass(frozen=True)
class FurnitureCandidate:
    """A cluster of overlapping symbol strokes inside a room; mapping it to a furniture type is left to the author."""

    room: RoomRegion
    box: Rect
    strokes: int


def furniture_candidates(
    symbols: list[Rect],
    rooms: list[RoomRegion],
    openings: list[OpeningCandidate],
    min_size: float,
    max_size: float,
    tolerance: float,
) -> list[FurnitureCandidate]:
    swings = [_swing_area(opening) for opening in openings]
    candidates = []
    for room in rooms:
        inside = [
            box
            for box in symbols
            if max(box.width, box.height) <= max_size
            and all(point_in_polygon(corner, room.polygon) for corner in _corners(box.expanded(-tolerance)))
            and not any(_within(box, swing.expanded(tolerance)) for swing in swings)
        ]
        for cluster in _clusters(inside, tolerance):
            box = Rect(
                min(b.x0 for b in cluster), min(b.y0 for b in cluster),
                max(b.x1 for b in cluster), max(b.y1 for b in cluster),
            )
            if min(box.width, box.height) >= min_size:
                candidates.append(FurnitureCandidate(room, box, len(cluster)))
    return candidates


def _swing_area(opening: OpeningCandidate) -> Rect:
    segment = opening.segment
    reach = segment.thickness / 2 + opening.width
    if segment.horizontal:
        return Rect(opening.start, segment.centre - reach, opening.end, segment.centre + reach)
    return Rect(segment.centre - reach, opening.start, segment.centre + reach, opening.end)


def _within(box: Rect, area: Rect) -> bool:
    return area.x0 <= box.x0 and area.y0 <= box.y0 and box.x1 <= area.x1 and box.y1 <= area.y1


def _corners(box: Rect) -> list[tuple[float, float]]:
    return [(box.x0, box.y0), (box.x1, box.y0), (box.x1, box.y1), (box.x0, box.y1)]


def _clusters(boxes: list[Rect], tolerance: float) -> list[list[Rect]]:
    parent = list(range(len(boxes)))

    def root(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    grown = [box.expanded(tolerance) for box in boxes]
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            if grown[i].intersects(grown[j]):
                parent[root(i)] = root(j)
    groups: dict[int, list[Rect]] = {}
    for i, box in enumerate(boxes):
        groups.setdefault(root(i), []).append(box)
    return list(groups.values())

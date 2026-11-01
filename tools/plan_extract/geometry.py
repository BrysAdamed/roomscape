from __future__ import annotations

from dataclasses import dataclass

Point = tuple[float, float]
Edge = tuple[Point, Point]


@dataclass(frozen=True)
class Rect:
    x0: float
    y0: float
    x1: float
    y1: float

    @property
    def width(self) -> float:
        return self.x1 - self.x0

    @property
    def height(self) -> float:
        return self.y1 - self.y0

    def contains(self, point: Point, tolerance: float = 0.0) -> bool:
        x, y = point
        return (
            self.x0 - tolerance <= x <= self.x1 + tolerance
            and self.y0 - tolerance <= y <= self.y1 + tolerance
        )

    def intersects(self, other: Rect) -> bool:
        return self.x0 < other.x1 and other.x0 < self.x1 and self.y0 < other.y1 and other.y0 < self.y1

    def expanded(self, margin: float) -> Rect:
        return Rect(self.x0 - margin, self.y0 - margin, self.x1 + margin, self.y1 + margin)


def bounding_rect(points: list[Point]) -> Rect:
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return Rect(min(xs), min(ys), max(xs), max(ys))


def point_in_polygon(point: Point, polygon: list[Point]) -> bool:
    return point_in_path(point, [(polygon[i - 1], p) for i, p in enumerate(polygon)])


def point_in_path(point: Point, edges: list[Edge]) -> bool:
    """Even-odd rule over closed sub-paths given as edges."""
    x, y = point
    inside = False
    for (xi, yi), (xj, yj) in edges:
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
    return inside


def polygon_area(polygon: list[Point]) -> float:
    total = 0.0
    for i, (x0, y0) in enumerate(polygon):
        x1, y1 = polygon[(i + 1) % len(polygon)]
        total += x0 * y1 - x1 * y0
    return abs(total) / 2

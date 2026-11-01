from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .geometry import Point, Rect
from .walls import WallSegment

OpeningKind = Literal['door', 'glazed', 'window', 'passage']


@dataclass(frozen=True)
class Curve:
    points: list[Point]
    dashed: bool


@dataclass
class OpeningCandidate:
    """A gap in a wall. `glazed` = dashed swing (balcony/terrace door), `passage` = no leaf, no glazing."""

    segment: WallSegment
    start: float
    end: float
    kind: OpeningKind
    hinge_at_start: bool | None = None
    opens_left: bool | None = None
    double: bool = False

    @property
    def width(self) -> float:
        return self.end - self.start


def classify_openings(
    segments: list[WallSegment], curves: list[Curve], exterior_thickness: float, tolerance: float
) -> list[OpeningCandidate]:
    openings = []
    for segment in segments:
        for start, end in segment.gaps:
            openings.append(_classify(segment, start, end, curves, exterior_thickness, tolerance))
    return openings


def _classify(
    segment: WallSegment,
    start: float,
    end: float,
    curves: list[Curve],
    exterior_thickness: float,
    tolerance: float,
) -> OpeningCandidate:
    width = end - start
    reach = segment.thickness / 2 + width * 1.1
    if segment.horizontal:
        area = Rect(start - tolerance, segment.centre - reach, end + tolerance, segment.centre + reach)
    else:
        area = Rect(segment.centre - reach, start - tolerance, segment.centre + reach, end + tolerance)

    sides: dict[int, list[tuple[Curve, list[tuple[float, float]]]]] = {-1: [], 1: []}
    for curve in curves:
        if not all(area.contains(p) for p in curve.points):
            continue
        ends = (curve.points[0], curve.points[-1])
        points = [(along, offset - segment.centre) for along, offset in (_split(segment, p) for p in ends)]
        far = max(points, key=lambda p: abs(p[1]))
        sides[1 if far[1] > 0 else -1].append((curve, points))

    half = segment.thickness / 2
    for side, swings in sides.items():
        points = [p for _, curve_points in swings for p in curve_points]
        if not points:
            continue
        radius = max(abs(p[1]) for p in points) - half
        near = min(abs(p[1]) for p in points)
        if not (0.4 * width <= radius <= 1.25 * width and near <= half + 0.15 * width):
            continue
        hinge_ends = set()
        for _, curve_points in swings:
            along, offset = max(curve_points, key=lambda p: abs(p[1]))
            if abs(offset) - half > 0.3 * width:
                hinge_ends.add(abs(along - start) <= abs(along - end))
        along = max(points, key=lambda p: abs(p[1]))[0]
        return OpeningCandidate(
            segment,
            start,
            end,
            'glazed' if all(curve.dashed for curve, _ in swings) else 'door',
            hinge_at_start=abs(along - start) <= abs(along - end),
            opens_left=side < 0 if segment.horizontal else side > 0,
            double=len(hinge_ends) > 1,
        )

    kind: OpeningKind = 'window' if segment.thickness >= exterior_thickness else 'passage'
    return OpeningCandidate(segment, start, end, kind)


def _split(segment: WallSegment, point: Point) -> tuple[float, float]:
    x, y = point
    return (x, y) if segment.horizontal else (y, x)

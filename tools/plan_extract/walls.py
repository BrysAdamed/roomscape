from __future__ import annotations

from dataclasses import dataclass, field

from .geometry import Point, Rect
from .grid import Grid


@dataclass(frozen=True)
class WallSettings:
    min_thickness: float
    tolerance: float
    min_opening: float
    max_opening: float


@dataclass
class WallSegment:
    """Axis-aligned wall: `centre` is the cross-axis coordinate, `start` < `end` run along the axis."""

    horizontal: bool
    centre: float
    start: float
    end: float
    thickness: float
    gaps: list[tuple[float, float]] = field(default_factory=list)
    joined_start: bool = False
    joined_end: bool = False

    @property
    def length(self) -> float:
        return self.end - self.start

    def point(self, along: float) -> Point:
        return (along, self.centre) if self.horizontal else (self.centre, along)

    def band(self, start: float, end: float) -> Rect:
        half = self.thickness / 2
        if self.horizontal:
            return Rect(start, self.centre - half, end, self.centre + half)
        return Rect(self.centre - half, start, self.centre + half, end)

    @property
    def rect(self) -> Rect:
        return self.band(self.start, self.end)


def extract_walls(grid: Grid, settings: WallSettings) -> list[WallSegment]:
    segments = _segments(grid.rectangles(), settings)
    segments = _merge_collinear(segments, grid, settings, bridge_openings=False)
    segments = _merge_collinear(segments, grid, settings, bridge_openings=True)
    _snap_joints(segments, settings)
    _bridge_to_perpendicular(segments, grid, settings)
    _snap_joints(segments, settings)
    segments =[s for s in segments if s.length >= settings.min_thickness]
    segments.sort(key=lambda s: (not s.horizontal, round(s.centre, 1), s.start))
    return segments


def merge_layers(rects: list[Rect], tolerance: float) -> list[Rect]:
    """Joins touching rectangles whose spans differ by at most `tolerance` (wall layers ending at slightly offset jambs)."""
    rects = list(rects)
    merged = True
    while merged:
        merged = False
        for a in rects:
            for b in rects:
                if a is b:
                    continue
                stacked = abs(a.y1 - b.y0) <= 1e-6 and abs(a.x0 - b.x0) <= tolerance and abs(a.x1 - b.x1) <= tolerance
                beside = abs(a.x1 - b.x0) <= 1e-6 and abs(a.y0 - b.y0) <= tolerance and abs(a.y1 - b.y1) <= tolerance
                if stacked:
                    union = Rect((a.x0 + b.x0) / 2, a.y0, (a.x1 + b.x1) / 2, b.y1)
                elif beside:
                    union = Rect(a.x0, (a.y0 + b.y0) / 2, b.x1, (a.y1 + b.y1) / 2)
                else:
                    continue
                rects.remove(a)
                rects.remove(b)
                rects.append(union)
                merged = True
                break
            if merged:
                break
    return rects


def _segments(rects: list[Rect], settings: WallSettings) -> list[WallSegment]:
    segments = []
    for rect in merge_layers(rects, settings.tolerance * 1.5):
        if min(rect.width, rect.height) < settings.min_thickness:
            continue
        if rect.width >= rect.height:
            segments.append(WallSegment(True, (rect.y0 + rect.y1) / 2, rect.x0, rect.x1, rect.height))
        else:
            segments.append(WallSegment(False, (rect.x0 + rect.x1) / 2, rect.y0, rect.y1, rect.width))
    return segments


def _same_line(a: WallSegment, b: WallSegment, tolerance: float) -> bool:
    return (
        a.horizontal == b.horizontal
        and abs(a.centre - b.centre) <= tolerance
        and abs(a.thickness - b.thickness) <= tolerance
    )


def _merge_collinear(
    segments: list[WallSegment], grid: Grid, settings: WallSettings, bridge_openings: bool
) -> list[WallSegment]:
    merged = True
    while merged:
        merged = False
        segments.sort(key=lambda s: (s.horizontal, s.start))
        for a in segments:
            for b in segments:
                if a is b or not _same_line(a, b, settings.tolerance) or b.start < a.start:
                    continue
                gap = b.start - a.end
                if gap > settings.max_opening:
                    continue
                if gap <= settings.tolerance or (not bridge_openings and grid.is_filled(a.band(a.end, b.start))):
                    pass
                elif bridge_openings and gap >= settings.min_opening and _is_free(grid, a.band(a.end + settings.tolerance, b.start - settings.tolerance)):
                    a.gaps.append((a.end, b.start))
                else:
                    continue
                keeper, other = (a, b) if a.length >= b.length else (b, a)
                keeper.start, keeper.end = a.start, max(a.end, b.end)
                keeper.gaps = sorted(a.gaps + b.gaps)
                segments.remove(other)
                merged = True
                break
            if merged:
                break
    return segments


def _is_free(grid: Grid, rect: Rect) -> bool:
    return not any(grid.filled[j][i] for i, j in grid.cells_in(rect))


def _joint(segment: WallSegment, along: float, other: WallSegment, tolerance: float) -> bool:
    half = other.thickness / 2
    if not other.centre - half - tolerance <= along <= other.centre + half + tolerance:
        return False
    reach = segment.thickness / 2 + tolerance
    return other.start - reach <= segment.centre <= other.end + reach


def _snap_joints(segments: list[WallSegment], settings: WallSettings) -> None:
    for segment in segments:
        for other in segments:
            if other.horizontal == segment.horizontal:
                continue
            if not segment.joined_start and _joint(segment, segment.start, other, settings.tolerance):
                segment.start = other.centre
                segment.joined_start = True
            if not segment.joined_end and _joint(segment, segment.end, other, settings.tolerance):
                segment.end = other.centre
                segment.joined_end = True


def _bridge_to_perpendicular(segments: list[WallSegment], grid: Grid, settings: WallSettings) -> None:
    for segment in segments:
        for at_end in (False, True):
            if segment.joined_end if at_end else segment.joined_start:
                continue
            along = segment.end if at_end else segment.start
            target = _nearest_perpendicular(segments, segment, along, at_end, settings)
            if target is None:
                continue
            face = target.centre + (-1 if at_end else 1) * target.thickness / 2
            gap = (along, face) if at_end else (face, along)
            if not _is_free(grid, segment.band(gap[0] + settings.tolerance, gap[1] - settings.tolerance)):
                continue
            segment.gaps = sorted([*segment.gaps, gap])
            if at_end:
                segment.end, segment.joined_end = target.centre, True
            else:
                segment.start, segment.joined_start = target.centre, True


def _nearest_perpendicular(
    segments: list[WallSegment], segment: WallSegment, along: float, at_end: bool, settings: WallSettings
) -> WallSegment | None:
    best: tuple[float, WallSegment] | None = None
    for other in segments:
        if other.horizontal == segment.horizontal:
            continue
        reach = segment.thickness / 2 + settings.tolerance
        if not other.start - reach <= segment.centre <= other.end + reach:
            continue
        face = other.centre + (-1 if at_end else 1) * other.thickness / 2
        distance = face - along if at_end else along - face
        if settings.min_opening <= distance <= settings.max_opening and (best is None or distance < best[0]):
            best = (distance, other)
    return best[1] if best else None

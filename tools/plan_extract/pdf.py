from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path

import pymupdf

from .geometry import Edge, Point, Rect, bounding_rect, point_in_path, point_in_polygon
from .openings import Curve


@dataclass
class PlanContent:
    wall_polygons: list[list[Point]]
    curves: list[Curve]
    text_blocks: list[tuple[Point, str]]
    symbol_boxes: list[Rect]


def read_plan(path: Path, clip: Rect, wall_fill: tuple[float, float, float], page_number: int = 0) -> PlanContent:
    with pymupdf.open(path) as document:
        page = document[page_number]
        walls: list[list[Point]] = []
        curves: list[Curve] = []
        symbols: list[Rect] = []
        lines: list[tuple[Point, Point, bool]] = []
        clip_paths: list[list[Edge]] = []
        for drawing in page.get_drawings(extended=True):
            if drawing['type'] == 'clip':
                clip_paths = [*clip_paths[: drawing['level']], _edges(drawing['items'])]
                continue
            if 'rect' not in drawing:
                continue
            box = _rect(drawing['rect'])
            if not (clip.contains((box.x0, box.y0)) and clip.contains((box.x1, box.y1))):
                continue
            fill = drawing.get('fill')
            if drawing['type'] == 'f' and fill and _same_colour(fill, wall_fill):
                active = clip_paths[: drawing['level']]
                walls.extend(piece for polygon in _polygons(drawing['items']) for piece in _clipped(polygon, active))
                continue
            if drawing.get('color') is None:
                continue
            dashed = _is_dashed(drawing.get('dashes'))
            for item in drawing['items']:
                if item[0] == 'c':
                    curves.append(Curve([(p.x, p.y) for p in item[1:5]], dashed))
                elif item[0] == 'l':
                    lines.append(((item[1].x, item[1].y), (item[2].x, item[2].y), dashed))
            symbols.append(box)
        curves.extend(_flattened_arcs(lines))
        blocks = [
            (((x0 + x1) / 2, (y0 + y1) / 2), text)
            for x0, y0, x1, y1, text, *_ in page.get_text('blocks')
            if clip.contains(((x0 + x1) / 2, (y0 + y1) / 2))
        ]
        return PlanContent(walls, curves, blocks, symbols)


def render_debug(
    path: Path,
    clip: Rect,
    output: Path,
    lines: list[tuple[Point, Point, tuple[float, float, float], float]],
    polygons: list[tuple[list[Point], tuple[float, float, float]]],
    page_number: int = 0,
    dpi: int = 300,
) -> None:
    with pymupdf.open(path) as source, pymupdf.open() as target:
        page = source[page_number]
        canvas = target.new_page(width=page.rect.width, height=page.rect.height)
        canvas.show_pdf_page(canvas.rect, source, page_number)
        shape = canvas.new_shape()
        for polygon, colour in polygons:
            shape.draw_polyline([*polygon, polygon[0]])
            shape.finish(color=colour, fill=colour, fill_opacity=0.15, width=0.3)
        for start, end, colour, width in lines:
            shape.draw_line(start, end)
            shape.finish(color=colour, width=width)
        shape.commit()
        canvas.get_pixmap(clip=pymupdf.Rect(clip.x0, clip.y0, clip.x1, clip.y1), dpi=dpi).save(output)


def render_clip(path: Path, clip: Rect, output: Path, dpi: int = 200, page_number: int = 0) -> None:
    with pymupdf.open(path) as document:
        pixmap = document[page_number].get_pixmap(clip=pymupdf.Rect(clip.x0, clip.y0, clip.x1, clip.y1), dpi=dpi)
        pixmap.save(output)


def _rect(rect: pymupdf.Rect) -> Rect:
    return Rect(rect.x0, rect.y0, rect.x1, rect.y1)


def _polygons(items: list[tuple]) -> list[list[Point]]:
    """One polygon per rectangle item (a fill may batch many), otherwise the path as one polygon."""
    if all(item[0] == 're' for item in items):
        return [[(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)] for r in (item[1] for item in items)]
    return [[(items[0][1].x, items[0][1].y), *((item[-1].x, item[-1].y) for item in items)]]


def _edges(items: list[tuple]) -> list[Edge]:
    edges: list[Edge] = []
    for item in items:
        if item[0] == 're':
            r = item[1]
            corners = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
            edges.extend((corners[i], corners[(i + 1) % 4]) for i in range(4))
        elif item[0] == 'qu':
            q = item[1]
            corners = [(p.x, p.y) for p in (q.ul, q.ur, q.lr, q.ll)]
            edges.extend((corners[i], corners[(i + 1) % 4]) for i in range(4))
        else:
            edges.append(((item[1].x, item[1].y), (item[-1].x, item[-1].y)))
    return edges


def _flattened_arcs(
    lines: list[tuple[Point, Point, bool]], min_segments: int = 4, tolerance: float = 0.05
) -> list[Curve]:
    """Arcs that the exporter flattened into consecutive line segments, each turning a little the same way.

    Dashed arcs come as separate dashes: a gap no longer than the dash before it continues the chain, and a run with
    gaps between many of its segments is dashed."""
    chains: list[tuple[list[Point], list[bool]]] = []
    for start, end, dashed in lines:
        if chains:
            points, gaps = chains[-1]
            gap = math.dist(points[-1], start)
            if gap <= tolerance:
                points.append(end)
                gaps.append(dashed)
                continue
            if gap <= 1.5 * math.dist(points[-2], points[-1]):
                points.extend([start, end])
                gaps.extend([True, dashed])
                continue
        chains.append(([start, end], [dashed]))
    return [
        Curve(points[first:last + 1], sum(gaps[first:last]) * 3 >= last - first)
        for points, gaps in chains
        for first, last in _arc_runs(points, min_segments)
    ]


def _arc_runs(points: list[Point], min_segments: int) -> list[tuple[int, int]]:
    """First and last point of each maximal stretch of a polyline that keeps turning the same way by less than 40°
    per vertex, 45°–180° in all."""
    turns = []
    for a, b, c in zip(points, points[1:], points[2:]):
        u, v = (b[0] - a[0], b[1] - a[1]), (c[0] - b[0], c[1] - b[1])
        turns.append(math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]))
    runs = []
    first = 0
    for i in range(len(turns) + 1):
        bends = i < len(turns) and abs(turns[i]) < math.radians(40) and turns[i] != 0
        if bends and (i == first or (turns[i] > 0) == (turns[first] > 0)):
            continue
        if i + 1 - first >= min_segments and math.radians(45) <= abs(sum(turns[first:i])) <= math.pi + 1e-9:
            runs.append((first, i + 1))
        first = i + 1 if not bends else i
    return runs


def _clipped(polygon: list[Point], clip_paths: list[list[Edge]]) -> list[list[Point]]:
    """The parts of a fill left visible by the clip paths (even-odd), as grid-aligned rectangles.

    Some exporters draw a wall as one long rectangle and cut the door gaps out with a clip path."""
    if not clip_paths:
        return [polygon]
    box = bounding_rect(polygon)
    vertices = [p for path in clip_paths for edge in path for p in edge if box.contains(p)]
    if not vertices and all(point_in_path(polygon[0], path) for path in clip_paths):
        return [polygon]
    xs = sorted({*(x for x, _ in polygon), *(x for x, _ in vertices)})
    ys = sorted({*(y for _, y in polygon), *(y for _, y in vertices)})
    pieces = []
    for y0, y1 in zip(ys, ys[1:]):
        for x0, x1 in zip(xs, xs[1:]):
            centre = ((x0 + x1) / 2, (y0 + y1) / 2)
            if point_in_polygon(centre, polygon) and all(point_in_path(centre, path) for path in clip_paths):
                pieces.append([(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
    return pieces


def _same_colour(colour: tuple[float, ...], expected: tuple[float, float, float]) -> bool:
    return len(colour) == 3 and all(abs(a - b) < 0.002 for a, b in zip(colour, expected))


def _is_dashed(dashes: str | None) -> bool:
    return bool(dashes) and not dashes.startswith('[]')

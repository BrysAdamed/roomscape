from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pymupdf

from .geometry import Point, Rect
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
        for drawing in page.get_drawings():
            box = _rect(drawing['rect'])
            if not (clip.contains((box.x0, box.y0)) and clip.contains((box.x1, box.y1))):
                continue
            fill = drawing.get('fill')
            if drawing['type'] == 'f' and fill and _same_colour(fill, wall_fill):
                walls.append(_polygon(drawing['items']))
                continue
            if drawing.get('color') is None:
                continue
            dashed = _is_dashed(drawing.get('dashes'))
            for item in drawing['items']:
                if item[0] == 'c':
                    curves.append(Curve([(p.x, p.y) for p in item[1:5]], dashed))
            symbols.append(box)
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


def _polygon(items: list[tuple]) -> list[Point]:
    if items[0][0] == 're':
        r = items[0][1]
        return [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
    return [(items[0][1].x, items[0][1].y), *((item[-1].x, item[-1].y) for item in items)]


def _same_colour(colour: tuple[float, ...], expected: tuple[float, float, float]) -> bool:
    return len(colour) == 3 and all(abs(a - b) < 0.002 for a, b in zip(colour, expected))


def _is_dashed(dashes: str | None) -> bool:
    return bool(dashes) and not dashes.startswith('[]')

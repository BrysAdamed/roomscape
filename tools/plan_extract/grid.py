from __future__ import annotations

from bisect import bisect_left
from collections import deque
from dataclasses import dataclass

from .geometry import Point, Rect, bounding_rect, point_in_polygon, polygon_area

Cell = tuple[int, int]


@dataclass
class Region:
    cells: set[Cell]
    touches_border: bool


class Grid:
    """Occupancy grid over the distinct x/y coordinates of rectilinear shapes (coordinate compression)."""

    def __init__(self, xs: list[float], ys: list[float]):
        self.xs = xs
        self.ys = ys
        self.filled = [[False] * (len(xs) - 1) for _ in range(len(ys) - 1)]

    @property
    def columns(self) -> int:
        return len(self.xs) - 1

    @property
    def rows(self) -> int:
        return len(self.ys) - 1

    @classmethod
    def from_polygons(cls, polygons: list[list[Point]], bounds: Rect, snap: float) -> Grid:
        snapped = [[(_snap(x, snap), _snap(y, snap)) for x, y in polygon] for polygon in polygons]
        xs = sorted({bounds.x0, bounds.x1, *(x for polygon in snapped for x, _ in polygon)})
        ys = sorted({bounds.y0, bounds.y1, *(y for polygon in snapped for _, y in polygon)})
        grid = cls(xs, ys)
        for polygon in snapped:
            box = bounding_rect(polygon)
            for j in range(bisect_left(ys, box.y0), bisect_left(ys, box.y1)):
                for i in range(bisect_left(xs, box.x0), bisect_left(xs, box.x1)):
                    if not grid.filled[j][i] and point_in_polygon(grid.cell_centre((i, j)), polygon):
                        grid.filled[j][i] = True
        return grid

    def cell_centre(self, cell: Cell) -> Point:
        i, j = cell
        return (self.xs[i] + self.xs[i + 1]) / 2, (self.ys[j] + self.ys[j + 1]) / 2

    def cell_area(self, cell: Cell) -> float:
        i, j = cell
        return (self.xs[i + 1] - self.xs[i]) * (self.ys[j + 1] - self.ys[j])

    def cells_in(self, rect: Rect) -> list[Cell]:
        return [
            (i, j)
            for j in range(bisect_left(self.ys, rect.y0), bisect_left(self.ys, rect.y1))
            for i in range(bisect_left(self.xs, rect.x0), bisect_left(self.xs, rect.x1))
            if rect.contains(self.cell_centre((i, j)))
        ]

    def fill(self, rect: Rect) -> None:
        for i, j in self.cells_in(rect):
            self.filled[j][i] = True

    def is_filled(self, rect: Rect) -> bool:
        cells = self.cells_in(rect)
        return bool(cells) and all(self.filled[j][i] for i, j in cells)

    def rectangles(self) -> list[Rect]:
        """Decomposes the filled cells into rectangles by stacking identical horizontal runs."""
        result: list[Rect] = []
        open_runs: dict[tuple[int, int], int] = {}
        for j in range(self.rows + 1):
            runs = set(self._runs(j)) if j < self.rows else set()
            for run, start in list(open_runs.items()):
                if run not in runs:
                    result.append(Rect(self.xs[run[0]], self.ys[start], self.xs[run[1]], self.ys[j]))
                    del open_runs[run]
            for run in runs:
                open_runs.setdefault(run, j)
        return result

    def _runs(self, j: int) -> list[tuple[int, int]]:
        runs = []
        row = self.filled[j]
        i = 0
        while i < self.columns:
            if row[i]:
                start = i
                while i < self.columns and row[i]:
                    i += 1
                runs.append((start, i))
            else:
                i += 1
        return runs

    def free_regions(self) -> list[Region]:
        seen = [[False] * self.columns for _ in range(self.rows)]
        regions = []
        for j in range(self.rows):
            for i in range(self.columns):
                if self.filled[j][i] or seen[j][i]:
                    continue
                cells: set[Cell] = set()
                touches_border = False
                queue = deque([(i, j)])
                seen[j][i] = True
                while queue:
                    ci, cj = queue.popleft()
                    cells.add((ci, cj))
                    if ci in (0, self.columns - 1) or cj in (0, self.rows - 1):
                        touches_border = True
                    for ni, nj in ((ci + 1, cj), (ci - 1, cj), (ci, cj + 1), (ci, cj - 1)):
                        if 0 <= ni < self.columns and 0 <= nj < self.rows:
                            if not self.filled[nj][ni] and not seen[nj][ni]:
                                seen[nj][ni] = True
                                queue.append((ni, nj))
                regions.append(Region(cells, touches_border))
        return regions

    def area(self, cells: set[Cell]) -> float:
        return sum(self.cell_area(cell) for cell in cells)

    def outline(self, cells: set[Cell]) -> tuple[list[Point], int]:
        """Traces the outer boundary of a cell set; returns the polygon and the number of holes."""
        edges: dict[Cell, list[Cell]] = {}

        def add(start: Cell, end: Cell) -> None:
            edges.setdefault(start, []).append(end)

        for i, j in cells:
            if (i, j - 1) not in cells:
                add((i, j), (i + 1, j))
            if (i + 1, j) not in cells:
                add((i + 1, j), (i + 1, j + 1))
            if (i, j + 1) not in cells:
                add((i + 1, j + 1), (i, j + 1))
            if (i - 1, j) not in cells:
                add((i, j + 1), (i, j))

        loops: list[list[Point]] = []
        while edges:
            start = next(iter(edges))
            loop = [start]
            current = start
            while True:
                targets = edges[current]
                following = targets.pop()
                if not targets:
                    del edges[current]
                current = following
                if current == start:
                    break
                loop.append(current)
            loops.append(_simplify([(self.xs[i], self.ys[j]) for i, j in loop]))

        loops.sort(key=polygon_area, reverse=True)
        return loops[0], len(loops) - 1


def _snap(value: float, step: float) -> float:
    return round(round(value / step) * step, 6)


def _simplify(points: list[Point]) -> list[Point]:
    result = []
    count = len(points)
    for index, point in enumerate(points):
        before = points[index - 1]
        after = points[(index + 1) % count]
        collinear = (before[0] == point[0] == after[0]) or (before[1] == point[1] == after[1])
        if not collinear:
            result.append(point)
    return result

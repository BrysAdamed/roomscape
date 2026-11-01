import unittest

from tools.plan_extract.geometry import Rect, point_in_polygon, polygon_area
from tools.plan_extract.grid import Grid
from tools.plan_extract.walls import merge_layers


def box(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


class GridTests(unittest.TestCase):
    def test_overlapping_polygons_are_unioned(self):
        # Arrange
        grid = Grid.from_polygons([box(0, 0, 10, 1), box(5, 0, 6, 8)], Rect(-1, -1, 11, 9), 0.01)

        # Act
        rectangles = grid.rectangles()

        # Assert
        self.assertEqual(sorted(rectangles, key=lambda r: r.y0), [Rect(0, 0, 10, 1), Rect(5, 1, 6, 8)])

    def test_triangles_forming_a_rectangle_fill_it(self):
        grid = Grid.from_polygons([[(0, 0), (4, 0), (4, 1)], [(0, 0), (4, 1), (0, 1)]], Rect(-1, -1, 5, 2), 0.01)

        self.assertEqual(grid.rectangles(), [Rect(0, 0, 4, 1)])

    def test_enclosed_region_is_not_touching_the_border(self):
        frame = [box(0, 0, 10, 1), box(0, 9, 10, 10), box(0, 1, 1, 9), box(9, 1, 10, 9)]
        grid = Grid.from_polygons(frame, Rect(-1, -1, 11, 11), 0.01)

        inner = [region for region in grid.free_regions() if not region.touches_border]

        self.assertEqual(len(inner), 1)
        self.assertAlmostEqual(grid.area(inner[0].cells), 64)

    def test_outline_traces_an_l_shape(self):
        grid = Grid([0, 1, 2], [0, 1, 2])
        cells = {(0, 0), (0, 1), (1, 1)}

        polygon, holes = grid.outline(cells)

        self.assertEqual(holes, 0)
        self.assertEqual(len(polygon), 6)
        self.assertAlmostEqual(polygon_area(polygon), 3)


class LayerMergeTests(unittest.TestCase):
    def test_stacked_layers_with_offset_jambs_merge(self):
        layers = [Rect(0, 0, 5.0, 0.2), Rect(0, 0.2, 5.1, 0.3), Rect(0.05, 0.3, 5.05, 0.4)]

        merged = merge_layers(layers, tolerance=0.15)

        self.assertEqual(len(merged), 1)
        self.assertAlmostEqual(merged[0].height, 0.4)

    def test_distinct_spans_stay_apart(self):
        merged = merge_layers([Rect(0, 0, 5, 0.2), Rect(0, 0.2, 2, 0.4)], tolerance=0.15)

        self.assertEqual(len(merged), 2)


class PolygonTests(unittest.TestCase):
    def test_point_in_polygon(self):
        square = box(0, 0, 2, 2)

        self.assertTrue(point_in_polygon((1, 1), square))
        self.assertFalse(point_in_polygon((3, 1), square))


if __name__ == '__main__':
    unittest.main()

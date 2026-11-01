import math
import unittest

from tools.plan_extract.geometry import polygon_area
from tools.plan_extract.pdf import _clipped, _flattened_arcs


def box_edges(x0, y0, x1, y1):
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    return [(corners[i], corners[(i + 1) % 4]) for i in range(4)]


def arc(centre, radius, start, end, steps=8):
    angles = [start + (end - start) * i / steps for i in range(steps + 1)]
    return [(centre[0] + radius * math.cos(a), centre[1] + radius * math.sin(a)) for a in angles]


class ClipTests(unittest.TestCase):
    def test_even_odd_clip_cuts_a_door_gap_out_of_a_wall(self):
        # Arrange
        wall = [(0, 0), (2, 0), (2, 100), (0, 100)]
        clip = box_edges(0, 0, 2, 40) + box_edges(0, 60, 2, 100)

        # Act
        pieces = _clipped(wall, [clip])

        # Assert
        self.assertAlmostEqual(sum(polygon_area(piece) for piece in pieces), 160)
        self.assertFalse(any(min(y for _, y in piece) < 50 < max(y for _, y in piece) for piece in pieces))

    def test_a_clip_around_the_whole_wall_keeps_its_outline(self):
        wall = [(0, 0), (10, 0), (10, 2), (2, 2), (2, 10), (0, 10)]

        self.assertEqual(_clipped(wall, [box_edges(-5, -5, 50, 50)]), [wall])


class FlattenedArcTests(unittest.TestCase):
    def test_consecutive_segments_of_a_quarter_circle_form_a_curve(self):
        # Arrange
        points = arc((0, 0), 20, 0, math.pi / 2)
        lines = [(a, b, False) for a, b in zip(points, points[1:])]

        # Act
        [curve] = _flattened_arcs(lines)

        # Assert
        self.assertEqual((curve.points[0], curve.points[-1], curve.dashed), (points[0], points[-1], False))

    def test_dashes_with_gaps_form_a_dashed_curve(self):
        points = arc((0, 0), 20, 0, math.pi / 2, steps=16)
        lines = [(points[i], points[i + 1], False) for i in range(0, 16, 2)]

        [curve] = _flattened_arcs(lines)

        self.assertTrue(curve.dashed)

    def test_the_door_leaf_before_the_arc_is_not_part_of_it(self):
        points = arc((0, 0), 20, 0, math.pi / 2)
        lines = [((0, 0), points[0], False), *((a, b, False) for a, b in zip(points, points[1:]))]

        [curve] = _flattened_arcs(lines)

        self.assertEqual(curve.points[0], points[0])

    def test_rectangle_outline_is_not_an_arc(self):
        corners = [(0, 0), (10, 0), (10, 5), (0, 5), (0, 0)]

        self.assertEqual(_flattened_arcs([(a, b, False) for a, b in zip(corners, corners[1:])]), [])


if __name__ == '__main__':
    unittest.main()

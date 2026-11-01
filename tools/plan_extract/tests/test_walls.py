import unittest

from tools.plan_extract.geometry import Rect
from tools.plan_extract.grid import Grid
from tools.plan_extract.openings import Curve, classify_openings
from tools.plan_extract.walls import WallSettings, extract_walls

SETTINGS = WallSettings(min_thickness=0.05, tolerance=0.02, min_opening=0.5, max_opening=2.6)


def box(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def room_with_door():
    """4 x 3 room, walls 0.2 thick, a 0.9 door gap in the bottom wall from x=1.0 to x=1.9."""
    polygons = [
        box(0, 0, 4, 0.2),
        box(0, 2.8, 1.0, 3.0),
        box(1.9, 2.8, 4, 3.0),
        box(0, 0.2, 0.2, 2.8),
        box(3.8, 0.2, 4, 2.8),
    ]
    return Grid.from_polygons(polygons, Rect(-1, -1, 5, 4), 0.01)


class WallExtractionTests(unittest.TestCase):
    def test_room_walls_meet_on_centre_lines(self):
        # Act
        walls = extract_walls(room_with_door(), SETTINGS)

        # Assert
        lines = sorted(
            (w.horizontal, round(w.centre, 3), round(w.start, 3), round(w.end, 3)) for w in walls
        )
        self.assertEqual(
            lines,
            [
                (False, 0.1, 0.1, 2.9),
                (False, 3.9, 0.1, 2.9),
                (True, 0.1, 0.1, 3.9),
                (True, 2.9, 0.1, 3.9),
            ],
        )

    def test_door_gap_becomes_an_opening_of_one_wall(self):
        walls = extract_walls(room_with_door(), SETTINGS)

        bottom = next(w for w in walls if w.horizontal and w.centre > 2)
        self.assertEqual([(round(a, 3), round(b, 3)) for a, b in bottom.gaps], [(1.0, 1.9)])

    def test_gap_next_to_a_perpendicular_wall_is_bridged(self):
        polygons = [box(0, 0, 4, 0.2), box(0, 0.2, 0.2, 3), box(3.8, 0.2, 4, 3), box(0, 3, 3.0, 3.2)]
        grid = Grid.from_polygons(polygons, Rect(-1, -1, 5, 4), 0.01)

        walls = extract_walls(grid, SETTINGS)

        bottom = next(w for w in walls if w.horizontal and w.centre > 2)
        self.assertAlmostEqual(bottom.end, 3.9)
        self.assertEqual([(round(a, 3), round(b, 3)) for a, b in bottom.gaps], [(3.0, 3.8)])


class OpeningClassificationTests(unittest.TestCase):
    def test_swing_arc_sets_hinge_and_side(self):
        # Arrange: leaf hinged at x=1.0, swinging up into the room (towards smaller y)
        walls = extract_walls(room_with_door(), SETTINGS)
        arc = Curve([(1.9, 2.8), (1.9, 2.3), (1.5, 1.9), (1.0, 1.9)], dashed=False)

        # Act
        [opening] = classify_openings(walls, [arc], exterior_thickness=0.3, tolerance=0.02)

        # Assert
        self.assertEqual(opening.kind, 'door')
        self.assertTrue(opening.hinge_at_start)
        self.assertTrue(opening.opens_left)

    def test_gap_without_arc_in_thin_wall_is_a_passage(self):
        walls = extract_walls(room_with_door(), SETTINGS)

        [opening] = classify_openings(walls, [], exterior_thickness=0.3, tolerance=0.02)

        self.assertEqual(opening.kind, 'passage')

    def test_gap_without_arc_in_thick_wall_is_a_window(self):
        walls = extract_walls(room_with_door(), SETTINGS)

        [opening] = classify_openings(walls, [], exterior_thickness=0.15, tolerance=0.02)

        self.assertEqual(opening.kind, 'window')


if __name__ == '__main__':
    unittest.main()

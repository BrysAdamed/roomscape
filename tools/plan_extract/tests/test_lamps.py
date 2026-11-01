import math
import unittest

from tools.plan_extract.lamps import ceiling_at, centroid, pendant_lamps

SQUARE = [[0, 0], [4, 0], [4, 4], [0, 4]]
L_SHAPE = [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]]


class LampTests(unittest.TestCase):
    def test_centroid_of_a_square_is_its_centre(self):
        self.assertEqual(centroid(SQUARE), (2.0, 2.0))

    def test_centroid_falls_back_inside_concave_rooms(self):
        x, y = centroid(L_SHAPE)
        self.assertLess(min(x, y), 1.5)

    def test_ceiling_follows_the_roof_slope(self):
        floor = {'height': 2.6, 'roof': {'slopes': [
            {'origin': [0, 0], 'uphill': [1, 0], 'height': 1.0, 'pitch': math.degrees(math.atan(0.5))}]}}
        self.assertAlmostEqual(ceiling_at(floor, (2, 0)), 2.0)
        self.assertAlmostEqual(ceiling_at(floor, (8, 0)), 2.6)

    def test_one_lamp_per_indoor_room_hanging_from_the_ceiling(self):
        floor = {'height': 2.65, 'rooms': [
            {'id': 'room-01', 'polygon': SQUARE},
            {'id': 'room-balcony', 'polygon': SQUARE, 'outdoor': True},
        ]}

        lamps = pendant_lamps(floor)

        self.assertEqual([lamp['id'] for lamp in lamps], ['lamp-01'])
        lamp = lamps[0]
        self.assertAlmostEqual(lamp['elevation'] + 0.22 + lamp['params']['drop'], 2.65)

    def test_lamps_under_a_slope_move_to_where_there_is_headroom(self):
        floor = {'height': 2.6, 'rooms': [{'id': 'room-attic', 'polygon': [[0, 0], [6, 0], [6, 4], [0, 4]]}],
                 'roof': {'slopes': [{'origin': [0, 0], 'uphill': [1, 0], 'height': 0.6, 'pitch': 26.57}]}}

        lamp = pendant_lamps(floor)[0]

        self.assertGreaterEqual(lamp['elevation'], 2.1 - 1e-6)
        self.assertGreater(lamp['position'][0], 3)


    def test_lamps_keep_clear_of_stairs(self):
        floor = {'height': 2.65, 'rooms': [{'id': 'room-hall', 'polygon': [[0, 0], [4, 0], [4, 2], [0, 2]]}],
                 'stairs': [{'steps': [[[1, 0], [3, 0], [3, 2], [1, 2]]]}]}

        lamp = pendant_lamps(floor)[0]

        self.assertTrue(lamp['position'][0] <= 0.65 or lamp['position'][0] >= 3.34)


if __name__ == '__main__':
    unittest.main()

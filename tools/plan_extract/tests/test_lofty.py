import unittest
from pathlib import Path

from tools.plan_extract.config import load_config
from tools.plan_extract.extract import extract_floor
from tools.plan_extract.pdf import read_plan

CONFIG = Path(__file__).resolve().parents[3] / 'plans' / 'lofty-madalinskiego-b8' / 'extract.json'


class LoftyRegressionTests(unittest.TestCase):
    """End-to-end extraction of a print-to-PDF plan: black walls with door gaps cut out by clip paths, door swings
    flattened into line segments, unnumbered `area m2 / Name` labels."""

    @classmethod
    def setUpClass(cls):
        cls.config = load_config(CONFIG)
        cls.results = {
            floor.id: extract_floor(
                read_plan(cls.config.pdf, floor.clip, cls.config.wall_fill), floor, cls.config.points_per_metre
            )
            for floor in cls.config.floors
        }

    def test_full_height_rooms_match_listed_areas(self):
        unit = self.config.points_per_metre
        rooms = {room.labels[0].key: room for result in self.results.values() for room in result.rooms if room.labels}
        for key in ('lazienka', 'wc-2'):
            with self.subTest(room=key):
                room = rooms[key]
                self.assertLess(abs(room.area / unit**2 / room.labels[0].area - 1), 0.01)

    def test_doors_are_found(self):
        doors = {floor: sum(o.kind == 'door' for o in r.openings) for floor, r in self.results.items()}

        self.assertEqual(doors, {'parter': 4, 'poddasze': 7})


if __name__ == '__main__':
    unittest.main()

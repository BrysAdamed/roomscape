import unittest
from pathlib import Path

from tools.plan_extract.config import load_config
from tools.plan_extract.extract import extract_floor
from tools.plan_extract.pdf import read_plan
from tools.plan_extract.rooms import calibrate

CONFIG = Path(__file__).resolve().parents[3] / 'plans' / 'harmonia-ii-5-1-1' / 'extract.json'


class HarmoniaRegressionTests(unittest.TestCase):
    """End-to-end extraction of the reference plan (unit 5.1.1)."""

    @classmethod
    def setUpClass(cls):
        cls.config = load_config(CONFIG)
        cls.results = {
            floor.id: extract_floor(
                read_plan(cls.config.pdf, floor.clip, cls.config.wall_fill), floor, cls.config.points_per_metre
            )
            for floor in cls.config.floors
        }

    def test_enclosed_rooms_match_listed_areas(self):
        unit = self.config.points_per_metre
        for result in self.results.values():
            for room in result.rooms:
                with self.subTest(room=[label.number for label in room.labels]):
                    listed = sum(label.area for label in room.labels)
                    if room.labels and room.labels[0].number != '06':
                        self.assertLess(abs(room.area / unit**2 / listed - 1), 0.01)

    def test_fitted_scale_matches_drawing_scale(self):
        rooms = [room for result in self.results.values() for room in result.rooms]

        self.assertAlmostEqual(calibrate(rooms), self.config.points_per_metre, delta=0.05)

    def test_doors_are_found(self):
        doors = {floor: sum(o.kind == 'door' for o in r.openings) for floor, r in self.results.items()}

        self.assertEqual(doors, {'parter': 4, 'pietro-1': 6})


if __name__ == '__main__':
    unittest.main()

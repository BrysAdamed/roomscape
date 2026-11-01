import unittest

from tools.plan_extract.apartment import serialize
from tools.plan_extract.rooms import RoomLabel, RoomRegion, calibrate, parse_labels


class LabelTests(unittest.TestCase):
    def test_area_in_a_separate_block_below_the_name(self):
        # Arrange
        blocks = [((10, 10), '04\nSYPIALNIA\n'), ((10, 18), '13,75 m2\n'), ((50, 18), '4,69 m2\n')]

        # Act
        [label] = parse_labels(blocks)

        # Assert
        self.assertEqual((label.number, label.name, label.area), ('04', 'Sypialnia', 13.75))

    def test_area_in_the_same_block(self):
        [label] = parse_labels([((0, 0), '02\nSALON Z ANEKSEM\n32,05 m2')])

        self.assertEqual((label.name, label.area), ('Salon z aneksem', 32.05))

    def test_dimension_text_is_not_a_label(self):
        self.assertEqual(parse_labels([((0, 0), '16 x 18,25\n25,00\n'), ((0, 5), '9,55 m2')]), [])

    def test_area_before_an_unnumbered_name(self):
        [label] = parse_labels([((0, 0), '1.89 m²\nWC 1\n')])

        self.assertEqual((label.key, label.name, label.area), ('wc-1', 'WC 1', 1.89))

    def test_bare_name_takes_the_area_below(self):
        [label] = parse_labels([((10, 10), 'Łazienka\n'), ((10, 18), '6.95 m²\n')])

        self.assertEqual((label.key, label.caption, label.area), ('lazienka', 'Łazienka', 6.95))

    def test_bare_word_does_not_take_a_numbered_room_area(self):
        # Arrange
        blocks = [((10, 10), '02\nSALON\n'), ((12, 14), 'Pralka\n'), ((10, 18), '32,05 m2\n')]

        # Act
        labels = parse_labels(blocks)

        # Assert
        self.assertEqual([(label.key, label.area) for label in labels], [('02', 32.05)])


class CalibrationTests(unittest.TestCase):
    def test_fit_ignores_outliers(self):
        def room(listed, drawn):
            return RoomRegion([RoomLabel('01', 'Room', listed, (0, 0))], [], drawn, 0)

        rooms = [room(10, 10 * 400), room(5, 5 * 400), room(4, 4 * 400 * 1.6)]

        self.assertAlmostEqual(calibrate(rooms), 20)


class SerializeTests(unittest.TestCase):
    def test_primitive_arrays_stay_on_one_line(self):
        text = serialize({'start': [0.5, 1], 'walls': [{'id': 'w'}]})

        self.assertIn('"start": [0.5, 1]', text)
        self.assertIn('"walls": [\n', text)


if __name__ == '__main__':
    unittest.main()

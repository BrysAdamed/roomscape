import unittest

from tools.plan_extract.translate import english_room_name


class TranslateTests(unittest.TestCase):
    def test_translates_room_labels_and_keeps_numbers(self):
        names = ['Komunikacja + Salon z aneksem', 'Sypialnia 4', 'ŁAZIENKA', 'WC 2', 'Balkon', 'Atelier']

        self.assertEqual([english_room_name(name) for name in names], [
            'Hall + Living room with kitchenette', 'Bedroom 4', 'Bathroom', 'WC 2', 'Balcony', 'Atelier'])


if __name__ == '__main__':
    unittest.main()

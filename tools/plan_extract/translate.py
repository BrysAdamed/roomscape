"""English names for the room labels found on Polish floor plans."""
from __future__ import annotations

import re

ROOM_WORDS = {
    'salon z aneksem': 'Living room with kitchenette',
    'salon': 'Living room',
    'aneks kuchenny': 'Kitchenette',
    'kuchnia': 'Kitchen',
    'komunikacja': 'Hall',
    'przedpokój': 'Hall',
    'korytarz': 'Corridor',
    'sypialnia': 'Bedroom',
    'pokój': 'Room',
    'łazienka': 'Bathroom',
    'garderoba': 'Wardrobe',
    'pralnia': 'Laundry',
    'gabinet': 'Study',
    'balkon': 'Balcony',
    'taras': 'Terrace',
    'loggia': 'Loggia',
    'ogródek': 'Garden',
    'ogród': 'Garden',
    'schowek': 'Storage',
    'spiżarnia': 'Pantry',
    'wc': 'WC',
}

_PATTERN = re.compile('|'.join(sorted(map(re.escape, ROOM_WORDS), key=len, reverse=True)), re.IGNORECASE)


def english_room_name(name: str) -> str:
    """Translates the known room words and keeps everything else (numbers, separators) as it is."""
    return _PATTERN.sub(lambda match: ROOM_WORDS[match.group(0).lower()], name)

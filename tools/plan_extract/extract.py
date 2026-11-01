from __future__ import annotations

import copy
from dataclasses import dataclass

from .config import FloorConfig
from .furniture import FurnitureCandidate, furniture_candidates
from .grid import Grid
from .openings import OpeningCandidate, classify_openings
from .pdf import PlanContent
from .rooms import RoomLabel, RoomRegion, detect_rooms, parse_labels
from .walls import WallSegment, WallSettings, extract_walls

SNAP = 0.01
MIN_THICKNESS = 0.05
TOLERANCE = 0.02
MIN_OPENING = 0.5
MAX_OPENING = 2.6
EXTERIOR_THICKNESS = 0.25
MIN_ROOM_AREA = 0.5
MIN_FURNITURE = 0.25
MAX_FURNITURE = 3.5


@dataclass
class FloorResult:
    floor: FloorConfig
    walls: list[WallSegment]
    openings: list[OpeningCandidate]
    rooms: list[RoomRegion]
    unmatched_labels: list[RoomLabel]
    furniture: list[FurnitureCandidate]


def extract_floor(content: PlanContent, floor: FloorConfig, points_per_metre: float) -> FloorResult:
    """Walls, openings and rooms of one floor, all still in drawing units."""
    unit = points_per_metre
    grid = Grid.from_polygons(content.wall_polygons, floor.clip, SNAP * unit)
    walls = extract_walls(
        grid,
        WallSettings(
            min_thickness=MIN_THICKNESS * unit,
            tolerance=TOLERANCE * unit,
            min_opening=MIN_OPENING * unit,
            max_opening=MAX_OPENING * unit,
        ),
    )
    openings = classify_openings(walls, content.curves, EXTERIOR_THICKNESS * unit, TOLERANCE * unit)

    closed = copy.deepcopy(grid)
    for opening in openings:
        if opening.kind != 'passage':
            closed.fill(opening.segment.band(opening.start, opening.end))
    rooms, unmatched = detect_rooms(closed, parse_labels(content.text_blocks), MIN_ROOM_AREA * unit * unit)
    furniture = furniture_candidates(
        content.symbol_boxes,
        [room for room in rooms if room.labels],
        openings,
        MIN_FURNITURE * unit,
        MAX_FURNITURE * unit,
        TOLERANCE * unit,
    )
    return FloorResult(floor, walls, openings, rooms, unmatched, furniture)

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .geometry import Point, Rect


@dataclass(frozen=True)
class FloorConfig:
    id: str
    name: str
    elevation: float
    height: float
    clip: Rect
    origin: Point


@dataclass(frozen=True)
class Defaults:
    wall_material: str = 'paint-white'
    floor_material: str = 'wood-oak-natural'
    door_height: float = 2.05
    window_sill: float = 0.85
    window_height: float = 1.5
    glazed_height: float = 2.2


@dataclass(frozen=True)
class PlanConfig:
    pdf: Path
    page: int
    id: str
    name: str
    points_per_metre: float
    wall_fill: tuple[float, float, float]
    floors: list[FloorConfig]
    defaults: Defaults = Defaults()
    opening_overrides: dict[str, dict[str, Any]] = field(default_factory=dict)
    north: float | None = None


def load_config(path: Path) -> PlanConfig:
    raw = json.loads(path.read_text(encoding='utf-8'))
    defaults = raw.get('defaults', {})
    return PlanConfig(
        pdf=(path.parent / raw['pdf']).resolve(),
        page=raw.get('page', 0),
        id=raw['id'],
        name=raw['name'],
        points_per_metre=raw['pointsPerMetre'],
        wall_fill=tuple(raw['wallFill']),
        floors=[
            FloorConfig(
                id=floor['id'],
                name=floor['name'],
                elevation=floor['elevation'],
                height=floor['height'],
                clip=Rect(*floor['clip']),
                origin=tuple(floor['origin']),
            )
            for floor in raw['floors']
        ],
        defaults=Defaults(
            wall_material=defaults.get('wallMaterial', Defaults.wall_material),
            floor_material=defaults.get('floorMaterial', Defaults.floor_material),
            door_height=defaults.get('doorHeight', Defaults.door_height),
            window_sill=defaults.get('windowSill', Defaults.window_sill),
            window_height=defaults.get('windowHeight', Defaults.window_height),
            glazed_height=defaults.get('glazedHeight', Defaults.glazed_height),
        ),
        opening_overrides=raw.get('overrides', {}).get('openings', {}),
        north=raw.get('north'),
    )

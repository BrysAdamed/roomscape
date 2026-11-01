from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .apartment import build_apartment, opening_ids, serialize, wall_ids
from .config import PlanConfig, load_config
from .extract import FloorResult, extract_floor
from .pdf import read_plan, render_clip, render_debug
from .rooms import calibrate


def main() -> int:
    parser = argparse.ArgumentParser(prog='python -m tools.plan_extract', description=__doc__)
    parser.add_argument('config', type=Path, help='plan extraction config (JSON)')
    parser.add_argument('--out', type=Path, help='write the apartment JSON here')
    parser.add_argument('--debug-dir', type=Path, help='write an overlay PNG per floor here')
    parser.add_argument('--plan-images', type=Path, help='render each floor''s plan into this folder under public/ and reference it')
    args = parser.parse_args()

    config = load_config(args.config)
    results = [
        extract_floor(read_plan(config.pdf, floor.clip, config.wall_fill, config.page), floor, config.points_per_metre)
        for floor in config.floors
    ]
    print_report(config, results)

    plan_images = write_plan_images(config, args.plan_images) if args.plan_images else None
    if args.out:
        apartment = build_apartment(config, results, config.points_per_metre, plan_images)
        args.out.write_text(serialize(apartment), encoding='utf-8', newline='\n')
        print(f'\nwrote {args.out}')
    if args.debug_dir:
        args.debug_dir.mkdir(parents=True, exist_ok=True)
        for result in results:
            write_debug(config, result, args.debug_dir / f'{config.id}-{result.floor.id}.png')
            print(f'wrote {args.debug_dir / f"{config.id}-{result.floor.id}.png"}')
    return 0


def write_plan_images(config: PlanConfig, folder: Path, web_root: Path = Path('public')) -> dict[str, str]:
    folder.mkdir(parents=True, exist_ok=True)
    images = {}
    for floor in config.floors:
        output = folder / f'{floor.id}.png'
        render_clip(config.pdf, floor.clip, output, page_number=config.page)
        images[floor.id] = output.resolve().relative_to(web_root.resolve()).as_posix()
    return images


def print_report(config: PlanConfig, results: list[FloorResult]) -> None:
    unit = config.points_per_metre
    rooms = [room for result in results for room in result.rooms]
    fitted = calibrate(rooms)
    print(f'scale: {unit:.3f} pt/m configured', end='')
    print(f', {fitted:.3f} pt/m fitted to room areas ({(fitted / unit - 1) * 100:+.2f}%)' if fitted else '')

    for result in results:
        walls = wall_ids(result)
        openings = opening_ids(result)
        print(f'\n== {result.floor.name}: {len(result.walls)} walls, {len(result.openings)} openings')
        print('  rooms (listed m2 / extracted m2 / error):')
        for room in result.rooms:
            area = room.area / unit**2
            if not room.labels:
                print(f'    (unlabelled)          {"":>6}  {area:6.2f}')
                continue
            listed = sum(label.area for label in room.labels)
            name = ' + '.join(label.caption for label in room.labels)
            holes = f'  ({room.holes} hole(s) ignored)' if room.holes else ''
            print(f'    {name:<34} {listed:6.2f}  {area:6.2f}  {(area / listed - 1) * 100:+5.1f}%{holes}')
        for label in result.unmatched_labels:
            print(f'    {label.caption}: not enclosed by walls ({label.area:.2f} m2)')
        print('  openings:')
        for opening in result.openings:
            hinge = ''
            if opening.kind == 'door':
                hinge = f" hinge {'start' if opening.hinge_at_start else 'end'}"
                hinge += f", opens {'left' if opening.opens_left else 'right'}"
            double = ' (double)' if opening.double else ''
            print(
                f'    {openings[id(opening)]} on {walls[id(opening.segment)]}: '
                f'{opening.kind} {opening.width / unit:.2f} m{hinge}{double}'
            )
        print('  furniture candidates (room: centre x, y / footprint w x d in plan axes, m):')
        ox, oy = result.floor.origin
        for candidate in result.furniture:
            box = candidate.box
            centre = ((box.x0 + box.x1) / 2 - ox) / unit, ((box.y0 + box.y1) / 2 - oy) / unit
            print(
                f'    {candidate.room.labels[0].caption}: '
                f'({centre[0]:.2f}, {centre[1]:.2f}) / {box.width / unit:.2f} x {box.height / unit:.2f}'
                f'  [{candidate.strokes} strokes]'
            )


def write_debug(config: PlanConfig, result: FloorResult, output: Path) -> None:
    lines = []
    for wall in result.walls:
        lines.append((wall.point(wall.start), wall.point(wall.end), (0.9, 0, 0), 0.4))
    colours = {'door': (0, 0.5, 1), 'glazed': (0, 0.7, 0.7), 'window': (0, 0.7, 0), 'passage': (0.9, 0.5, 0)}
    for opening in result.openings:
        segment = opening.segment
        lines.append((segment.point(opening.start), segment.point(opening.end), colours[opening.kind], 1.2))
    polygons = [(room.polygon, (0.6, 0, 0.8) if room.labels else (0.5, 0.5, 0.5)) for room in result.rooms]
    for candidate in result.furniture:
        box = candidate.box
        polygons.append(([(box.x0, box.y0), (box.x1, box.y0), (box.x1, box.y1), (box.x0, box.y1)], (1, 0.6, 0)))
    render_debug(config.pdf, result.floor.clip, output, lines, polygons, config.page)


if __name__ == '__main__':
    sys.exit(main())

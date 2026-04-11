#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Iterable

from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.export import to_canvas, to_html, to_json, to_obsidian
from graphify.extract import extract
from graphify.report import generate

CODE_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.kts', '.gradle'}
DEFAULT_INCLUDE_ROOTS = (
    'src',
    'scripts',
    'android/app/src/main/java',
    'eslint.config.js',
    'vite.config.ts',
    'vitest.config.ts',
    'capacitor.config.ts',
)
DEFAULT_EXCLUDE_PARTS = {
    'node_modules',
    'dist',
    'coverage',
    'graphify-out',
    '.venv-graphify',
    '.git',
    '__pycache__',
}
DEFAULT_EXCLUDE_SUBSTRINGS = (
    '/android/app/src/main/assets/public/',
    '/android/app/src/test/',
    '/android/app/src/androidTest/',
    '/scripts/e2e/',
    '/e2e/',
    '/src/__tests__/',
    '.test.',
    '.spec.',
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Build a curated Graphify knowledge graph for MealPlaning.',
    )
    parser.add_argument(
        '--root',
        default='.',
        help='Repository root to scan.',
    )
    parser.add_argument(
        '--output',
        default='graphify-out',
        help='Directory for generated graph artifacts.',
    )
    parser.add_argument(
        '--include-root',
        action='append',
        default=[],
        help='Additional file or directory roots to include.',
    )
    parser.add_argument(
        '--include-e2e',
        action='store_true',
        help='Include E2E test harness files. Disabled by default to keep the graph architecture-focused.',
    )
    parser.add_argument(
        '--include-android-assets',
        action='store_true',
        help='Include generated Android web assets. Disabled by default because they pollute the graph.',
    )
    parser.add_argument(
        '--no-viz',
        action='store_true',
        help='Skip HTML and Obsidian visual outputs.',
    )
    return parser.parse_args()


def to_rel_posix(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def should_include(path: Path, root: Path, include_e2e: bool, include_android_assets: bool) -> bool:
    if path.suffix not in CODE_EXTENSIONS:
        return False
    if any(part in DEFAULT_EXCLUDE_PARTS for part in path.parts):
        return False

    normalized = f'/{to_rel_posix(path, root)}/'
    excludes = list(DEFAULT_EXCLUDE_SUBSTRINGS)
    if include_e2e:
        excludes = [item for item in excludes if item not in ('/scripts/e2e/', '/e2e/', '/src/__tests__/')]
    if include_android_assets:
        excludes = [item for item in excludes if item != '/android/app/src/main/assets/public/']

    return not any(fragment in normalized for fragment in excludes)


def collect_code_files(root: Path, include_roots: Iterable[str], include_e2e: bool, include_android_assets: bool) -> list[Path]:
    files: list[Path] = []
    for relative_root in include_roots:
        base = root / relative_root
        if not base.exists():
            continue
        candidates = [base] if base.is_file() else [entry for entry in base.rglob('*') if entry.is_file()]
        for candidate in candidates:
            if should_include(candidate, root, include_e2e, include_android_assets):
                files.append(candidate)
    return sorted(set(files))


def count_words(paths: Iterable[Path]) -> int:
    total = 0
    for path in paths:
        try:
            total += len(path.read_text(errors='ignore').split())
        except OSError:
            continue
    return total


def build_labels(graph, communities: dict[int, list[str]]) -> dict[int, str]:
    labels: dict[int, str] = {}
    node_data = dict(graph.nodes(data=True))
    for community_id, node_ids in communities.items():
        source_dirs = Counter()
        human_labels = []
        for node_id in node_ids:
            data = node_data.get(node_id, {})
            source_file = data.get('source_file')
            if source_file:
                path = Path(source_file)
                top = path.parts[0] if path.parts else source_file
                source_dirs[top] += 1
            label = data.get('label')
            if label:
                human_labels.append(str(label))
        top_dir = source_dirs.most_common(1)[0][0] if source_dirs else 'repo'
        top_label = human_labels[0] if human_labels else f'community-{community_id}'
        compact_label = f'{top_dir}: {top_label}'
        labels[community_id] = compact_label[:48]
    return labels


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    output_dir = (root / args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    include_roots = [*DEFAULT_INCLUDE_ROOTS, *args.include_root]
    files = collect_code_files(root, include_roots, args.include_e2e, args.include_android_assets)
    if not files:
        raise SystemExit('No code files matched the curated scope.')

    detection = {
        'files': {'code': [to_rel_posix(path, root) for path in files]},
        'total_files': len(files),
        'total_words': count_words(files),
    }
    (root / '.graphify_scope.json').write_text(json.dumps({'files': detection['files']['code']}, indent=2))
    (root / '.graphify_detect.json').write_text(json.dumps(detection, indent=2))

    ast = extract(files)
    (root / '.graphify_ast.json').write_text(json.dumps(ast, indent=2))

    extraction = {
        'nodes': ast['nodes'],
        'edges': ast['edges'],
        'input_tokens': 0,
        'output_tokens': 0,
    }
    (root / '.graphify_extract.json').write_text(json.dumps(extraction, indent=2))

    graph = build_from_json(extraction)
    if graph.number_of_nodes() == 0:
        raise SystemExit('Graphify produced an empty graph.')

    communities = cluster(graph)
    cohesion = score_all(graph, communities)
    labels = build_labels(graph, communities)
    gods = god_nodes(graph)
    surprises = surprising_connections(graph, communities)
    questions = suggest_questions(graph, communities, labels)

    analysis = {
        'communities': {str(key): value for key, value in communities.items()},
        'cohesion': {str(key): value for key, value in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    (root / '.graphify_analysis.json').write_text(json.dumps(analysis, indent=2))
    (root / '.graphify_labels.json').write_text(json.dumps({str(key): value for key, value in labels.items()}, indent=2))

    report = generate(
        graph,
        communities,
        cohesion,
        labels,
        gods,
        surprises,
        detection,
        {'input': 0, 'output': 0},
        str(root),
        suggested_questions=questions,
    )
    (output_dir / 'GRAPH_REPORT.md').write_text(report)
    to_json(graph, communities, str(output_dir / 'graph.json'))

    summary = {
        'filtered_files': len(files),
        'graph_nodes': graph.number_of_nodes(),
        'graph_edges': graph.number_of_edges(),
        'communities': len(communities),
        'top_god_nodes': gods[:10],
    }

    if not args.no_viz:
        note_count = to_obsidian(graph, communities, str(output_dir / 'obsidian'), community_labels=labels, cohesion=cohesion)
        to_canvas(graph, communities, str(output_dir / 'obsidian' / 'graph.canvas'), community_labels=labels)
        html_written = False
        if graph.number_of_nodes() <= 5000:
            to_html(graph, communities, str(output_dir / 'graph.html'), community_labels=labels)
            html_written = True
        summary['obsidian_notes'] = note_count
        summary['html_written'] = html_written

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

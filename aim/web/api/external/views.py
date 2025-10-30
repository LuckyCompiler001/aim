import csv
import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional

from aim.web.api.utils import APIRouter  # wrapper for fastapi.APIRouter
from aim.web.configs import AIM_EXTERNAL_DATA_PATH
from fastapi import HTTPException, Query


external_router = APIRouter()

METRICS_FILE = 'metrics.jsonl'
PREDICTIONS_FILE = 'preds_val.csv'
PROBE_FILE = 'probe_ethnicity.json'
DEFAULT_MAX_PREDICTION_ROWS = 500


def _resolve_root_path() -> Path:
    configured_path = os.getenv(AIM_EXTERNAL_DATA_PATH)
    if not configured_path:
        raise HTTPException(
            status_code=404,
            detail=f'Environment variable {AIM_EXTERNAL_DATA_PATH} is not set.',
        )
    normalized_path = _normalize_external_path(configured_path)
    path = Path(normalized_path).expanduser().resolve()
    if not path.exists() or not path.is_dir():
        raise HTTPException(status_code=404, detail=f'Configured path {path} does not exist or is not a directory.')
    return path


def _normalize_external_path(raw_path: str) -> str:
    """
    Convert Windows-style paths (e.g. C:\\Users\\...) to their WSL-mounted equivalents when
    executing inside a POSIX environment. Helps when the environment variable is set in Windows
    shells but Aim runs under WSL.
    """
    if os.name == 'nt':
        return raw_path

    match = re.match(r'^(?P<drive>[a-zA-Z]):[\\/](?P<rest>.*)$', raw_path)
    if not match:
        return raw_path

    drive_letter = match.group('drive').lower()
    rest = match.group('rest').replace('\\', '/')
    return f'/mnt/{drive_letter}/{rest}'


def _load_metrics_file(root: Path) -> List[Dict]:
    metrics_path = root / METRICS_FILE
    if not metrics_path.exists():
        return []

    metrics: List[Dict] = []
    with metrics_path.open('r', encoding='utf-8') as metrics_file:
        for line in metrics_file:
            line = line.strip()
            if not line:
                continue
            try:
                metrics.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status_code=500,
                    detail=f'Unable to parse metrics file {metrics_path.name}: {exc}',
                ) from exc
    return metrics


def _load_predictions_file(root: Path, limit: Optional[int]) -> Dict:
    predictions_path = root / PREDICTIONS_FILE
    if not predictions_path.exists():
        return {'columns': [], 'rows': []}

    with predictions_path.open('r', encoding='utf-8') as predictions_file:
        reader = csv.DictReader(predictions_file)
        columns = reader.fieldnames or []
        rows: List[Dict] = []
        for row_idx, row in enumerate(reader, start=1):
            rows.append(row)
            if limit and row_idx >= limit:
                break

    return {'columns': columns, 'rows': rows}


def _load_probe_file(root: Path) -> Dict:
    probe_path = root / PROBE_FILE
    if not probe_path.exists():
        return {}

    try:
        with probe_path.open('r', encoding='utf-8') as probe_file:
            return json.load(probe_file)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f'Unable to parse probe file {probe_path.name}: {exc}',
        ) from exc


@external_router.get('/data/')
def get_external_metrics_data(
    max_prediction_rows: int = Query(DEFAULT_MAX_PREDICTION_ROWS, ge=1, le=5000),
):
    base_path = _resolve_root_path()
    configured_path = os.getenv(AIM_EXTERNAL_DATA_PATH)
    metrics = _load_metrics_file(base_path)
    predictions = _load_predictions_file(base_path, limit=max_prediction_rows)
    probe = _load_probe_file(base_path)

    return {
        'base_path': str(base_path),
        'configured_path': configured_path,
        'files': {
            'metrics': (base_path / METRICS_FILE).exists(),
            'predictions': (base_path / PREDICTIONS_FILE).exists(),
            'probe': (base_path / PROBE_FILE).exists(),
        },
        'metrics': metrics,
        'predictions': predictions,
        'probe': probe,
    }

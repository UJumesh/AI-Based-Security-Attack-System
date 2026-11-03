"""Parameterized history reads and durable prediction inserts."""
import logging
import psycopg
from fastapi import HTTPException
from . import connection as db
logger = logging.getLogger(__name__)

def get_history(limit: int=20, page: int=1, search: str='', status: str='all', sort: str='created_at', direction: str='desc'):
    clauses, params = ([], [])
    if search:
        clauses.append('(id::text ILIKE %s OR prediction ILIKE %s OR created_at::text ILIKE %s)')
        literal = search.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        params.extend([f'%{literal}%'] * 3)
    if status != 'all':
        clauses.append('is_benign = %s')
        params.append(status == 'benign')
    where = ' WHERE ' + ' AND '.join(clauses) if clauses else ''
    try:
        with db.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY')
                cur.execute('SELECT COUNT(*), COUNT(*) FILTER (WHERE is_benign), COUNT(*) FILTER (WHERE NOT is_benign) FROM prediction_history')
                total_saved, benign, attacks = cur.fetchone()
                cur.execute('SELECT COUNT(*) FROM prediction_history' + where, tuple(params))
                total = cur.fetchone()[0]
                cur.execute('SELECT id, prediction, prediction_id, is_benign, confidence_percent, features_received, created_at, source FROM prediction_history' + where + f' ORDER BY {sort} {direction} NULLS LAST, id {direction} LIMIT %s OFFSET %s', tuple(params + [limit, (page - 1) * limit]))
                rows = cur.fetchall()
        records = [dict(zip(['id', 'prediction', 'prediction_id', 'is_benign', 'confidence_percent', 'features_received', 'created_at', 'source'], [r[0], r[1], r[2], r[3], float(r[4]) if r[4] is not None else None, r[5], r[6].isoformat(), r[7]])) for r in rows]
        return {'count': len(records), 'history': records, 'total': total, 'total_pages': (total + limit - 1) // limit, 'page': page, 'limit': limit, 'summary': {'total': total_saved, 'benign': benign, 'attacks': attacks}}
    except (psycopg.Error, RuntimeError, ValueError, OSError) as exc:
        logger.warning('History database unavailable (%s)', type(exc).__name__)
        raise HTTPException(503, 'Unable to retrieve prediction history.') from exc


def save_prediction(label, class_id, is_benign, confidence, feature_count, source):
    """Return only after the transaction commits successfully."""
    with db.get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO prediction_history "
                "(prediction, prediction_id, is_benign, confidence_percent, features_received, source) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
                (label, class_id, is_benign, confidence, feature_count, source),
            )
            saved = cur.fetchone()
    return saved

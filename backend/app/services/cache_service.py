import hashlib
import json
import logging
import time
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

KEY_PREFIX = "legal_qa:"
DEFAULT_TTL = 3600  # 1 hour

# In-memory cache fallback when Redis is not available
_memory_cache: dict[str, tuple[dict, float]] = {}  # key -> (value, expire_time)
_redis_client = None
_redis_checked = False


def _get_redis():
    """Try to connect to Redis. Falls back to in-memory cache."""
    global _redis_client, _redis_checked

    if _redis_checked:
        return _redis_client

    _redis_checked = True
    try:
        import redis
        client = redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        _redis_client = client
        logger.info("Redis connected")
    except Exception:
        logger.info("Redis not available — using in-memory cache")
        _redis_client = None

    return _redis_client


def _make_key(document_id: str, question: str) -> str:
    """Generate cache key from document_id + normalized question."""
    normalized = question.lower().strip()
    raw = f"{document_id}:{normalized}"
    hash_val = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"{KEY_PREFIX}{hash_val}"


def get(document_id: str, question: str) -> Optional[dict]:
    """Check cache for an existing answer."""
    key = _make_key(document_id, question)
    client = _get_redis()

    if client:
        try:
            data = client.get(key)
            if data:
                return json.loads(data)
        except Exception:
            pass
    else:
        # In-memory fallback
        if key in _memory_cache:
            value, expire_time = _memory_cache[key]
            if time.time() < expire_time:
                return value
            else:
                del _memory_cache[key]

    return None


def set(document_id: str, question: str, response: dict, ttl: int = DEFAULT_TTL) -> None:
    """Cache an answer with TTL."""
    key = _make_key(document_id, question)
    client = _get_redis()

    if client:
        try:
            client.setex(key, ttl, json.dumps(response))
        except Exception:
            pass
    else:
        # In-memory fallback
        _memory_cache[key] = (response, time.time() + ttl)


def invalidate_document(document_id: str) -> None:
    """Delete all cached answers for a document."""
    client = _get_redis()

    if client:
        try:
            # Scan for matching keys
            cursor = 0
            while True:
                cursor, keys = client.scan(cursor, match=f"{KEY_PREFIX}*", count=100)
                if keys:
                    client.delete(*keys)
                if cursor == 0:
                    break
        except Exception:
            pass
    else:
        # In-memory: clear all (simple approach for dev)
        keys_to_delete = [k for k in _memory_cache if k.startswith(KEY_PREFIX)]
        for k in keys_to_delete:
            del _memory_cache[k]

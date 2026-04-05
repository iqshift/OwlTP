import os
from typing import Optional

import redis


_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    """
    Singleton Redis client used for rate limiting and background coordination.
    """
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
        _redis_client = redis.from_url(redis_url)
    return _redis_client


def close_redis():
    global _redis_client
    if _redis_client:
        _redis_client.close()
        _redis_client = None


def check_rate_limit(token: str, limit_per_minute: int = 30) -> bool:
    """
    Simple fixed-window rate limiter per API token.

    Returns True if allowed, False if limit exceeded.
    """
    r = get_redis()
    key = f"rate:{token}"

    with r.pipeline() as pipe:
        while True:
            try:
                pipe.watch(key)
                current = pipe.get(key)
                current_val = int(current) if current is not None else 0
                if current_val >= limit_per_minute:
                    pipe.unwatch()
                    return False

                pipe.multi()
                pipe.incr(key, 1)
                if current is None:
                    # expire this counter after 60 seconds
                    pipe.expire(key, 60)
                pipe.execute()
                return True
            except redis.WatchError:
                # Retry optimistic lock
                continue


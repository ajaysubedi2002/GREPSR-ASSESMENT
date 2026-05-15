"""
rate_limiter.py
---------------
Custom Fixed Window rate limiter backed by Redis.

Algorithm
---------
Each IP address has one Redis key with a TTL equal to the window size.
The key stores a counter for that IP within the current window.

On every POST /api/shorten/ call:
    1. Atomically INCR the counter and ensure the key has a TTL.
    2. If the counter exceeds MAX_REQUESTS, return Retry-After from TTL.
    3. Otherwise allow the request.

Complexity: O(1) per check. No background cleanup needed - Redis expires
keys automatically when the window ends.
"""

from django.conf import settings
from redis import Redis
from redis.exceptions import RedisError

MAX_REQUESTS: int = getattr(settings, 'RATE_LIMIT_MAX_REQUESTS', 5)
WINDOW_SECONDS: int = getattr(settings, 'RATE_LIMIT_WINDOW_SECONDS', 60)
REDIS_HOST: str = getattr(settings, 'RATE_LIMIT_REDIS_HOST', 'localhost')
REDIS_PORT: int = getattr(settings, 'RATE_LIMIT_REDIS_PORT', 6379)
REDIS_DB: int = getattr(settings, 'RATE_LIMIT_REDIS_DB', 0)
REDIS_PASSWORD: str | None = getattr(settings, 'RATE_LIMIT_REDIS_PASSWORD', None)
REDIS_PREFIX: str = getattr(settings, 'RATE_LIMIT_REDIS_PREFIX', 'rate-limit')

_redis_client: Redis | None = None

_INCR_WITH_TTL_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
local ttl = redis.call('TTL', KEYS[1])
if ttl == -1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
  ttl = ARGV[1]
end
return {current, ttl}
"""


def _get_redis_client() -> Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            password=REDIS_PASSWORD,
            decode_responses=False,
        )
    return _redis_client


def get_client_ip(request) -> str:
    """
    Extract the real client IP address from the request.

    Checks X-Forwarded-For first (set by load balancers / proxies).
    Falls back to REMOTE_ADDR for direct connections.
    """
    x_forwarded_for: str | None = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


class RateLimitExceeded(Exception):
    """
    Raised when an IP address has used all its requests for the current window.

    Attributes:
        retry_after (int): seconds the client must wait before trying again.
    """

    def __init__(self, retry_after: int) -> None:
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded. Retry after {retry_after}s.")


def check_rate_limit(ip_address: str) -> None:
    """
    Check and update the rate-limit state for the given IP address.

    Args:
        ip_address: The client's IP address string.

    Raises:
        RateLimitExceeded: if the IP has reached MAX_REQUESTS in this window.
    """
    client = _get_redis_client()
    key = f"{REDIS_PREFIX}:{ip_address}"

    try:
        count, ttl = client.eval(_INCR_WITH_TTL_SCRIPT, 1, key, WINDOW_SECONDS)
    except RedisError:
        # Fail open if Redis is unavailable to avoid blocking the API.
        return

    try:
        count_value = int(count)
    except (TypeError, ValueError):
        return

    if count_value > MAX_REQUESTS:
        try:
            ttl_value = int(ttl)
        except (TypeError, ValueError):
            ttl_value = WINDOW_SECONDS
        if ttl_value < 1:
            ttl_value = WINDOW_SECONDS
        raise RateLimitExceeded(retry_after=ttl_value)
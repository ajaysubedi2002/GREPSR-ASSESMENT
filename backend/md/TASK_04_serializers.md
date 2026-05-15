# TASK 04 — DRF Serializers

## Goal
Create all request-validation and response-shaping serializers in
`shortener/serializers.py`.

---

## File to Create

**`backend/shortener/serializers.py`**

---

## Full File Content

```python
from rest_framework import serializers
from .models import ShortenedURL, Click


class ShortenRequestSerializer(serializers.Serializer):
    """
    Validates the body of POST /api/shorten/.

    Expected input:
        { "url": "https://example.com/very/long/path" }

    Rejects:
        - Missing "url" field
        - Blank string
        - Any string that is not a valid absolute URL
    """

    url = serializers.URLField(
        max_length=2048,
        error_messages={
            'required': 'A "url" field is required.',
            'blank': 'The "url" field must not be empty.',
            'invalid': (
                'Please provide a valid URL including the scheme '
                '(http:// or https://).'
            ),
        },
    )


class ShortenedURLSerializer(serializers.ModelSerializer):
    """
    Serializes a ShortenedURL for list and detail responses.

    Extra computed fields:
        short_url    — absolute URL built from the request context
        total_clicks — count of all Click rows for this alias
    """

    short_url = serializers.SerializerMethodField()
    total_clicks = serializers.SerializerMethodField()

    class Meta:
        model = ShortenedURL
        fields = [
            'id',
            'alias',
            'original_url',
            'short_url',
            'total_clicks',
            'created_at',
        ]

    def get_short_url(self, obj: ShortenedURL) -> str:
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/{obj.alias}/')
        return f'/{obj.alias}/'

    def get_total_clicks(self, obj: ShortenedURL) -> int:
        return obj.clicks.count()


class AnalyticsDataPointSerializer(serializers.Serializer):
    """
    One data point in the 7-day analytics response.

    Shape:
        { "date": "2025-05-13", "clicks": 4 }
    """

    date = serializers.DateField()
    clicks = serializers.IntegerField(min_value=0)
```

---

## Serializer Responsibilities

| Serializer | Used in | Direction |
|-----------|---------|-----------|
| `ShortenRequestSerializer` | `POST /api/shorten/` | Inbound validation |
| `ShortenedURLSerializer` | `GET /api/urls/`, `GET /api/urls/<alias>/`, `POST /api/shorten/` response | Outbound |
| `AnalyticsDataPointSerializer` | `GET /api/urls/<alias>/analytics/` | Outbound |

---

## Acceptance Criteria

- [ ] `ShortenRequestSerializer` rejects a missing `url` field with a clear error message
- [ ] `ShortenRequestSerializer` rejects `"url": "not-a-url"` as invalid
- [ ] `ShortenedURLSerializer.get_short_url()` returns an absolute URL when `request` context is provided
- [ ] `ShortenedURLSerializer.get_total_clicks()` returns an integer
- [ ] `AnalyticsDataPointSerializer` has both `date` and `clicks` fields

---

## Common Failure Modes

| Problem | Fix |
|---------|-----|
| `short_url` returns a relative path | Pass `context={'request': request}` when instantiating the serializer |
| `total_clicks` causes N+1 queries | Use `prefetch_related('clicks')` in the view queryset |
| `URLField` accepts `"example.com"` (no scheme) | Django's `URLField` requires a scheme by default — no extra config needed |

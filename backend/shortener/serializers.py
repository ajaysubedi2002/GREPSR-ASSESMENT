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
        short_url    - absolute URL built from the request context
        total_clicks - count of all Click rows for this alias
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


class AnalyticsResponseSerializer(serializers.Serializer):
    """
    Full analytics response payload.

    Shape:
        {
            "alias": "a1b2c3",
            "original_url": "https://example.com/...",
            "data": [
                { "date": "2025-05-07", "clicks": 2 },
                ...
            ]
        }
    """

    alias = serializers.CharField()
    original_url = serializers.URLField()
    data = AnalyticsDataPointSerializer(many=True)
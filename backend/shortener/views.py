"""
views.py
--------
All API views for the URL shortener.

Endpoints:
  POST /api/shorten/                - shorten a URL (rate-limited)
  GET  /api/urls/                   - list all shortened URLs
  GET  /api/urls/<alias>/           - detail for one alias
  GET  /api/urls/<alias>/analytics/ - 7-day click analytics
"""

from datetime import date, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiResponse, extend_schema

from .models import Click, ShortenedURL
from .rate_limiter import RateLimitExceeded, check_rate_limit, get_client_ip
from .serializers import (
    AnalyticsDataPointSerializer,
    AnalyticsResponseSerializer,
    ShortenRequestSerializer,
    ShortenedURLSerializer,
)


class ShortenURLView(APIView):
    """
    POST /api/shorten/

    Body:
        { "url": "https://example.com/long/path" }

    Success (201):
        {
            "id": 1,
            "alias": "a1b2c3",
            "original_url": "https://example.com/long/path",
            "short_url": "http://localhost:8000/a1b2c3/",
            "total_clicks": 0,
            "created_at": "2025-05-13T10:00:00Z"
        }

    Rate limit exceeded (429):
        {
            "error": "Rate limit exceeded.",
            "retry_after_seconds": 42,
            "message": "You can shorten up to 5 URLs per minute. Please wait 42 second(s)."
        }
        Header: Retry-After: 42
    """

    @extend_schema(
        request=ShortenRequestSerializer,
        responses={
            201: ShortenedURLSerializer,
            400: OpenApiResponse(description='Validation error'),
            429: OpenApiResponse(description='Rate limit exceeded'),
            500: OpenApiResponse(description='Failed to generate alias'),
        },
        operation_id='shorten_url',
        tags=['Shorten'],
    )
    def post(self, request: Request) -> Response:
        ip = get_client_ip(request)

        # 1. Rate limit check
        try:
            check_rate_limit(ip)
        except RateLimitExceeded as exc:
            return Response(
                {
                    'error': 'Rate limit exceeded.',
                    'retry_after_seconds': exc.retry_after,
                    'message': (
                        'You can shorten up to 5 URLs per minute. '
                        f'Please wait {exc.retry_after} second(s).'
                    ),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={'Retry-After': str(exc.retry_after)},
            )

        # 2. Validate request body
        serializer = ShortenRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        original_url: str = serializer.validated_data['url']

        # 3. Generate a unique alias
        alias = ShortenedURL.generate_alias(original_url)
        attempts = 0
        while ShortenedURL.objects.filter(alias=alias).exists() and attempts < 5:
            alias = ShortenedURL.generate_alias(original_url + str(attempts))
            attempts += 1

        if attempts == 5 and ShortenedURL.objects.filter(alias=alias).exists():
            return Response(
                {'error': 'Could not generate a unique alias. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        shortened = ShortenedURL.objects.create(
            alias=alias,
            original_url=original_url,
        )

        out = ShortenedURLSerializer(shortened, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)


class URLListView(APIView):
    """
    GET /api/url/

    Returns all shortened URLs ordered by creation date (newest first).
    Each entry includes total_clicks computed from related Click rows.

    Success (200): list of ShortenedURL objects
    """

    @extend_schema(
        responses={200: ShortenedURLSerializer(many=True)},
        operation_id='list_urls',
        tags=['URLs'],
    )
    def get(self, request: Request) -> Response:
        urls = ShortenedURL.objects.prefetch_related('clicks').all()
        serializer = ShortenedURLSerializer(
            urls, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class URLDetailView(APIView):
    """
    GET /api/urls/<alias>/

    Returns detail for a single shortened URL.

    Success (200): single ShortenedURL object with total_clicks

    Not found (404): { "error": "No URL found for alias 'xyz'." }
    """

    @extend_schema(
        responses={
            200: ShortenedURLSerializer,
            404: OpenApiResponse(description='Alias not found'),
        },
        operation_id='retrieve_url',
        tags=['URLs'],
    )
    def get(self, request: Request, alias: str) -> Response:
        try:
            url = ShortenedURL.objects.prefetch_related('clicks').get(alias=alias)
        except ShortenedURL.DoesNotExist:
            return Response(
                {'error': f"No URL found for alias '{alias}'."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ShortenedURLSerializer(url, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class URLAnalyticsView(APIView):
    """
    GET /api/urls/<alias>/analytics/

    Returns daily click counts for the last 7 days (oldest -> newest).
    Days with zero clicks are included (zero-filled).

    Success (200):
        {
            "alias": "a1b2c3",
            "original_url": "https://example.com/...",
            "data": [
                { "date": "2025-05-07", "clicks": 2 },
                { "date": "2025-05-08", "clicks": 0 },
                ...
                { "date": "2025-05-13", "clicks": 4 }
            ]
        }

    Not found (404): { "error": "No URL found for alias 'xyz'." }
    """

    @extend_schema(
        responses={
            200: AnalyticsResponseSerializer,
            404: OpenApiResponse(description='Alias not found'),
        },
        operation_id='url_analytics',
        tags=['Analytics'],
    )
    def get(self, request: Request, alias: str) -> Response:
        try:
            url = ShortenedURL.objects.get(alias=alias)
        except ShortenedURL.DoesNotExist:
            return Response(
                {'error': f"No URL found for alias '{alias}'."},
                status=status.HTTP_404_NOT_FOUND,
            )

        today: date = timezone.now().date()
        # Build a list of the last 7 days, oldest first
        days: list[date] = [today - timedelta(days=i) for i in range(6, -1, -1)]

        # Aggregate clicks per day from the database
        clicks_qs = Click.objects.filter(
            shortened_url=url,
            clicked_at__date__gte=days[0],
        )
        counts: dict[date, int] = {}
        for click in clicks_qs:
            d = click.clicked_at.date()
            counts[d] = counts.get(d, 0) + 1

        # Zero-fill missing days
        data = [{'date': str(d), 'clicks': counts.get(d, 0)} for d in days]
        serializer = AnalyticsDataPointSerializer(data, many=True)

        return Response(
            {
                'alias': url.alias,
                'original_url': url.original_url,
                'data': serializer.data,
            },
            status=status.HTTP_200_OK,
        )
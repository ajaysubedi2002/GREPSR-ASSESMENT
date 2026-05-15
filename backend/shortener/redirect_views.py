"""
redirect_views.py
-----------------
Handles GET /{alias}/ - redirects the visitor to the original URL
and records a Click event with the current timestamp.

This is a standard Django view (not DRF) because the response is an
HTTP redirect, not a JSON payload.
"""

from django.http import HttpRequest, JsonResponse
from django.shortcuts import redirect
from django.views import View

from .models import Click, ShortenedURL
from .rate_limiter import get_client_ip


class RedirectView(View):
    """
    GET /{alias}/

    Behaviour:
      1. Look up the alias in the database.
      2. If not found, return 404 JSON.
      3. Record a Click row with timestamp and visitor IP.
      4. Return HTTP 302 redirect to the original URL.

    Note: The click is recorded BEFORE the redirect so it is not lost
    if the redirect target is unreachable.
    """

    def get(self, request: HttpRequest, alias: str):
        try:
            url = ShortenedURL.objects.get(alias=alias)
        except ShortenedURL.DoesNotExist:
            return JsonResponse(
                {'error': f"Short URL '{alias}' not found."},
                status=404,
            )

        # Record the click
        Click.objects.create(
            shortened_url=url,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return redirect(url.original_url, permanent=False)   # HTTP 302
from django.urls import path
from .views import ShortenURLView, URLListView, URLDetailView, URLAnalyticsView

app_name = 'shortener'

urlpatterns = [
    path('shorten/', ShortenURLView.as_view(), name='shorten'),
    path('urls/', URLListView.as_view(), name='url-list'),
    path('urls/<str:alias>/analytics/', URLAnalyticsView.as_view(), name='url-analytics'),
    path('urls/<str:alias>/', URLDetailView.as_view(), name='url-detail'),
]
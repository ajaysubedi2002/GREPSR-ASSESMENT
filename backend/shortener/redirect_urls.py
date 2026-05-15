from django.urls import path
from .redirect_views import RedirectView

urlpatterns = [
    path('<str:alias>/', RedirectView.as_view(), name='redirect'),
]
 
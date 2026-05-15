"""
Django settings for the URL Shortener project.

For production use, move SECRET_KEY to an environment variable and
set DEBUG = False.
"""

from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Security
# IMPORTANT: Replace this with a real secret in production (use env var).
SECRET_KEY = 'django-insecure-replace-this-before-deploying-to-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

# Installed Apps
INSTALLED_APPS = [
    # Django internals (contenttypes + auth needed for migrations)
    'django.contrib.contenttypes',
    'django.contrib.auth',
    # Third-party
    'rest_framework',
    'corsheaders',
    'drf_spectacular',

    # Local
    'shortener',
]



# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # Must be first
    'django.middleware.common.CommonMiddleware',
]

# URL Configuration
ROOT_URLCONF = 'config.urls'

# Templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS
# Allow only the React frontend origin.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',

}

# Timezone
USE_TZ = True
TIME_ZONE = 'UTC'

# Primary Key
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Rate Limiter
# These constants are read by shortener/rate_limiter.py.
# Change RATE_LIMIT_MAX_REQUESTS to adjust how many shortenings are
# allowed per IP per window.
RATE_LIMIT_MAX_REQUESTS = 5    # max requests per window
RATE_LIMIT_WINDOW_SECONDS = 60 # window duration in seconds



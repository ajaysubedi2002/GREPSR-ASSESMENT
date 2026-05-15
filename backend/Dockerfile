# Base image - slim Python 3.11 for a small final image
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install dependencies first (cached layer - only rebuilds when requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source
COPY . .

# Apply database migrations at container start
RUN python manage.py migrate --no-input

# Expose the development server port
EXPOSE 8000

# Start Django's development server, binding to all interfaces
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

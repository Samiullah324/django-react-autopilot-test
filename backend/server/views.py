"""Two endpoints — enough to prove the backend container is alive."""
from datetime import datetime, timezone

from django.http import HttpResponse, JsonResponse


def hello(request):
    return JsonResponse({
        'message': 'Hello from Django!',
        'version': '1.0.0',
        'timestamp': datetime.now(timezone.utc).isoformat(),
    })


def health(request):
    return HttpResponse('ok', content_type='text/plain')

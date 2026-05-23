from django.urls import path

from . import views


urlpatterns = [
    path('api/hello/', views.hello, name='hello'),
    path('api/health/', views.health, name='health-api'),
    path('health', views.health, name='health-root'),
]

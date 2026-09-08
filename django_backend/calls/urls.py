from django.urls import path
from .views import CallHistoryView, TurnCredentialsView

urlpatterns = [
    path('history/', CallHistoryView.as_view(), name='call-history'),
    path('turn-credentials/', TurnCredentialsView.as_view(), name='turn-credentials'),
]

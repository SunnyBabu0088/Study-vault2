from django.urls import re_path
from .consumers import CallSignalingConsumer

websocket_urlpatterns = [
    re_path(r'^ws/calls/$', CallSignalingConsumer.as_asgi()),
    re_path(r'^ws/calls/(?P<room_name>\w+)/$', CallSignalingConsumer.as_asgi()),
]

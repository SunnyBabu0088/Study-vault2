import os
import time
import hmac
import hashlib
import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.models import User
from .models import Call
from .serializers import CallSerializer

class CallHistoryView(APIView):
    def get(self, request):
        username = request.query_params.get('username') or getattr(request.user, 'username', None)
        if not username:
            return Response({"error": "Username parameter required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(username=username).first()
        if not user:
            return Response({"calls": []}, status=status.HTTP_200_OK)

        calls = Call.objects.filter(Q(caller=user) | Q(receiver=user)).order_by('-created_at')[:50]
        serializer = CallSerializer(calls, many=True)
        return Response({"calls": serializer.data}, status=status.HTTP_200_OK)


class TurnCredentialsView(APIView):
    def get(self, request):
        # Configure Coturn / STUN / TURN credentials securely
        turn_server = os.getenv('TURN_URL', 'stun:stun.l.google.com:19302')
        turn_secret = os.getenv('TURN_SECRET', '')
        turn_user = os.getenv('TURN_USERNAME', 'studyvault_user')

        ice_servers = [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
        ]

        if turn_secret:
            # Generate short-lived TURN credentials using HMAC-SHA1
            timestamp = int(time.time()) + 86400  # 24 hours validity
            username = f"{timestamp}:{turn_user}"
            digest = hmac.new(turn_secret.encode('utf-8'), username.encode('utf-8'), hashlib.sha1).digest()
            credential = base64.b64encode(digest).decode('utf-8')

            ice_servers.append({
                "urls": turn_server,
                "username": username,
                "credential": credential
            })

        return Response({
            "iceServers": ice_servers
        }, status=status.HTTP_200_OK)

from rest_framework import serializers
from .models import Call

class CallSerializer(serializers.ModelSerializer):
    caller_username = serializers.CharField(source='caller.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)

    class Meta:
        model = Call
        fields = [
            'id',
            'caller_username',
            'receiver_username',
            'call_type',
            'status',
            'created_at',
            'started_at',
            'ended_at',
            'duration_seconds',
            'end_reason',
        ]

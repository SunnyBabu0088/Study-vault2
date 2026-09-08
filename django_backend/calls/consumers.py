import json
import logging
from django.utils import timezone
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Call

logger = logging.getLogger(__name__)

# In-memory dictionary tracking active calls per user
# user_id -> call_id
ACTIVE_USER_CALLS = {}

class CallSignalingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Accept connection and setup channels group based on query params if user not in scope
        query_string = self.scope.get("query_string", b"").decode("utf-8")
        username_from_query = None
        if "username=" in query_string:
            for param in query_string.split("&"):
                if param.startswith("username="):
                    username_from_query = param.split("=")[1]

        if not self.user or self.user.is_anonymous:
            if username_from_query:
                self.user = await self.get_user_by_username(username_from_query)

        if not self.user or self.user.is_anonymous:
            # Accept temporary guest room or reject if strictly unauthenticated
            self.user_group = f"user_guest_{self.channel_name}"
        else:
            self.user_group = f"user_{self.user.username}"

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()
        logger.info(f"CallSignalingConsumer connected: {self.user_group}")

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        logger.info(f"CallSignalingConsumer disconnected: {getattr(self, 'user_group', 'unknown')}")

    async def receive_json(self, content):
        event_type = content.get("type")
        call_id = content.get("call_id")
        caller_name = content.get("caller_name") or (self.user.username if self.user and not self.user.is_anonymous else None)
        receiver_name = content.get("receiver_name") or content.get("receiver_id")
        call_type = content.get("call_type", "voice")

        if event_type == "call_offer":
            await self.handle_call_offer(content, call_id, caller_name, receiver_name, call_type)
        elif event_type == "call_answer":
            await self.handle_call_answer(content, call_id, caller_name, receiver_name)
        elif event_type == "ice_candidate":
            await self.handle_ice_candidate(content, receiver_name)
        elif event_type == "call_rejected":
            await self.handle_call_rejected(content, call_id, caller_name, receiver_name)
        elif event_type == "call_ended":
            await self.handle_call_ended(content, call_id, caller_name, receiver_name)
        elif event_type == "call_busy":
            await self.handle_call_busy(content, caller_name)
        elif event_type == "call_cancelled":
            await self.handle_call_cancelled(content, call_id, receiver_name)

    async def handle_call_offer(self, content, call_id, caller_name, receiver_name, call_type):
        if not receiver_name:
            return

        # Check if receiver is already busy
        if receiver_name in ACTIVE_USER_CALLS:
            await self.send_json({
                "type": "call_busy",
                "call_id": call_id,
                "receiver_name": receiver_name,
                "message": f"{receiver_name} is currently busy on another call."
            })
            return

        # Record call in database
        call_record = await self.create_call_record(caller_name, receiver_name, call_type, call_id)

        ACTIVE_USER_CALLS[caller_name] = call_id
        ACTIVE_USER_CALLS[receiver_name] = call_id

        # Dispatch offer to receiver's user channel group
        receiver_group = f"user_{receiver_name}"
        await self.channel_layer.group_send(
            receiver_group,
            {
                "type": "signal_event",
                "payload": {
                    "type": "incoming_call_offer",
                    "call_id": str(call_record.id if call_record else call_id),
                    "caller_name": caller_name,
                    "receiver_name": receiver_name,
                    "call_type": call_type,
                    "offer": content.get("offer"),
                }
            }
        )

    async def handle_call_answer(self, content, call_id, caller_name, receiver_name):
        await self.update_call_status(call_id, "accepted")
        
        target_group = f"user_{caller_name}" if caller_name else None
        if target_group:
            await self.channel_layer.group_send(
                target_group,
                {
                    "type": "signal_event",
                    "payload": {
                        "type": "call_answer_received",
                        "call_id": call_id,
                        "answer": content.get("answer"),
                    }
                }
            )

    async def handle_ice_candidate(self, content, receiver_name):
        target_group = f"user_{receiver_name}" if receiver_name else None
        if target_group:
            await self.channel_layer.group_send(
                target_group,
                {
                    "type": "signal_event",
                    "payload": {
                        "type": "ice_candidate_received",
                        "call_id": content.get("call_id"),
                        "candidate": content.get("candidate"),
                    }
                }
            )

    async def handle_call_rejected(self, content, call_id, caller_name, receiver_name):
        await self.update_call_status(call_id, "rejected", end_reason="Call declined by user")
        self.clear_user_calls(caller_name, receiver_name)

        if caller_name:
            await self.channel_layer.group_send(
                f"user_{caller_name}",
                {
                    "type": "signal_event",
                    "payload": {
                        "type": "call_rejected_received",
                        "call_id": call_id,
                        "receiver_name": receiver_name,
                    }
                }
            )

    async def handle_call_ended(self, content, call_id, caller_name, receiver_name):
        duration = content.get("duration_seconds", 0)
        await self.update_call_status(call_id, "ended", duration=duration, end_reason="Call completed")
        self.clear_user_calls(caller_name, receiver_name)

        target_name = receiver_name if caller_name == getattr(self.user, 'username', None) else caller_name
        if target_name:
            await self.channel_layer.group_send(
                f"user_{target_name}",
                {
                    "type": "signal_event",
                    "payload": {
                        "type": "call_ended_received",
                        "call_id": call_id,
                        "duration_seconds": duration,
                    }
                }
            )

    async def handle_call_busy(self, content, caller_name):
        if caller_name:
            await self.channel_layer.group_send(
                f"user_{caller_name}",
                {
                    "type": "signal_event",
                    "payload": {
                        "type": "call_busy_received",
                        "message": content.get("message", "User is currently busy."),
                    }
                }
            )

    async def handle_call_cancelled(self, content, call_id, receiver_name):
        await self.update_call_status(call_id, "cancelled", end_reason="Cancelled by caller")
        if receiver_name:
            self.clear_user_calls(None, receiver_name)
            await self.channel_layer.group_send(
                f"user_{receiver_name}",
                {
                    "type": "signal_event",
                    "payload": {
                        "type": "call_cancelled_received",
                        "call_id": call_id,
                    }
                }
            )

    async def signal_event(self, event):
        await self.send_json(event["payload"])

    def clear_user_calls(self, u1, u2):
        if u1 in ACTIVE_USER_CALLS:
            del ACTIVE_USER_CALLS[u1]
        if u2 in ACTIVE_USER_CALLS:
            del ACTIVE_USER_CALLS[u2]

    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def create_call_record(self, caller_name, receiver_name, call_type, call_id):
        try:
            caller = User.objects.filter(username=caller_name).first()
            receiver = User.objects.filter(username=receiver_name).first()
            if caller and receiver:
                call_obj = Call.objects.create(
                    id=call_id if call_id and len(str(call_id)) == 36 else None,
                    caller=caller,
                    receiver=receiver,
                    call_type=call_type,
                    status='initiated'
                )
                return call_obj
        except Exception as e:
            logger.error(f"Error creating call record: {e}")
        return None

    @database_sync_to_async
    def update_call_status(self, call_id, status, duration=0, end_reason=None):
        if not call_id:
            return
        try:
            call = Call.objects.filter(id=call_id).first()
            if call:
                call.status = status
                if status == 'accepted':
                    call.started_at = timezone.now()
                elif status in ['ended', 'rejected', 'cancelled', 'failed', 'busy']:
                    call.ended_at = timezone.now()
                    call.duration_seconds = duration
                    call.end_reason = end_reason
                call.save()
        except Exception as e:
            logger.error(f"Error updating call status: {e}")

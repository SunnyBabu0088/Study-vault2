import uuid
from django.db import models
from django.contrib.auth.models import User

class Call(models.Model):
    CALL_TYPES = (
        ('voice', 'Voice'),
        ('video', 'Video'),
    )

    CALL_STATUS = (
        ('initiated', 'Initiated'),
        ('ringing', 'Ringing'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('missed', 'Missed'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
        ('busy', 'Busy'),
        ('failed', 'Failed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    caller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calls_made')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calls_received')
    call_type = models.CharField(max_length=10, choices=CALL_TYPES, default='voice')
    status = models.CharField(max_length=15, choices=CALL_STATUS, default='initiated')
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    end_reason = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'calls'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.call_type.upper()} Call ({self.status}) from {self.caller.username} to {self.receiver.username}"

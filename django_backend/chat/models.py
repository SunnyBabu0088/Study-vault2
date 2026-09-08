import uuid
from django.db import models
from django.contrib.auth.models import User

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'

class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'conversation_members'
        unique_together = ('conversation', 'user')

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

class ConversationSettings(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='settings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_settings')
    theme_id = models.CharField(max_length=50, default='minimalist')
    nickname = models.CharField(max_length=100, null=True, blank=True)
    muted_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversation_settings'
        unique_together = ('conversation', 'user')

class CallSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='calls')
    caller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='outgoing_calls')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incoming_calls', null=True, blank=True)
    call_type = models.CharField(max_length=20, default='audio')
    status = models.CharField(max_length=20, default='initiated')
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'call_sessions'

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50)
    title = models.TextField()
    message = models.TextField()
    payload = models.JSONField(default=dict)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'

class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subjects')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, null=True, blank=True)
    color = models.CharField(max_length=30, default='#3b52cf')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subjects'

class StudyMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_materials', null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    title = models.TextField()
    topic = models.TextField(null=True, blank=True)
    material_type = models.CharField(max_length=30)
    content_url = models.TextField(null=True, blank=True)
    thumbnail_url = models.TextField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    description = models.TextField(null=True, blank=True)
    difficulty = models.CharField(max_length=20, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'study_materials'

class StudySession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True)
    material = models.ForeignKey(StudyMaterial, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=30)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='active')
    last_heartbeat = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'study_sessions'

class MaterialProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='material_progress')
    material = models.ForeignKey(StudyMaterial, on_delete=models.CASCADE, related_name='progress')
    last_position_seconds = models.IntegerField(default=0)
    watched_seconds = models.IntegerField(default=0)
    progress_percentage = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'material_progress'
        unique_together = ('user', 'material')

class Quiz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField()
    subject_name = models.CharField(max_length=100)
    quiz_date = models.DateField(auto_now_add=True)
    level = models.IntegerField(default=1)
    xp_reward = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quizzes'

class QuizQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question = models.TextField()
    option_a = models.TextField()
    option_b = models.TextField()
    option_c = models.TextField()
    option_d = models.TextField()
    correct_answer = models.CharField(max_length=1)
    explanation = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'quiz_questions'

class QuizAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_attempts'

class QuizLevelProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_level_progress')
    level = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)
    unlocks_at = models.DateTimeField()
    status = models.CharField(max_length=20, default='completed')

    class Meta:
        db_table = 'quiz_level_progress'
        unique_together = ('user', 'level')

class UserXP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='xp')
    total_xp = models.IntegerField(default=0)
    quiz_streak = models.IntegerField(default=0)
    last_quiz_date = models.DateField(null=True, blank=True)
    current_level = models.IntegerField(default=1)

    class Meta:
        db_table = 'user_xp'

class Story(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    media_url = models.TextField(null=True, blank=True)
    media_type = models.CharField(max_length=20, default='image')
    content = models.TextField()
    background = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = 'stories'

class StoryView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_views')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'story_views'
        unique_together = ('story', 'user')

class StoryReaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_reactions')
    reaction_type = models.CharField(max_length=20, default='heart')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'story_reactions'
        unique_together = ('story', 'user')

class StoryReply(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='replies')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='story_replies')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'story_replies'


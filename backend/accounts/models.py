
from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    skills = models.CharField(max_length=255, blank=True)
    games = models.CharField(max_length=255, blank=True)
    platform = models.CharField(max_length=255, blank=True)
    achievements = models.TextField(blank=True)

    def __str__(self):
        return self.user.username

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.author.username}'s Post"

    def like_count(self):
        return self.likes.count()


class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requests")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requests")
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['from_user', 'to_user'], name='unique_friend_request')
        ]

    def __str__(self):
        return f"{self.from_user.username} → {self.to_user.username} ({'Accepted' if self.accepted else 'Pending'})"

    def save(self, *args, **kwargs):
        if self.from_user == self.to_user:
            raise ValueError("Users cannot send friend requests to themselves.")
        super().save(*args, **kwargs)

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Conversation {self.id} - {', '.join([user.username for user in self.participants.all()])}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender.username} in Conversation {self.conversation.id}"

class Tournament(models.Model):
    TOURNAMENT_STATUS = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    GAME_CHOICES = [
        ('valorant', 'Valorant'),
        ('csgo', 'CS:GO'),
        ('lol', 'League of Legends'),
        ('dota2', 'Dota 2'),
        ('fortnite', 'Fortnite'),
        ('cod', 'Call of Duty'),
        ('overwatch', 'Overwatch'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    game = models.CharField(max_length=50, choices=GAME_CHOICES)
    max_participants = models.IntegerField()
    current_participants = models.IntegerField(default=0)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=TOURNAMENT_STATUS, default='upcoming')
    rules = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['tournament', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.tournament.name}"


class TournamentMatch(models.Model):
    MATCH_STATUS = [
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    round_number = models.IntegerField()
    match_number = models.IntegerField()
    participant1 = models.ForeignKey(TournamentParticipant, on_delete=models.CASCADE, related_name='matches_as_p1')
    participant2 = models.ForeignKey(TournamentParticipant, on_delete=models.CASCADE, related_name='matches_as_p2')
    winner = models.ForeignKey(TournamentParticipant, on_delete=models.SET_NULL, null=True, blank=True, related_name='matches_won')
    score_p1 = models.IntegerField(default=0)
    score_p2 = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=MATCH_STATUS, default='scheduled')
    
    class Meta:
        unique_together = ['tournament', 'round_number', 'match_number']

    def __str__(self):
        return f"Match {self.match_number} - Round {self.round_number} - {self.tournament.name}"    
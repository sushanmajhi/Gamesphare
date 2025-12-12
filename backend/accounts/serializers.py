from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Post, FriendRequest, Conversation, Message
from .models import Tournament, TournamentParticipant, TournamentMatch  


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "confirm_password"]

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(**validated_data)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    user_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    friends = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "user",
            "user_joined",
            "bio",
            "skills",
            "games",
            "platform",
            "achievements",
            "friends",
        ]

    def get_friends(self, obj):
        # Get accepted friend requests
        sent = FriendRequest.objects.filter(
            from_user=obj.user, accepted=True
        ).values_list("to_user__username", flat=True)
        received = FriendRequest.objects.filter(
            to_user=obj.user, accepted=True
        ).values_list("from_user__username", flat=True)
        return list(sent) + list(received)


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ["id", "author", "content", "created_at", "likes_count", "is_liked"]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = serializers.StringRelatedField()
    to_user = serializers.StringRelatedField()

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "to_user", "accepted", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    is_own = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "content", "created_at", "is_read", "is_own"]

    def get_is_own(self, obj):
        request = self.context.get("request")
        return request and request.user == obj.sender


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.StringRelatedField(many=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participants",
            "created_at",
            "updated_at",
            "last_message",
            "unread_count",
            "other_user",
        ]

    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if request:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

    def get_other_user(self, obj):
        request = self.context.get("request")
        if request:
            other_users = obj.participants.exclude(id=request.user.id)
            if other_users.exists():
                return other_users.first().username
        return None


# TOURNAMENT SERIALIZERS

class TournamentParticipantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = TournamentParticipant
        fields = ['id', 'user', 'joined_at']


class TournamentMatchSerializer(serializers.ModelSerializer):
    participant1 = TournamentParticipantSerializer(read_only=True)
    participant2 = TournamentParticipantSerializer(read_only=True)
    winner = TournamentParticipantSerializer(read_only=True)
    
    class Meta:
        model = TournamentMatch
        fields = '__all__'


class TournamentSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    participants = TournamentParticipantSerializer(many=True, read_only=True)
    matches = TournamentMatchSerializer(many=True, read_only=True)
    is_joined = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()
    
    class Meta:
        model = Tournament
        fields = '__all__'
    
    def get_is_joined(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.participants.filter(user=request.user).exists()
        return False
    
    def get_can_join(self, obj):
        return (obj.status == 'upcoming' and 
                obj.current_participants < obj.max_participants and
                not self.get_is_joined(obj))
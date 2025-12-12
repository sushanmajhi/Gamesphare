# accounts/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .serializers import (
    RegisterSerializer,
    ProfileSerializer,
    PostSerializer,
    FriendRequestSerializer,
    ConversationSerializer,
    MessageSerializer,
    TournamentSerializer,
    TournamentParticipantSerializer,
    TournamentMatchSerializer
)
from .models import Profile, Post, FriendRequest, Conversation, Message, Tournament, TournamentParticipant, TournamentMatch


# REGISTER
@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    password = request.data.get("password")
    confirm_password = request.data.get("confirm_password")

    if password != confirm_password:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if serializer.is_valid():
        try:
            user = serializer.save()
            Profile.objects.get_or_create(user=user)
            profile_data = ProfileSerializer(user.profile).data

            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "detail": "User created successfully.",
                    "username": user.username,
                    "email": user.email,
                    "profile": profile_data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": "Registration failed.", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    return Response(
        {"detail": "Invalid data.", "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


# PROFILE (GET + UPDATE)
@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    try:
        profile = request.user.profile

        if request.method == "GET":
            serializer = ProfileSerializer(profile)
            return Response(serializer.data)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Profile.DoesNotExist:
        return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)


# POSTS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def posts(request):
    if request.method == "GET":
        all_posts = Post.objects.all().order_by("-created_at")
        serializer = PostSerializer(all_posts, many=True)
        return Response(serializer.data)

    serializer = PostSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        if request.user in post.likes.all():
            post.likes.remove(request.user)
        else:
            post.likes.add(request.user)
        return Response({"likes_count": post.likes.count()})
    except Post.DoesNotExist:
        return Response({"detail": "Post not found"}, status=status.HTTP_404_NOT_FOUND)


# FRIEND REQUESTS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def friend_requests(request):
    if request.method == "GET":
        pending_requests = FriendRequest.objects.filter(to_user=request.user, accepted=False)
        serializer = FriendRequestSerializer(pending_requests, many=True)
        return Response(serializer.data)

    to_username = request.data.get("to_user")
    if not to_username:
        return Response({"detail": "No username provided"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        to_user = User.objects.get(username=to_username)
        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user, accepted=False).exists():
            return Response({"detail": "Request already sent"}, status=status.HTTP_400_BAD_REQUEST)
        fr = FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        serializer = FriendRequestSerializer(fr)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_friend_request(request, request_id):
    action = request.data.get("action")
    try:
        fr = FriendRequest.objects.get(id=request_id, to_user=request.user, accepted=False)
        if action == "accept":
            fr.accepted = True
            fr.save()
            return Response({"detail": "Friend request accepted"})
        elif action == "decline":
            fr.delete()
            return Response({"detail": "Friend request declined"})
        else:
            return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
    except FriendRequest.DoesNotExist:
        return Response({"detail": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)


# VIEW FRIEND PROFILE
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def friend_profile(request, username):
    try:
        user = User.objects.get(username=username)
        profile = Profile.objects.get(user=user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Profile.DoesNotExist:
        return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)


# MESSAGING VIEWS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversations(request):
    if request.method == 'GET':
        conversations = Conversation.objects.filter(participants=request.user)
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        username = request.data.get('participant')
        if not username:
            return Response({"detail": "Participant username required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participant = User.objects.get(username=username)
            
            existing_conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=participant
            ).first()
            
            if existing_conversation:
                serializer = ConversationSerializer(existing_conversation, context={'request': request})
                return Response(serializer.data)
            
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, participant)
            conversation.save()
            
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):
    try:
        conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        
        if request.method == 'GET':
            messages = conversation.messages.all()
            serializer = MessageSerializer(messages, many=True, context={'request': request})
            
            conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
            
            return Response(serializer.data)
        
        elif request.method == 'POST':
            content = request.data.get('content')
            if not content:
                return Response({"detail": "Message content required"}, status=status.HTTP_400_BAD_REQUEST)
            
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=content
            )
            
            conversation.save()
            
            serializer = MessageSerializer(message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
    except Conversation.DoesNotExist:
        return Response({"detail": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, message_id):
    try:
        message = Message.objects.get(id=message_id, conversation__participants=request.user)
        if message.sender != request.user:
            message.is_read = True
            message.save()
        return Response({"detail": "Message marked as read"})
    except Message.DoesNotExist:
        return Response({"detail": "Message not found"}, status=status.HTTP_404_NOT_FOUND)


# TOURNAMENT VIEWS

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tournaments(request):
    if request.method == 'GET':
        tournaments = Tournament.objects.all().order_by('-created_at')
        
        status_filter = request.GET.get('status')
        if status_filter:
            tournaments = tournaments.filter(status=status_filter)
            
        game_filter = request.GET.get('game')
        if game_filter:
            tournaments = tournaments.filter(game=game_filter)
            
        serializer = TournamentSerializer(tournaments, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TournamentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tournaments(request):
    # Get tournaments where user is participating
    participating_tournaments = Tournament.objects.filter(
        participants__user=request.user
    ).distinct().order_by('-created_at')
    
    serializer = TournamentSerializer(participating_tournaments, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tournament_detail(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    serializer = TournamentSerializer(tournament, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_tournament(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    
    if tournament.status != 'upcoming':
        return Response(
            {'error': 'Cannot join tournament. It is not upcoming.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if tournament.current_participants >= tournament.max_participants:
        return Response(
            {'error': 'Tournament is full.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if TournamentParticipant.objects.filter(tournament=tournament, user=request.user).exists():
        return Response(
            {'error': 'You have already joined this tournament.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create participant
    participant = TournamentParticipant.objects.create(
        tournament=tournament,
        user=request.user
    )
    
    # Update participant count
    tournament.current_participants += 1
    tournament.save()
    
    serializer = TournamentParticipantSerializer(participant)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_tournament(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    
    # Check if tournament is upcoming
    if tournament.status != 'upcoming':
        return Response(
            {'error': 'Cannot leave tournament. It has already started.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user is participating
    try:
        participant = TournamentParticipant.objects.get(
            tournament=tournament, 
            user=request.user
        )
        participant.delete()
        
        # Update participant count
        tournament.current_participants -= 1
        tournament.save()
        
        return Response({'message': 'Successfully left the tournament.'})
    except TournamentParticipant.DoesNotExist:
        return Response(
            {'error': 'You are not participating in this tournament.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tournament_matches(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    matches = tournament.matches.all().order_by('round_number', 'match_number')
    serializer = TournamentMatchSerializer(matches, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_match(request, match_id):
    match = get_object_or_404(TournamentMatch, id=match_id)
    
    # Check if user is tournament creator
    if match.tournament.created_by != request.user:
        return Response(
            {'error': 'Only tournament creator can start matches.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    match.status = 'live'
    match.save()
    
    serializer = TournamentMatchSerializer(match)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_match_result(request, match_id):
    match = get_object_or_404(TournamentMatch, id=match_id)
    
    is_creator = match.tournament.created_by == request.user
    is_participant = match.participant1.user == request.user or match.participant2.user == request.user
    
    if not (is_creator or is_participant):
        return Response(
            {'error': 'Only tournament creator or participants can submit results.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    winner_id = request.data.get('winner')
    score_p1 = request.data.get('score_p1', 0)
    score_p2 = request.data.get('score_p2', 0)
    
    try:
        winner = TournamentParticipant.objects.get(id=winner_id)
        if winner not in [match.participant1, match.participant2]:
            return Response(
                {'error': 'Winner must be one of the match participants.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        match.winner = winner
        match.score_p1 = score_p1
        match.score_p2 = score_p2
        match.status = 'completed'
        match.save()
        
        serializer = TournamentMatchSerializer(match)
        return Response(serializer.data)
    except TournamentParticipant.DoesNotExist:
        return Response(
            {'error': 'Invalid winner ID.'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tournament_match(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    
    if tournament.created_by != request.user:
        return Response(
            {'error': 'Only tournament creator can create matches.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = TournamentMatchSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(tournament=tournament)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
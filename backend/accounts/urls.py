from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import conversations, conversation_messages, mark_as_read
from .views import (
    register,
    profile_view,
    posts,
    like_post,
    friend_requests,
    respond_friend_request,
    friend_profile,
)

# Add these tournament imports
from .views import (
    tournaments,
    tournament_detail,
    join_tournament,
    leave_tournament,
    my_tournaments,
    tournament_matches,
    start_match,
    submit_match_result,
    create_tournament_match,
)

urlpatterns = [
    # Existing URLs
    path("register/", register, name="register"),
    path("profile/", profile_view, name="profile"),
    path("posts/", posts, name="posts"),
    path("posts/<int:post_id>/like/", like_post, name="like_post"),
    path("friend-requests/", friend_requests, name="friend_requests"),
    path("friend-requests/<int:request_id>/respond/", respond_friend_request, name="respond_friend_request"),
    path("profile/<str:username>/", friend_profile, name="friend-profile"),
    path("conversations/", conversations, name="conversations"),
    path("conversations/<int:conversation_id>/messages/", conversation_messages, name="conversation_messages"),
    path("messages/<int:message_id>/read/", mark_as_read, name="mark_as_read"),
    
    # Tournament URLs
    path("tournaments/", tournaments, name="tournaments"),
    path("tournaments/create/", tournaments, name="create_tournament"),  # POST for creation
    path("tournaments/my/", my_tournaments, name="my_tournaments"),
    path("tournaments/<int:tournament_id>/", tournament_detail, name="tournament_detail"),
    path("tournaments/<int:tournament_id>/join/", join_tournament, name="join_tournament"),
    path("tournaments/<int:tournament_id>/leave/", leave_tournament, name="leave_tournament"),
    path("tournaments/<int:tournament_id>/matches/", tournament_matches, name="tournament_matches"),
    path("matches/<int:match_id>/start/", start_match, name="start_match"),
    path("matches/<int:match_id>/result/", submit_match_result, name="submit_match_result"),
    path("tournaments/<int:tournament_id>/create-match/", create_tournament_match, name="create_tournament_match"),
]
from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserStateSerializer
from finance.models import Transaction

User = get_user_model()

def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    ser = RegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user = ser.save()
    return Response({'user': UserStateSerializer(user).data, 'tokens': tokens_for(user)}, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    ident = request.data.get('username') or request.data.get('email')
    password = request.data.get('password')
    user_obj = User.objects.filter(email__iexact=ident).first() or User.objects.filter(username__iexact=ident).first()
    if not user_obj:
        return Response({'detail': 'Identifiants incorrects.'}, status=400)
    user = authenticate(request, email=user_obj.email, password=password)
    if not user:
        return Response({'detail': 'Identifiants incorrects.'}, status=400)
    return Response({'user': UserStateSerializer(user).data, 'tokens': tokens_for(user), 'role': 'admin' if user.is_staff else 'user'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserStateSerializer(request.user).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate(request):
    # Sécurité V4: un utilisateur ne peut plus s'activer depuis le frontend.
    # L'activation se fait uniquement après dépôt validé par l'admin côté backend.
    if request.user.is_active_member:
        return Response(UserStateSerializer(request.user).data)
    return Response({'detail': 'Activation refusée : dépôt requis et validation administrateur obligatoire.'}, status=403)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def referrals(request):
    """Retourne uniquement le réseau de l'utilisateur connecté.
    Le frontend ne calcule plus le réseau à partir d'une liste locale falsifiable.
    """
    u = request.user
    level1 = User.objects.filter(sponsor=u, is_active_member=True).order_by('-date_joined')
    level2 = User.objects.filter(sponsor__in=level1, is_active_member=True).order_by('-date_joined')
    level3 = User.objects.filter(sponsor__in=level2, is_active_member=True).order_by('-date_joined')
    return Response({
        'level1': UserStateSerializer(level1, many=True).data,
        'level2': UserStateSerializer(level2, many=True).data,
        'level3': UserStateSerializer(level3, many=True).data,
        'flat': UserStateSerializer(list(level1) + list(level2) + list(level3), many=True).data,
        'summary': {
            'level1': level1.count(),
            'level2': level2.count(),
            'level3': level3.count(),
            'total': level1.count() + level2.count() + level3.count(),
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email','').lower()
    exists = User.objects.filter(email=email).exists()
    # En prod: envoyer email ici. Réponse neutre pour éviter l'énumération.
    return Response({'ok': True, 'message': 'Si le compte existe, un code sera envoyé.', 'exists': exists})

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_toggle_user(request, user_id):
    u = User.objects.get(id=user_id)
    u.is_active_member = not u.is_active_member
    u.save(update_fields=['is_active_member'])
    return Response(UserStateSerializer(u).data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users(request):
    users = User.objects.all().order_by('-date_joined')
    return Response(UserStateSerializer(users, many=True).data)

@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_direct(request):
    # Sécurité V4: désactivé. Ancienne version permettait de changer le mot de passe
    # avec un code généré côté frontend, donc contournable.
    return Response({'detail': 'Réinitialisation directe désactivée. Utilisez une procédure email côté serveur ou contactez l’administrateur.'}, status=403)

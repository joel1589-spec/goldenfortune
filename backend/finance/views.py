from django.db import transaction as dbtx
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import Deposit, Withdrawal, Transaction
from .serializers import DepositSerializer, WithdrawalSerializer, TransactionSerializer
from accounts.serializers import UserStateSerializer

ACTIVATION_AMOUNT = 3500

def is_activation_deposit(dep):
    return str(dep.tx_ref or '').startswith('activation-') or dep.amount == ACTIVATION_AMOUNT and not dep.user.is_active_member

def activate_member_after_payment(user):
    if user.is_active_member:
        return
    user.is_active_member = True
    user.activated_at = timezone.now()
    user.save(update_fields=['is_active_member','activated_at'])

    s1 = user.sponsor
    s2 = s1.sponsor if s1 and s1.sponsor else None
    s3 = s2.sponsor if s2 and s2.sponsor else None

    def credit(u, amount, desc, ttype='parrainage'):
        u.balance += amount
        u.total_profit += amount
        u.save(update_fields=['balance','total_profit'])
        Transaction.objects.create(user=u, type=ttype, amount=amount, method='Système', status='complété', description=desc)

    if s1:
        s1.referrals += 1
        s1.save(update_fields=['referrals'])
        credit(s1, 1500, f'💰 Commission Niv.1 — {user.username}')
        if s1.referrals == 25:
            s1.welcome_bonus = 500
            s1.save(update_fields=['welcome_bonus'])
            credit(s1, 500, '🎁 Bonus 25 filleuls atteints !', 'bonus')
    if s2:
        credit(s2, 500, f'💰 Commission Niv.2 — {user.username}')
    if s3:
        credit(s3, 200, f'💰 Commission Niv.3 — {user.username}')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transactions(request):
    return Response(TransactionSerializer(request.user.transactions.all(), many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_deposit(request):
    """
    V5: le dépôt est enregistré et validé automatiquement côté backend.
    Pour un dépôt d'activation, le compte est activé immédiatement après création
    du dépôt. Le frontend ne décide jamais lui-même de l'activation.
    """
    try:
        amount = int(request.data.get('amount', 0))
    except (TypeError, ValueError):
        return Response({'detail':'Montant invalide.'}, status=400)

    method = str(request.data.get('method', '')).strip()
    tx_ref = str(request.data.get('txRef') or request.data.get('tx_ref') or '').strip()

    if amount <= 0 or not method:
        return Response({'detail':'Montant ou méthode invalide.'}, status=400)

    with dbtx.atomic():
        description = 'Dépôt d’activation du compte' if str(tx_ref).startswith('activation-') or not request.user.is_active_member else f'Dépôt via {method}'
        tx = Transaction.objects.create(
            user=request.user,
            type='depot',
            amount=amount,
            method=method,
            status='validé',
            description=description,
            tx_ref=tx_ref,
        )
        dep = Deposit.objects.create(
            user=request.user,
            amount=amount,
            method=method,
            tx_ref=tx_ref,
            status='validé',
            transaction=tx,
        )

        if is_activation_deposit(dep) or not request.user.is_active_member:
            activate_member_after_payment(request.user)
        else:
            u = request.user
            u.balance += dep.amount
            u.total_profit += dep.amount
            u.save(update_fields=['balance','total_profit'])

    request.user.refresh_from_db()
    return Response({
        'deposit': DepositSerializer(dep).data,
        'transaction': TransactionSerializer(tx).data,
        'user': UserStateSerializer(request.user).data,
        'message': 'Dépôt validé automatiquement. Compte activé.' if request.user.is_active_member else 'Dépôt enregistré.',
    }, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_withdrawal(request):
    if not request.user.is_active_member:
        return Response({'detail':'Compte non activé. Retrait impossible.'}, status=403)
    amount = int(request.data.get('amount', 0))
    method = request.data.get('method', '')
    if amount <= 0 or not method:
        return Response({'detail':'Montant ou méthode invalide.'}, status=400)
    if request.user.balance < amount:
        return Response({'detail':'Solde insuffisant.'}, status=400)
    tx = Transaction.objects.create(user=request.user, type='retrait', amount=amount, method=method, status='en attente', description=f'Retrait vers {method}')
    w = Withdrawal.objects.create(user=request.user, amount=amount, method=method, transaction=tx)
    return Response({'withdrawal': WithdrawalSerializer(w).data, 'transaction': TransactionSerializer(tx).data}, status=201)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_deposits(request):
    return Response(DepositSerializer(Deposit.objects.all(), many=True).data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_deposit_status(request, deposit_id):
    new_status = request.data.get('status')
    if new_status not in ['validé','rejeté','en attente']:
        return Response({'detail':'Statut invalide.'}, status=400)
    with dbtx.atomic():
        dep = Deposit.objects.select_for_update().get(id=deposit_id)
        old = dep.status
        dep.status = new_status
        dep.save(update_fields=['status'])
        if dep.transaction:
            dep.transaction.status = new_status
            dep.transaction.save(update_fields=['status'])

        if old != 'validé' and new_status == 'validé':
            if is_activation_deposit(dep):
                activate_member_after_payment(dep.user)
            else:
                u = dep.user
                u.balance += dep.amount
                u.total_profit += dep.amount
                u.save(update_fields=['balance','total_profit'])
    return Response(DepositSerializer(dep).data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_withdrawals(request):
    return Response(WithdrawalSerializer(Withdrawal.objects.all(), many=True).data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_withdrawal_status(request, withdrawal_id):
    new_status = request.data.get('status')
    if new_status not in ['payé','rejeté','en attente']:
        return Response({'detail':'Statut invalide.'}, status=400)
    with dbtx.atomic():
        w = Withdrawal.objects.select_for_update().get(id=withdrawal_id)
        old = w.status
        w.status = new_status
        w.save(update_fields=['status'])
        if w.transaction:
            w.transaction.status = new_status
            w.transaction.save(update_fields=['status'])
        if old != 'payé' and new_status == 'payé':
            u = w.user
            if u.balance < w.amount:
                return Response({'detail':'Solde insuffisant au moment de la validation.'}, status=400)
            u.balance -= w.amount
            u.total_withdrawn += w.amount
            u.save(update_fields=['balance','total_withdrawn'])
    return Response(WithdrawalSerializer(w).data)

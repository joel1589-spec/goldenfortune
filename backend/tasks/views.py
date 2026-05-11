import random
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import DailyTask
from .serializers import DailyTaskSerializer
from finance.models import Transaction
from accounts.serializers import UserStateSerializer

TASK_START_HOUR = 8
TASK_END_HOUR = 11
TASK_REAL_REWARDS = (80, 100)
TASK_INTERVAL_DAYS = 2

def task_window_status():
    now = timezone.localtime()
    start = now.replace(hour=TASK_START_HOUR, minute=0, second=0, microsecond=0)
    end = now.replace(hour=TASK_END_HOUR, minute=0, second=0, microsecond=0)
    available = start <= now < end
    if available:
        seconds = int((end - now).total_seconds())
        message = f"Les tâches sont disponibles maintenant. Temps restant : {format_seconds(seconds)}."
    elif now < start:
        seconds = int((start - now).total_seconds())
        message = f"Les tâches ne sont disponibles qu’entre 8h et 11h. Disponible dans {format_seconds(seconds)}."
    else:
        tomorrow_start = start + timezone.timedelta(days=1)
        seconds = int((tomorrow_start - now).total_seconds())
        message = f"Temps écoulé. Les tâches ne sont disponibles qu’entre 8h et 11h. Disponible dans {format_seconds(seconds)}."
    return {
        'available': available,
        'now': now.isoformat(),
        'startHour': TASK_START_HOUR,
        'endHour': TASK_END_HOUR,
        'remainingSeconds': max(seconds, 0),
        'remainingText': format_seconds(max(seconds, 0)),
        'message': message,
    }

def format_seconds(seconds):
    seconds = max(int(seconds), 0)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    if h and m:
        return f"{h}h {m}min"
    if h:
        return f"{h}h"
    return f"{m}min"

def next_task_eligible_datetime(user):
    """Une tâche est disponible tous les 2 jours, uniquement entre 8h et 11h."""
    now = timezone.localtime()
    if not user.task_last_date:
        return now.replace(hour=TASK_START_HOUR, minute=0, second=0, microsecond=0)
    next_date = user.task_last_date + timezone.timedelta(days=TASK_INTERVAL_DAYS)
    return timezone.make_aware(
        timezone.datetime.combine(next_date, timezone.datetime.min.time()),
        timezone.get_current_timezone()
    ).replace(hour=TASK_START_HOUR, minute=0, second=0, microsecond=0)

def task_interval_status(user):
    now = timezone.localtime()
    next_at = next_task_eligible_datetime(user)
    if user.task_last_date and now < next_at:
        seconds = int((next_at - now).total_seconds())
        return {
            'eligible': False,
            'nextAvailableAt': next_at.isoformat(),
            'remainingSeconds': max(seconds, 0),
            'remainingText': format_seconds(max(seconds, 0)),
            'message': f"Tâche déjà effectuée. Disponible dans {format_seconds(seconds)}.",
        }
    return {
        'eligible': True,
        'nextAvailableAt': next_at.isoformat(),
        'remainingSeconds': 0,
        'remainingText': '0min',
        'message': 'Tâche disponible.'
    }

def in_task_window():
    return task_window_status()['available']

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_tasks(request):
    status = task_window_status()
    u = request.user
    interval = task_interval_status(u)
    return Response({
        'tasks': DailyTaskSerializer(DailyTask.objects.filter(active=True), many=True).data,
        'window': status,
        'interval': interval,
        'doneToday': not interval['eligible'],
        'canComplete': bool(status['available'] and interval['eligible'] and u.is_active_member),
        'rewards': list(TASK_REAL_REWARDS),
        'taskIntervalDays': TASK_INTERVAL_DAYS,
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request):
    if not request.user.is_active_member:
        return Response({'detail':'Compte non activé. Tâche impossible.'}, status=403)
    status = task_window_status()
    if not status['available']:
        return Response({'detail': status['message'], 'window': status}, status=400)

    task_id = request.data.get('taskId') or request.data.get('task_id')
    task = DailyTask.objects.filter(id=task_id, active=True).first() or DailyTask.objects.filter(active=True).first()
    if not task:
        return Response({'detail':'Aucune tâche active.'}, status=404)

    today = timezone.localdate()
    u = request.user
    interval = task_interval_status(u)
    if not interval['eligible']:
        return Response({'detail': interval['message'], 'interval': interval}, status=400)

    # Le montant affiché sur le frontend n'est jamais fiable.
    # Le backend décide toujours : 80 XOF ou 100 XOF uniquement.
    reward = random.choice(TASK_REAL_REWARDS)

    u.task_done_today = True
    u.task_last_date = today
    u.balance += reward
    u.total_profit += reward
    u.save(update_fields=['task_done_today','task_last_date','balance','total_profit'])
    Transaction.objects.create(user=u, type='tache', amount=reward, status='validé', description='Tâche quotidienne complétée')
    return Response(UserStateSerializer(u).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def spin_wheel(request):
    kind = request.data.get('kind','signup')
    u = request.user
    if kind != 'signup' and not u.is_active_member:
        return Response({'detail':'Compte non activé. Roue des tâches impossible.'}, status=403)

    if kind == 'signup':
        if u.wheel_used:
            return Response({'detail':'Roue déjà utilisée.'}, status=400)
        amount = 100
        u.wheel_used = True
        u.wheel_last_used = timezone.now()
        fields = ['wheel_used','wheel_last_used','balance','total_profit']
        desc = 'Gain roue de fortune (bonus unique inscription)'
    else:
        status = task_window_status()
        if not status['available']:
            return Response({'detail': status['message'], 'window': status}, status=400)
        now = timezone.localtime()
        if u.task_wheel_last_used:
            last = timezone.localtime(u.task_wheel_last_used)
            unlock = last.replace(hour=TASK_START_HOUR, minute=0, second=0, microsecond=0) + timezone.timedelta(days=TASK_INTERVAL_DAYS)
            if now < unlock:
                seconds = int((unlock - now).total_seconds())
                return Response({'detail': f"Roue des tâches bloquée pendant {TASK_INTERVAL_DAYS} jours. Disponible dans {format_seconds(seconds)}.", 'remainingSeconds': seconds, 'remainingText': format_seconds(seconds)}, status=400)
        amount = random.choice(TASK_REAL_REWARDS)
        u.task_wheel_last_used = timezone.now()
        fields = ['task_wheel_last_used','balance','total_profit']
        desc = 'Gain roue des tâches'

    u.balance += amount
    u.total_profit += amount
    u.save(update_fields=fields)
    Transaction.objects.create(user=u, type='roue', amount=amount, status='validé', description=desc)
    return Response(UserStateSerializer(u).data)

@api_view(['GET','POST'])
@permission_classes([IsAdminUser])
def admin_tasks(request):
    if request.method == 'GET':
        return Response(DailyTaskSerializer(DailyTask.objects.all(), many=True).data)
    ser = DailyTaskSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    task = ser.save()
    return Response(DailyTaskSerializer(task).data, status=201)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_task_delete(request, task_id):
    DailyTask.objects.filter(id=task_id).delete()
    return Response({'ok': True})

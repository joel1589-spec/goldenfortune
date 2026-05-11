from django.utils import timezone
from rest_framework import serializers
from .models import User
from finance.models import Transaction

class TransactionLiteSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    date = serializers.DateTimeField(source='created_at', read_only=True)
    txRef = serializers.CharField(source='tx_ref', read_only=True)
    class Meta:
        model = Transaction
        fields = ['id','type','amount','method','date','status','description','txRef']
    def get_id(self, obj): return f'tx-{obj.id}'

class UserStateSerializer(serializers.ModelSerializer):
    isActive = serializers.BooleanField(source='is_active_member')
    activatedAt = serializers.DateTimeField(source='activated_at', allow_null=True)
    totalProfit = serializers.IntegerField(source='total_profit')
    totalWithdrawn = serializers.IntegerField(source='total_withdrawn')
    welcomeBonus = serializers.IntegerField(source='welcome_bonus')
    taskDoneToday = serializers.SerializerMethodField()
    taskLastDate = serializers.DateField(source='task_last_date', allow_null=True)
    wheelUsed = serializers.BooleanField(source='wheel_used')
    wheelLastUsed = serializers.DateTimeField(source='wheel_last_used', allow_null=True)
    taskWheelLastUsed = serializers.DateTimeField(source='task_wheel_last_used', allow_null=True)
    sponsor = serializers.SerializerMethodField()
    transactions = TransactionLiteSerializer(many=True, read_only=True)
    password = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['username','email','phone','country','sponsor','password','isActive','activatedAt','balance','totalProfit','totalWithdrawn','welcomeBonus','referrals','taskDoneToday','taskLastDate','wheelUsed','wheelLastUsed','taskWheelLastUsed','transactions']
    def get_sponsor(self, obj): return obj.sponsor.username if obj.sponsor else obj.sponsor_code
    def get_taskDoneToday(self, obj):
        if not obj.task_last_date:
            return False
        return timezone.localdate() < (obj.task_last_date + timezone.timedelta(days=2))
    def get_password(self, obj): return ''

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=40)
    country = serializers.CharField(max_length=80, default='Togo')
    sponsor = serializers.CharField(max_length=150, required=False, allow_blank=True)
    referral_code = serializers.CharField(max_length=150, required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'Cet email est déjà utilisé.'})
        if User.objects.filter(username__iexact=attrs['username']).exists():
            raise serializers.ValidationError({'username': 'Ce nom utilisateur est déjà utilisé.'})
        if attrs.get('password_confirm') and attrs.get('password_confirm') != attrs.get('password'):
            raise serializers.ValidationError({'password_confirm': 'Les mots de passe ne correspondent pas.'})
        return attrs

    def create(self, data):
        sponsor_code = (data.get('sponsor') or data.get('referral_code') or '').strip()
        # Le code de parrainage officiel est le username du parrain.
        # On accepte aussi les liens contenant ?ref=username côté frontend.
        sponsor = User.objects.filter(username__iexact=sponsor_code).first() if sponsor_code else None
        if sponsor_code and not sponsor:
            raise serializers.ValidationError({'sponsor': 'Code parrain invalide.'})
        user = User.objects.create_user(username=data['username'], email=data['email'].lower(), password=data['password'], phone=data['phone'], country=data.get('country','Togo'), sponsor=sponsor, sponsor_code=sponsor_code)
        return user

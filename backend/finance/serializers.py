from rest_framework import serializers
from .models import Deposit, Withdrawal, Transaction

class DepositSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    userId = serializers.EmailField(source='user.email', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)
    txRef = serializers.CharField(source='tx_ref', required=False, allow_blank=True)
    class Meta:
        model = Deposit
        fields = ['id','userId','username','amount','method','date','status','txRef']

class WithdrawalSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    userId = serializers.EmailField(source='user.email', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)
    class Meta:
        model = Withdrawal
        fields = ['id','userId','username','amount','method','date','status']

class TransactionSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='created_at', read_only=True)
    txRef = serializers.CharField(source='tx_ref', read_only=True)
    class Meta:
        model = Transaction
        fields = ['id','type','amount','method','date','status','description','txRef']

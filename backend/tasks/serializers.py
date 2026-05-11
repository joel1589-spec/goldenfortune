from rest_framework import serializers
from .models import DailyTask

class DailyTaskSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    class Meta:
        model = DailyTask
        fields = ['id','title','description','reward','active','createdAt']

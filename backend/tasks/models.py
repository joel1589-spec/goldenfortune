from django.db import models

class DailyTask(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    reward = models.PositiveIntegerField(default=100)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

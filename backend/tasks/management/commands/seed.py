from django.core.management.base import BaseCommand
from tasks.models import DailyTask

class Command(BaseCommand):
    help = 'Crée les données de départ Golden Fortune'
    def handle(self, *args, **kwargs):
        DailyTask.objects.get_or_create(
            title='Tâche du jour',
            defaults={'description':'Activité quotidienne rémunérée automatiquement.', 'reward':100, 'active':True}
        )
        self.stdout.write(self.style.SUCCESS('Données de départ créées.'))

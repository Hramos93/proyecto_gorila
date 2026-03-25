from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_search_name'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='medical_conditions',
            new_name='injury_details',
        ),
        migrations.AddField(
            model_name='user',
            name='has_injuries',
            field=models.BooleanField(default=False),
        ),
    ]

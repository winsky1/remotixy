from django.db import migrations


PLANS = [
    {"name": "Free", "monthly_price_cents": 0, "device_limit": 4, "operator_limit": 1, "reporting_enabled": False, "ai_assistant_enabled": True},
    {"name": "Starter", "monthly_price_cents": 1900, "device_limit": 25, "operator_limit": 3, "reporting_enabled": True, "ai_assistant_enabled": True},
    {"name": "Business", "monthly_price_cents": 4900, "device_limit": 100, "operator_limit": 10, "reporting_enabled": True, "ai_assistant_enabled": True},
    {"name": "Enterprise", "monthly_price_cents": 0, "device_limit": 1000, "operator_limit": 50, "reporting_enabled": True, "ai_assistant_enabled": True},
]


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("core", "Plan")
    for plan in PLANS:
        Plan.objects.update_or_create(name=plan["name"], defaults=plan)


def remove_plans(apps, schema_editor):
    Plan = apps.get_model("core", "Plan")
    Plan.objects.filter(name__in=[plan["name"] for plan in PLANS]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [migrations.RunPython(seed_plans, remove_plans)]

# Generated for Remotixy backend

import django.db.models.deletion
import secrets
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80, unique=True)),
                ("monthly_price_cents", models.PositiveIntegerField(default=0)),
                ("device_limit", models.PositiveIntegerField(default=4)),
                ("operator_limit", models.PositiveIntegerField(default=1)),
                ("reporting_enabled", models.BooleanField(default=False)),
                ("ai_assistant_enabled", models.BooleanField(default=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Organization",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("billing_email", models.EmailField(max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="organizations", to="core.plan")),
            ],
        ),
        migrations.CreateModel(
            name="Device",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("hostname", models.CharField(blank=True, max_length=160)),
                ("operating_system", models.CharField(blank=True, max_length=120)),
                ("agent_version", models.CharField(blank=True, max_length=40)),
                ("group", models.CharField(default="Unassigned", max_length=120)),
                ("status", models.CharField(choices=[("online", "Online"), ("offline", "Offline"), ("pending", "Pending")], default="pending", max_length=20)),
                ("health", models.CharField(default="Healthy", max_length=80)),
                ("last_seen_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="devices", to="core.organization")),
            ],
        ),
        migrations.CreateModel(
            name="GoogleAISettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enabled", models.BooleanField(default=True)),
                ("model_name", models.CharField(default="gemini-1.5-flash", max_length=120)),
                ("system_prompt", models.TextField(default="Provide safe, concise remote support troubleshooting guidance for technicians.")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("organization", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="google_ai_settings", to="core.organization")),
            ],
        ),
        migrations.CreateModel(
            name="TechnicianProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(default="technician", max_length=40)),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="technicians", to="core.organization")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="technician_profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="InstallToken",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("token", models.CharField(default=secrets.token_urlsafe, max_length=96, unique=True)),
                ("label", models.CharField(blank=True, max_length=120)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("max_uses", models.PositiveIntegerField(default=1)),
                ("uses", models.PositiveIntegerField(default=0)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="install_tokens", to=settings.AUTH_USER_MODEL)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="install_tokens", to="core.organization")),
            ],
        ),
        migrations.AddField(
            model_name="device",
            name="install_token",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="devices", to="core.installtoken"),
        ),
        migrations.CreateModel(
            name="AuditLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=120)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to=settings.AUTH_USER_MODEL)),
                ("device", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to="core.device")),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="audit_logs", to="core.organization")),
            ],
        ),
        migrations.CreateModel(
            name="UsageReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("active_devices", models.PositiveIntegerField(default=0)),
                ("remote_sessions", models.PositiveIntegerField(default=0)),
                ("alert_count", models.PositiveIntegerField(default=0)),
                ("generated_at", models.DateTimeField(auto_now_add=True)),
                ("organization", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="usage_reports", to="core.organization")),
            ],
        ),
    ]

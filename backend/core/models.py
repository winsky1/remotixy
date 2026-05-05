import secrets
import uuid

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Plan(models.Model):
    name = models.CharField(max_length=80, unique=True)
    monthly_price_cents = models.PositiveIntegerField(default=0)
    device_limit = models.PositiveIntegerField(default=4)
    operator_limit = models.PositiveIntegerField(default=1)
    reporting_enabled = models.BooleanField(default=False)
    ai_assistant_enabled = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Organization(models.Model):
    name = models.CharField(max_length=160)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="organizations")
    billing_email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TechnicianProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="technician_profile")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="technicians")
    role = models.CharField(max_length=40, default="technician")
    phone = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.organization.name}"


class InstallToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="install_tokens")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="install_tokens")
    token = models.CharField(max_length=96, unique=True, default=secrets.token_urlsafe)
    label = models.CharField(max_length=120, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    max_uses = models.PositiveIntegerField(default=1)
    uses = models.PositiveIntegerField(default=0)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_valid(self):
        if self.revoked_at:
            return False
        if self.expires_at and timezone.now() >= self.expires_at:
            return False
        return self.uses < self.max_uses

    def __str__(self):
        return self.label or str(self.id)


class Device(models.Model):
    class Status(models.TextChoices):
        ONLINE = "online", "Online"
        OFFLINE = "offline", "Offline"
        PENDING = "pending", "Pending"

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="devices")
    install_token = models.ForeignKey(InstallToken, on_delete=models.SET_NULL, null=True, blank=True, related_name="devices")
    name = models.CharField(max_length=160)
    hostname = models.CharField(max_length=160, blank=True)
    operating_system = models.CharField(max_length=120, blank=True)
    agent_version = models.CharField(max_length=40, blank=True)
    group = models.CharField(max_length=120, default="Unassigned")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    health = models.CharField(max_length=80, default="Healthy")
    last_seen_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class AuditLog(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="audit_logs")
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=120)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.action


class UsageReport(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="usage_reports")
    period_start = models.DateField()
    period_end = models.DateField()
    active_devices = models.PositiveIntegerField(default=0)
    remote_sessions = models.PositiveIntegerField(default=0)
    alert_count = models.PositiveIntegerField(default=0)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.organization.name} {self.period_start} - {self.period_end}"


class GoogleAISettings(models.Model):
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name="google_ai_settings")
    enabled = models.BooleanField(default=True)
    model_name = models.CharField(max_length=120, default="gemini-1.5-flash")
    system_prompt = models.TextField(default="Provide safe, concise remote support troubleshooting guidance for technicians.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Google AI settings for {self.organization.name}"

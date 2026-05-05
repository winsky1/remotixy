from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers

from .models import AuditLog, Device, GoogleAISettings, InstallToken, Organization, Plan, TechnicianProfile, UsageReport


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ["id", "name", "monthly_price_cents", "device_limit", "operator_limit", "reporting_enabled", "ai_assistant_enabled"]


class OrganizationSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = Organization
        fields = ["id", "name", "billing_email", "plan", "created_at"]


class TechnicianRegisterSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=160)
    technician_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    plan_name = serializers.CharField(max_length=80, default="Free")

    def validate_email(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A technician account already exists for this email.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        plan, _ = Plan.objects.get_or_create(
            name=validated_data.get("plan_name", "Free"),
            defaults={"monthly_price_cents": 0, "device_limit": 4, "operator_limit": 1, "reporting_enabled": False},
        )
        organization = Organization.objects.create(
            name=validated_data["company_name"],
            billing_email=validated_data["email"],
            plan=plan,
        )
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["technician_name"],
        )
        TechnicianProfile.objects.create(user=user, organization=organization)
        GoogleAISettings.objects.create(organization=organization)
        AuditLog.objects.create(organization=organization, actor=user, action="technician_registered")
        return user


class TechnicianProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.first_name", read_only=True)
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = TechnicianProfile
        fields = ["id", "email", "name", "role", "phone", "organization", "created_at"]


class InstallTokenSerializer(serializers.ModelSerializer):
    install_url = serializers.SerializerMethodField()

    class Meta:
        model = InstallToken
        fields = ["id", "label", "token", "install_url", "expires_at", "max_uses", "uses", "is_valid", "created_at"]
        read_only_fields = ["token", "uses", "is_valid", "created_at"]

    def get_install_url(self, obj):
        request = self.context.get("request")
        frontend_url = self.context.get("frontend_url", "")
        base = frontend_url or (request.build_absolute_uri("/").rstrip("/") if request else "")
        return f"{base}/?install=support-client&token={obj.token}"


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ["id", "name", "hostname", "operating_system", "agent_version", "group", "status", "health", "last_seen_at", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]


class HostDeviceRegisterSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=140)
    name = serializers.CharField(max_length=160)
    hostname = serializers.CharField(max_length=160, required=False, allow_blank=True)
    operating_system = serializers.CharField(max_length=120, required=False, allow_blank=True)
    agent_version = serializers.CharField(max_length=40, required=False, allow_blank=True)

    def validate_token(self, value):
        try:
            install_token = InstallToken.objects.select_related("organization").get(token=value)
        except InstallToken.DoesNotExist as exc:
            raise serializers.ValidationError("Invalid install token.") from exc
        if not install_token.is_valid:
            raise serializers.ValidationError("Install token is expired, used, or revoked.")
        self.context["install_token"] = install_token
        return value

    @transaction.atomic
    def create(self, validated_data):
        install_token = self.context["install_token"]
        organization = install_token.organization
        if organization.devices.count() >= organization.plan.device_limit:
            raise serializers.ValidationError("Device limit reached for this plan.")
        device = Device.objects.create(
            organization=organization,
            install_token=install_token,
            name=validated_data["name"],
            hostname=validated_data.get("hostname", ""),
            operating_system=validated_data.get("operating_system", ""),
            agent_version=validated_data.get("agent_version", ""),
            status=Device.Status.ONLINE,
        )
        install_token.uses += 1
        install_token.save(update_fields=["uses"])
        AuditLog.objects.create(organization=organization, device=device, action="host_device_registered", metadata={"token_id": str(install_token.id)})
        return device


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)
    device_name = serializers.CharField(source="device.name", read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor_email", "device_name", "action", "metadata", "created_at"]


class UsageReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageReport
        fields = ["id", "period_start", "period_end", "active_devices", "remote_sessions", "alert_count", "generated_at"]


class GoogleAISettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleAISettings
        fields = ["enabled", "model_name", "system_prompt", "updated_at"]

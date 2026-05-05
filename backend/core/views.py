import os

from django.utils import timezone
from rest_framework import mixins, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog, Device, GoogleAISettings, InstallToken, Plan, UsageReport
from .serializers import (
    AuditLogSerializer,
    DeviceSerializer,
    GoogleAISettingsSerializer,
    HostDeviceRegisterSerializer,
    InstallTokenSerializer,
    PlanSerializer,
    TechnicianProfileSerializer,
    TechnicianRegisterSerializer,
    UsageReportSerializer,
)


def technician_profile(user):
    return getattr(user, "technician_profile", None)


class IsTechnician(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and technician_profile(request.user))


class RegisterTechnicianView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TechnicianRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(TechnicianProfileSerializer(user.technician_profile).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsTechnician]

    def get(self, request):
        return Response(TechnicianProfileSerializer(request.user.technician_profile).data)


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Plan.objects.filter(is_active=True).order_by("monthly_price_cents")
    serializer_class = PlanSerializer


class OrganizationScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTechnician]

    def organization(self):
        return self.request.user.technician_profile.organization

    def perform_create(self, serializer):
        serializer.save(organization=self.organization())


class InstallTokenViewSet(OrganizationScopedViewSet):
    serializer_class = InstallTokenSerializer

    def get_queryset(self):
        return InstallToken.objects.filter(organization=self.organization()).order_by("-created_at")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["frontend_url"] = os.getenv("FRONTEND_URL", "")
        return context

    def perform_create(self, serializer):
        token = serializer.save(organization=self.organization(), created_by=self.request.user)
        AuditLog.objects.create(organization=self.organization(), actor=self.request.user, action="install_token_created", metadata={"token_id": str(token.id)})

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        token = self.get_object()
        token.revoked_at = timezone.now()
        token.save(update_fields=["revoked_at"])
        AuditLog.objects.create(organization=self.organization(), actor=request.user, action="install_token_revoked", metadata={"token_id": str(token.id)})
        return Response(self.get_serializer(token).data)


class DeviceViewSet(OrganizationScopedViewSet):
    serializer_class = DeviceSerializer

    def get_queryset(self):
        return Device.objects.filter(organization=self.organization()).order_by("name")

    def perform_create(self, serializer):
        organization = self.organization()
        if organization.devices.count() >= organization.plan.device_limit:
            raise serializers.ValidationError({"detail": "Device limit reached for this plan."})
        device = serializer.save(organization=organization)
        AuditLog.objects.create(organization=organization, actor=self.request.user, device=device, action="device_created")

    @action(detail=True, methods=["post"])
    def heartbeat(self, request, pk=None):
        device = self.get_object()
        device.status = Device.Status.ONLINE
        device.last_seen_at = timezone.now()
        device.save(update_fields=["status", "last_seen_at", "updated_at"])
        AuditLog.objects.create(organization=self.organization(), actor=request.user, device=device, action="device_heartbeat")
        return Response(self.get_serializer(device).data)


class HostDeviceRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = HostDeviceRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = serializer.save()
        return Response(DeviceSerializer(device).data, status=status.HTTP_201_CREATED)


class AuditLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsTechnician]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(organization=self.request.user.technician_profile.organization).order_by("-created_at")


class UsageReportViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsTechnician]
    serializer_class = UsageReportSerializer

    def get_queryset(self):
        return UsageReport.objects.filter(organization=self.request.user.technician_profile.organization).order_by("-period_end")


class GoogleAISettingsView(APIView):
    permission_classes = [IsTechnician]

    def get_object(self):
        organization = self.request.user.technician_profile.organization
        settings, _ = GoogleAISettings.objects.get_or_create(organization=organization)
        return settings

    def get(self, request):
        return Response(GoogleAISettingsSerializer(self.get_object()).data)

    def patch(self, request):
        settings = self.get_object()
        serializer = GoogleAISettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        AuditLog.objects.create(organization=request.user.technician_profile.organization, actor=request.user, action="google_ai_settings_updated")
        return Response(serializer.data)

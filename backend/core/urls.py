from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuditLogViewSet,
    DeviceViewSet,
    GoogleAISettingsView,
    HostDeviceRegisterView,
    InstallTokenViewSet,
    MeView,
    PlanViewSet,
    RegisterTechnicianView,
    UsageReportViewSet,
)

router = DefaultRouter()
router.register("plans", PlanViewSet, basename="plans")
router.register("install-tokens", InstallTokenViewSet, basename="install-tokens")
router.register("devices", DeviceViewSet, basename="devices")
router.register("audit-logs", AuditLogViewSet, basename="audit-logs")
router.register("usage-reports", UsageReportViewSet, basename="usage-reports")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", RegisterTechnicianView.as_view(), name="register-technician"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("host/devices/register/", HostDeviceRegisterView.as_view(), name="host-device-register"),
    path("google-ai/settings/", GoogleAISettingsView.as_view(), name="google-ai-settings"),
]

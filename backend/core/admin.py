from django.contrib import admin

from .models import AuditLog, Device, GoogleAISettings, InstallToken, Organization, Plan, TechnicianProfile, UsageReport


admin.site.register(Plan)
admin.site.register(Organization)
admin.site.register(TechnicianProfile)
admin.site.register(InstallToken)
admin.site.register(Device)
admin.site.register(AuditLog)
admin.site.register(UsageReport)
admin.site.register(GoogleAISettings)

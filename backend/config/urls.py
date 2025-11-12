from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from core.views import MeView
from workspaces.views import WorkspaceViewSet, RoleAssignmentViewSet
from datastores.views import (
    DatabaseViewSet,
    TableViewSet,
    FieldViewSet,
    RecordViewSet,
    ViewViewSet,
)

router = routers.DefaultRouter()
router.register(r"workspaces", WorkspaceViewSet, basename="workspace")
router.register(r"role-assignments", RoleAssignmentViewSet, basename="roleassignment")
router.register(r"databases", DatabaseViewSet, basename="database")
router.register(r"tables", TableViewSet, basename="table")
router.register(r"fields", FieldViewSet, basename="field")
router.register(r"views", ViewViewSet, basename="view")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/auth/jwt/create", TokenObtainPairView.as_view(), name="jwt-create"),
    path("api/auth/jwt/refresh", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("api/auth/jwt/verify", TokenVerifyView.as_view(), name="jwt-verify"),
    path("api/auth/me", MeView.as_view(), name="auth-me"),
    path("api/", include(router.urls)),
    path(
        "api/tables/<int:table_id>/records",
        RecordViewSet.as_view({
            "get": "list",
            "post": "create",
        }),
        name="record-list",
    ),
    path(
        "api/tables/<int:table_id>/records/<int:pk>",
        RecordViewSet.as_view({
            "get": "retrieve",
            "put": "update",
            "patch": "partial_update",
            "delete": "destroy",
        }),
        name="record-detail",
    ),
]

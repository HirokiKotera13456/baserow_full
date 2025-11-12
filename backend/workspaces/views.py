from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import WorkspaceRolePermission
from .models import Workspace, RoleAssignment, RoleChoices
from .serializers import WorkspaceSerializer, RoleAssignmentSerializer


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [WorkspaceRolePermission]

    def get_queryset(self):
        return Workspace.objects.filter(role_assignments__user=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save()

    def get_object(self):
        obj = super().get_object()
        self.workspace = obj
        return obj

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"], url_path="members")
    def add_member(self, request, pk=None):
        workspace = self.get_object()
        self.workspace = workspace
        serializer = RoleAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            assignment, _ = RoleAssignment.objects.update_or_create(
                workspace=workspace,
                user=serializer.validated_data["user"],
                defaults={"role": serializer.validated_data["role"]},
            )
            return Response(RoleAssignmentSerializer(assignment, context=self.get_serializer_context()).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["delete"], url_path="members/(?P<user_id>[^/.]+)")
    def remove_member(self, request, pk=None, user_id=None):
        workspace = self.get_object()
        self.workspace = workspace
        RoleAssignment.objects.filter(workspace=workspace, user_id=user_id).exclude(role=RoleChoices.ADMIN).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoleAssignmentViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = RoleAssignmentSerializer

    def get_queryset(self):
        workspace_id = self.request.query_params.get("workspace")
        qs = RoleAssignment.objects.filter(workspace__role_assignments__user=self.request.user)
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs.select_related("workspace", "user")

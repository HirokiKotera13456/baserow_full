from typing import Optional

from rest_framework.permissions import BasePermission

from workspaces.models import RoleAssignment, RoleChoices, Workspace
from datastores.models import Database, Table, Field, Record, View


def get_workspace_from_obj(obj) -> Optional[Workspace]:
    if isinstance(obj, Workspace):
        return obj
    if isinstance(obj, RoleAssignment):
        return obj.workspace
    if isinstance(obj, Database):
        return obj.workspace
    if isinstance(obj, Table):
        return obj.database.workspace
    if isinstance(obj, Field):
        return obj.table.database.workspace
    if isinstance(obj, Record):
        return obj.table.database.workspace
    if isinstance(obj, View):
        return obj.table.database.workspace
    return None


class WorkspaceRolePermission(BasePermission):
    """Simple RBAC permission based on workspace role."""

    write_methods = {"POST", "PUT", "PATCH", "DELETE"}

    def has_permission(self, request, view):
        workspace = getattr(view, "workspace", None)
        if workspace is None:
            return True
        role = (
            RoleAssignment.objects.filter(workspace=workspace, user=request.user)
            .values_list("role", flat=True)
            .first()
        )
        if request.method in self.write_methods:
            return role in {RoleChoices.ADMIN, RoleChoices.MEMBER}
        return role is not None

    def has_object_permission(self, request, view, obj):
        workspace = get_workspace_from_obj(obj)
        if workspace is None:
            return False
        role = (
            RoleAssignment.objects.filter(workspace=workspace, user=request.user)
            .values_list("role", flat=True)
            .first()
        )
        if request.method in self.write_methods:
            return role in {RoleChoices.ADMIN, RoleChoices.MEMBER}
        return role is not None
        # Extension point: swap to row-level permissions or integrate with an audit trail.

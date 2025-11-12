from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Workspace, RoleAssignment, RoleChoices

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class RoleAssignmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )

    class Meta:
        model = RoleAssignment
        fields = ["id", "workspace", "user", "user_id", "role", "created_at"]
        read_only_fields = ["id", "workspace", "user", "created_at"]


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = RoleAssignmentSerializer(source="role_assignments", many=True, read_only=True)

    class Meta:
        model = Workspace
        fields = ["id", "name", "owner", "members", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "members", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        owner = request.user if request else None
        if owner is None:
            raise serializers.ValidationError("Owner is required")
        workspace = Workspace.objects.create(owner=owner, **validated_data)
        RoleAssignment.objects.create(workspace=workspace, user=owner, role=RoleChoices.ADMIN)
        return workspace

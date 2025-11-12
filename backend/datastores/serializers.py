from __future__ import annotations

from __future__ import annotations

from typing import Any, Dict

from django.db.models import Q
from rest_framework import serializers

from .models import Database, Table, Field, Record, View, FieldType


class DatabaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Database
        fields = ["id", "workspace", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class TableSerializer(serializers.ModelSerializer):
    workspace_id = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ["id", "database", "name", "deleted_at", "created_at", "updated_at", "workspace_id"]
        read_only_fields = ["id", "deleted_at", "created_at", "updated_at", "workspace_id"]

    def get_workspace_id(self, obj: Table) -> int:
        return obj.database.workspace_id


class FieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field
        fields = [
            "id",
            "table",
            "name",
            "type",
            "required",
            "unique",
            "order",
            "options",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        field = self.instance
        if field and "type" in attrs and attrs["type"] != field.type:
            # Prevent destructive type changes. In production we would add migrations.
            raise serializers.ValidationError("Field type changes are not yet supported.")
        return super().validate(attrs)


class ViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = View
        fields = ["id", "table", "name", "config", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class RecordSerializer(serializers.ModelSerializer):
    table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all(), required=False)

    class Meta:
        model = Record
        fields = ["id", "table", "data", "created_by", "updated_by", "created_at", "updated_at"]
        read_only_fields = ["id", "created_by", "updated_by", "created_at", "updated_at"]

    def validate(self, attrs: Dict[str, Any]):
        table: Table = self.context["table"]
        attrs["table"] = table
        data = attrs.get("data", {})
        fields = list(table.fields.all())
        errors = {}
        for field in fields:
            value = data.get(field.name)
            if field.required and value in (None, ""):
                errors[field.name] = "This field is required."
                continue
            if value in (None, ""):
                continue
            if field.type in {FieldType.NUMBER, FieldType.DECIMAL}:
                if not isinstance(value, (int, float, str)):
                    errors[field.name] = "Must be a number."
                    continue
                try:
                    numeric = float(value)
                    data[field.name] = numeric if field.type == FieldType.DECIMAL else int(numeric)
                except (TypeError, ValueError):
                    errors[field.name] = "Invalid number."
            elif field.type == FieldType.BOOLEAN:
                if not isinstance(value, (bool, int, str)):
                    errors[field.name] = "Must be boolean."
                else:
                    if isinstance(value, str):
                        data[field.name] = value.lower() in {"true", "1", "yes"}
                    else:
                        data[field.name] = bool(value)
            elif field.type == FieldType.DATE:
                # Accept ISO strings.
                if not isinstance(value, str):
                    errors[field.name] = "Must be ISO date string."
            elif field.type == FieldType.SINGLE_SELECT:
                choices = field.options.get("choices", [])
                if value not in choices:
                    errors[field.name] = "Invalid choice."
            elif field.type == FieldType.MULTI_SELECT:
                choices = field.options.get("choices", [])
                if not isinstance(value, list) or not set(value).issubset(set(choices)):
                    errors[field.name] = "Invalid choices."
            elif field.type == FieldType.ATTACHMENT:
                if not isinstance(value, str):
                    errors[field.name] = "Attachment must be a base64 string."
                # Future extension point: replace inline base64 strings with external storage references (e.g. S3 object keys).
        if errors:
            raise serializers.ValidationError({"data": errors})

        # Unique constraint check
        instance = self.instance
        for field in fields:
            if not field.unique:
                continue
            value = data.get(field.name)
            if value in (None, ""):
                continue
            query = Q(data__contains={field.name: value})
            qs = Record.objects.filter(table=table).filter(query)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"data": {field.name: "Value must be unique."}})
        attrs["data"] = data
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data.setdefault("created_by", user)
        validated_data.setdefault("updated_by", user)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["updated_by"] = self.context["request"].user
        return super().update(instance, validated_data)

from __future__ import annotations

from typing import Dict, List, Tuple

from django.db.models import Q
from __future__ import annotations

from typing import Tuple

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from common.permissions import WorkspaceRolePermission
from workspaces.models import Workspace
from .models import Database, Table, Field, Record, View, FieldType
from .serializers import (
    DatabaseSerializer,
    TableSerializer,
    FieldSerializer,
    RecordSerializer,
    ViewSerializer,
)


class WorkspaceContextMixin:
    workspace: Workspace | None = None

    def set_workspace_from_table(self, table: Table):
        self.workspace = table.database.workspace

    def set_workspace_from_database(self, database: Database):
        self.workspace = database.workspace


class DatabaseViewSet(viewsets.ModelViewSet, WorkspaceContextMixin):
    serializer_class = DatabaseSerializer
    permission_classes = [WorkspaceRolePermission]

    def get_queryset(self):
        qs = Database.objects.filter(workspace__role_assignments__user=self.request.user).select_related("workspace")
        workspace_id = self.request.query_params.get("workspace")
        if workspace_id:
            qs = qs.filter(workspace_id=workspace_id)
        return qs

    def perform_create(self, serializer):
        workspace_id = self.request.data.get("workspace")
        workspace = get_object_or_404(Workspace, pk=workspace_id)
        self.workspace = workspace
        serializer.save(workspace=workspace)

    def get_object(self):
        obj = super().get_object()
        self.set_workspace_from_database(obj)
        return obj


class TableViewSet(viewsets.ModelViewSet, WorkspaceContextMixin):
    serializer_class = TableSerializer
    permission_classes = [WorkspaceRolePermission]

    def get_queryset(self):
        qs = Table.objects.filter(database__workspace__role_assignments__user=self.request.user).select_related("database", "database__workspace")
        database_id = self.request.query_params.get("database")
        if database_id:
            qs = qs.filter(database_id=database_id)
        return qs

    def perform_create(self, serializer):
        database = get_object_or_404(Database, pk=self.request.data.get("database"))
        self.set_workspace_from_database(database)
        serializer.save(database=database)

    def get_object(self):
        obj = super().get_object()
        self.set_workspace_from_table(obj)
        return obj

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.query_params.get("hard") == "1":
            return super().destroy(request, *args, **kwargs)
        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FieldViewSet(viewsets.ModelViewSet, WorkspaceContextMixin):
    serializer_class = FieldSerializer
    permission_classes = [WorkspaceRolePermission]

    def get_queryset(self):
        qs = Field.objects.filter(table__database__workspace__role_assignments__user=self.request.user).select_related("table", "table__database", "table__database__workspace")
        table_id = self.request.query_params.get("table")
        if table_id:
            qs = qs.filter(table_id=table_id)
        return qs

    def perform_create(self, serializer):
        table = get_object_or_404(Table, pk=self.request.data.get("table"))
        self.set_workspace_from_table(table)
        serializer.save(table=table, order=table.fields.count())

    def get_object(self):
        obj = super().get_object()
        self.set_workspace_from_table(obj.table)
        return obj


class ViewViewSet(viewsets.ModelViewSet, WorkspaceContextMixin):
    serializer_class = ViewSerializer
    permission_classes = [WorkspaceRolePermission]

    def get_queryset(self):
        qs = View.objects.filter(table__database__workspace__role_assignments__user=self.request.user).select_related("table", "table__database", "table__database__workspace")
        table_id = self.request.query_params.get("table")
        if table_id:
            qs = qs.filter(table_id=table_id)
        return qs

    def perform_create(self, serializer):
        table = get_object_or_404(Table, pk=self.request.data.get("table"))
        self.set_workspace_from_table(table)
        serializer.save(table=table)

    def get_object(self):
        obj = super().get_object()
        self.set_workspace_from_table(obj.table)
        return obj


class RecordViewSet(
    WorkspaceContextMixin,
    viewsets.GenericViewSet,
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
):
    serializer_class = RecordSerializer
    permission_classes = [WorkspaceRolePermission]
    _table_cache: Table | None = None

    def get_table(self) -> Table:
        if self._table_cache is None:
            table = get_object_or_404(
                Table.objects.select_related("database", "database__workspace").filter(
                    database__workspace__role_assignments__user=self.request.user
                ),
                pk=self.kwargs["table_id"],
            )
            self.set_workspace_from_table(table)
            self._table_cache = table
        return self._table_cache

    def get_queryset(self):
        table = self.get_table()
        qs = Record.objects.filter(table=table)
        qs = self.apply_filters(qs, table)
        qs = qs.order_by(*self.get_ordering(table))
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["table"] = self.get_table()
        return context

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def get_ordering(self, table: Table) -> Tuple[str, ...]:
        sort_param = self.request.query_params.get("sort")
        if not sort_param:
            return ("-id",)
        ordering = []
        for spec in sort_param.split(","):
            if not spec:
                continue
            try:
                field_name, direction = spec.split(":")
            except ValueError:
                continue
            if not table.fields.filter(name=field_name).exists():
                continue
            prefix = "" if direction == "asc" else "-"
            ordering.append(f"{prefix}data__{field_name}")
        return tuple(ordering or ("-id",))

    def apply_filters(self, queryset, table: Table):
        search = self.request.query_params.get("search")
        if search:
            text_fields = table.fields.filter(type__in=[FieldType.TEXT, FieldType.LONG_TEXT])
            conditions = Q()
            for field in text_fields:
                conditions |= Q(**{f"data__{field.name}__icontains": search})
            if conditions:
                queryset = queryset.filter(conditions)
        filter_param = self.request.query_params.get("filter")
        if filter_param:
            for clause in filter_param.split(","):
                parts = clause.split(":")
                if len(parts) < 3:
                    continue
                field_name, operator, value = parts[0], parts[1], ":".join(parts[2:])
                queryset = self.apply_filter_clause(queryset, table, field_name, operator, value)
        return queryset

    def apply_filter_clause(self, queryset, table: Table, field_name: str, operator: str, value: str):
        if not table.fields.filter(name=field_name).exists():
            return queryset
        lookup_base = f"data__{field_name}"
        if operator == "eq":
            return queryset.filter(**{lookup_base: value})
        if operator == "ne":
            return queryset.exclude(**{lookup_base: value})
        if operator == "contains":
            return queryset.filter(**{f"{lookup_base}__icontains": value})
        if operator == "gt":
            return queryset.filter(**{f"{lookup_base}__gt": value})
        if operator == "lt":
            return queryset.filter(**{f"{lookup_base}__lt": value})
        if operator == "between":
            start, _, end = value.partition("|")
            return queryset.filter(**{f"{lookup_base}__gte": start, f"{lookup_base}__lte": end})
        if operator == "in":
            return queryset.filter(**{f"{lookup_base}__in": value.split("|")})
        return queryset

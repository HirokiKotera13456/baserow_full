from django.contrib import admin

from .models import Database, Table, Field, Record, View


@admin.register(Database)
class DatabaseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "workspace", "created_at")
    search_fields = ("name", "workspace__name")


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "database", "deleted_at")
    list_filter = ("deleted_at",)


@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "table", "type", "order")
    list_filter = ("type",)


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ("id", "table", "created_by", "created_at")
    search_fields = ("table__name",)


@admin.register(View)
class ViewAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "table")

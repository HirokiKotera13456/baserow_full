from django.conf import settings
from django.db import models
from django.utils import timezone

from workspaces.models import Workspace


class Database(models.Model):
    workspace = models.ForeignKey(Workspace, related_name="databases", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name


class Table(models.Model):
    database = models.ForeignKey(Database, related_name="tables", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])

    def __str__(self) -> str:
        return self.name


class FieldType(models.TextChoices):
    TEXT = "text", "Text"
    LONG_TEXT = "long_text", "Long text"
    NUMBER = "number", "Number"
    DECIMAL = "decimal", "Decimal"
    BOOLEAN = "boolean", "Boolean"
    DATE = "date", "Date"
    SINGLE_SELECT = "single_select", "Single select"
    MULTI_SELECT = "multi_select", "Multi select"
    ATTACHMENT = "attachment", "Attachment"


class Field(models.Model):
    table = models.ForeignKey(Table, related_name="fields", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=32, choices=FieldType.choices)
    required = models.BooleanField(default=False)
    unique = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    options = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("table", "name")
        ordering = ("order", "id")

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"


class Record(models.Model):
    table = models.ForeignKey(Table, related_name="records", on_delete=models.CASCADE)
    data = models.JSONField(default=dict)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="created_records",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="updated_records",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-id",)

    def __str__(self) -> str:
        return f"Record {self.id}"


class View(models.Model):
    table = models.ForeignKey(Table, related_name="views", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name

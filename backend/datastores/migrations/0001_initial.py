from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("workspaces", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Database",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "workspace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="databases", to="workspaces.workspace"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Table",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "database",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tables", to="datastores.database"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Field",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("text", "Text"),
                            ("long_text", "Long text"),
                            ("number", "Number"),
                            ("decimal", "Decimal"),
                            ("boolean", "Boolean"),
                            ("date", "Date"),
                            ("single_select", "Single select"),
                            ("multi_select", "Multi select"),
                            ("attachment", "Attachment"),
                        ],
                        max_length=32,
                    ),
                ),
                ("required", models.BooleanField(default=False)),
                ("unique", models.BooleanField(default=False)),
                ("order", models.PositiveIntegerField(default=0)),
                ("options", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "table",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="fields", to="datastores.table"),
                ),
            ],
            options={"ordering": ("order", "id"), "unique_together": {("table", "name")}},
        ),
        migrations.CreateModel(
            name="View",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                ("config", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "table",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="views", to="datastores.table"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Record",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("data", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "table",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="records", to="datastores.table"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ("-id",)},
        ),
    ]

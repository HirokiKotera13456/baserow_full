#!/usr/bin/env python
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

if __name__ == "__main__":
    project_root = Path(__file__).resolve().parent
    load_dotenv(project_root / ".env")
    load_dotenv(project_root.parent / ".env")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)

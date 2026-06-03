"""Base service with shared CSV persistence logic."""
import csv
import os
import uuid
from datetime import datetime
from typing import Optional
from config import settings


class BaseService:
    csv_filename: str = "base.csv"
    csv_fields: list = []

    @property
    def csv_path(self) -> str:
        return os.path.join(settings.CSV_DATA_DIR, self.csv_filename)

    def _ensure_csv(self):
        os.makedirs(settings.CSV_DATA_DIR, exist_ok=True)
        if not os.path.exists(self.csv_path):
            with open(self.csv_path, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=self.csv_fields)
                writer.writeheader()

    def _write_record(self, record: dict):
        self._ensure_csv()
        filtered_record = {field: record.get(field, "") for field in self.csv_fields}
        with open(self.csv_path, "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=self.csv_fields)
            writer.writerow(filtered_record)

    def _read_all(self) -> list:
        self._ensure_csv()
        with open(self.csv_path, "r", newline="") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def _find_record(self, record_id: str) -> Optional[dict]:
        for row in self._read_all():
            if row.get("id") == record_id:
                return row
        return None

    def _new_id(self) -> str:
        return str(uuid.uuid4())

    def _now(self) -> str:
        return datetime.utcnow().isoformat()

    async def get_history(self) -> list:
        return self._read_all()

    async def get_record(self, record_id: str) -> Optional[dict]:
        return self._find_record(record_id)

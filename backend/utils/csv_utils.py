"""Shared CSV read/write helpers."""
import csv
import os
from typing import Optional


def read_csv(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", newline="") as f:
        return list(csv.DictReader(f))


def write_csv_row(path: str, fields: list[str], row: dict):
    write_header = not os.path.exists(path)
    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        if write_header:
            writer.writeheader()
        writer.writerow(row)


def find_row(path: str, key: str, value: str) -> Optional[dict]:
    for row in read_csv(path):
        if row.get(key) == value:
            return row
    return None

#!/usr/bin/env python3
"""Собирает data/food.js для сайта из выгрузок fatsecret/data/YYYY-MM.csv.

Запуск после выгрузки нового месяца:
    python3 fatsecret/fatsecret_sync.py month 2026-11
    python3 tools/build_food.py
"""
import csv, glob, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = {}
for f in sorted(glob.glob(os.path.join(ROOT, "fatsecret", "data", "[0-9][0-9][0-9][0-9]-[0-9][0-9].csv"))):
    for r in csv.DictReader(open(f, encoding="utf-8")):
        num = lambda k: round(float(r.get(k) or 0), 1)
        rows[r["date"]] = [r["date"], round(float(r["calories"] or 0)), num("protein"), num("fat"), num("carbohydrate")]
data = [rows[k] for k in sorted(rows)]
out = os.path.join(ROOT, "data", "food.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("// Сгенерировано tools/build_food.py из выгрузок FatSecret: [дата, ккал, белок г, жиры г, углеводы г]\n")
    f.write("window.FOOD=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(f"{len(data)} дней -> {out}")

# body-tracker

Личный трекер тела: вес, состав тела (биоимпеданс), объёмы, питание, шаги и тренировки.

Сайт: https://zkatemor.github.io/body-tracker/

- `index.html` — главный дашборд: вес, состав тела, объёмы, программа, прогноз
- `food.html` — питание по дневнику FatSecret
- `steps.html` — шаги, активность и силовые по Apple Watch

Данные: [замеры сантиметром](https://docs.google.com/spreadsheets/d/1mLTbE53vwJ1VL-9ManBTwdSsbVKpNzFgciY4COAL1OY/edit) (с апреля 2025), тесты Accuniq BC380, FatSecret, Apple Health.

## Обновить питание

```
python3 fatsecret/fatsecret_sync.py month 2026-11
python3 tools/build_food.py
```

Ключи FatSecret лежат в `fatsecret/.env` и не попадают в git.

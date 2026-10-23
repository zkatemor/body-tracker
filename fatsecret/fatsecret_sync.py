#!/usr/bin/env python3
"""Выгрузка дневника питания FatSecret через Platform API (OAuth 1.0, 3-legged).

Только стандартная библиотека Python, ничего ставить не нужно.

1) Положите ключи в fatsecret/.env (файл не попадает в git):
     FATSECRET_CONSUMER_KEY=...
     FATSECRET_CONSUMER_SECRET=...
2) python3 fatsecret/fatsecret_sync.py auth
     — откроется ссылка, войдите в FatSecret, нажмите «Разрешить», вставьте код.
     Токен сохранится в fatsecret/token.json (тоже не в git).
3) python3 fatsecret/fatsecret_sync.py month 2026-10
     — итоги по дням за месяц -> fatsecret/data/2026-10.csv
   python3 fatsecret/fatsecret_sync.py day 2026-10-23
     — все продукты за день -> fatsecret/data/2026-10-23.csv
"""
import base64, csv, datetime as dt, hashlib, hmac, json, os, secrets, sys, time
import urllib.parse, urllib.request, webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
API = "https://platform.fatsecret.com/rest/server.api"
REQ = "https://authentication.fatsecret.com/oauth/request_token"
AUTH = "https://authentication.fatsecret.com/oauth/authorize"
ACC = "https://authentication.fatsecret.com/oauth/access_token"
TOKEN = os.path.join(HERE, "token.json")
DATA = os.path.join(HERE, "data")


def env():
    p = os.path.join(HERE, ".env")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    try:
        return os.environ["FATSECRET_CONSUMER_KEY"], os.environ["FATSECRET_CONSUMER_SECRET"]
    except KeyError:
        sys.exit("Нет ключей: заполните fatsecret/.env (FATSECRET_CONSUMER_KEY и FATSECRET_CONSUMER_SECRET)")


q = lambda s: urllib.parse.quote(str(s), safe="~-._")


def signed(method, url, params, ck, cs, token="", ts=""):
    p = dict(params)
    p.update(oauth_consumer_key=ck, oauth_nonce=secrets.token_hex(8), oauth_signature_method="HMAC-SHA1",
             oauth_timestamp=str(int(time.time())), oauth_version="1.0")
    if token:
        p["oauth_token"] = token
    norm = "&".join(f"{q(k)}={q(v)}" for k, v in sorted(p.items()))
    base = "&".join([method, q(url), q(norm)])
    sig = hmac.new(f"{q(cs)}&{q(ts)}".encode(), base.encode(), hashlib.sha1).digest()
    p["oauth_signature"] = base64.b64encode(sig).decode()
    body = urllib.parse.urlencode(p, quote_via=urllib.parse.quote)
    if method == "GET":
        req = urllib.request.Request(url + "?" + body)
    else:
        req = urllib.request.Request(url, data=body.encode(), headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode()


def auth():
    ck, cs = env()
    r = dict(urllib.parse.parse_qsl(signed("POST", REQ, {"oauth_callback": "oob"}, ck, cs)))
    url = f"{AUTH}?oauth_token={r['oauth_token']}"
    print("Откройте ссылку, войдите в FatSecret и разрешите доступ:\n" + url)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    code = input("Код подтверждения: ").strip()
    a = dict(urllib.parse.parse_qsl(signed("GET", ACC, {"oauth_verifier": code}, ck, cs, r["oauth_token"], r["oauth_token_secret"])))
    json.dump({"token": a["oauth_token"], "secret": a["oauth_token_secret"]}, open(TOKEN, "w"))
    os.chmod(TOKEN, 0o600)
    print("Готово, токен сохранён в", TOKEN)


def call(method, **params):
    ck, cs = env()
    if not os.path.exists(TOKEN):
        sys.exit("Сначала выполните: python3 fatsecret/fatsecret_sync.py auth")
    t = json.load(open(TOKEN))
    params.update(method=method, format="json")
    res = json.loads(signed("GET", API, params, ck, cs, t["token"], t["secret"]))
    if "error" in res:
        sys.exit(f"Ошибка API: {res['error']}")
    return res


days = lambda d: (d - dt.date(1970, 1, 1)).days
aslist = lambda x: x if isinstance(x, list) else ([x] if x else [])


def month(ym):
    d = dt.date.fromisoformat(ym + "-01")
    res = call("food_entries.get_month", date=days(d))
    rows = aslist((res.get("month") or {}).get("day"))
    os.makedirs(DATA, exist_ok=True)
    out = os.path.join(DATA, f"{ym}.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["date", "calories", "protein", "fat", "carbohydrate"])
        for r in rows:
            day = dt.date(1970, 1, 1) + dt.timedelta(int(r["date_int"]))
            w.writerow([day.isoformat(), r.get("calories"), r.get("protein"), r.get("fat"), r.get("carbohydrate")])
    print(f"{len(rows)} дней -> {out}")


def day(iso):
    res = call("food_entries.get", date=days(dt.date.fromisoformat(iso)))
    rows = aslist((res.get("food_entries") or {}).get("food_entry"))
    os.makedirs(DATA, exist_ok=True)
    out = os.path.join(DATA, f"{iso}.csv")
    cols = ["meal", "food_entry_name", "food_entry_description", "calories", "protein", "fat", "carbohydrate"]
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in rows:
            w.writerow([r.get(c) for c in cols])
    print(f"{len(rows)} записей -> {out}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "auth":
        auth()
    elif cmd == "month" and len(sys.argv) == 3:
        month(sys.argv[2])
    elif cmd == "day" and len(sys.argv) == 3:
        day(sys.argv[2])
    else:
        print(__doc__)

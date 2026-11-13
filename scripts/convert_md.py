#!/usr/bin/env python3
"""Convertit les textes du paquet WordPress (format md + shortcodes [ps…]) en pages MDX Astro."""
import json, re, sys
from pathlib import Path

SRC = Path(sys.argv[1])          # dossier content/ du paquet WordPress
DST = Path(sys.argv[2])          # src/content/pages

TYPE_MAP = {"apk": "apk", "code-promo": "code-promo", "inscription": "inscription"}


def attrs(s):
    return dict(re.findall(r'(\w+)="([^"]*)"', s))


def jsx_attrs(d, rename=None):
    rename = rename or {}
    return " ".join(f'{rename.get(k, k)}="{v}"' for k, v in d.items())


def inline(text):
    def rep(m):
        a = attrs(m.group(1))
        out = {"b": a.get("brand", ""), "f": a.get("f", "bonus")}
        if a.get("default"):
            out["d"] = a["default"]
        return "<V " + jsx_attrs(out) + " />"
    text = re.sub(r"\[ps((?:\s+\w+=\"[^\"]*\")*)\s*\]", rep, text)
    return text.replace("{", "&#123;").replace("}", "&#125;")


def convert_body(md, brand):
    lines = md.split("\n")
    out, faq, shots = [], [], []
    i, n = 0, len(lines)
    faq_placed = False
    while i < n:
        s = lines[i].strip()
        if s.startswith(":::"):
            kind = s[3:].strip()
            j = i + 1
            inner = []
            while j < n and lines[j].strip() != ":::":
                inner.append(lines[j]); j += 1
            i = j + 1
            if kind == "proscons":
                out.append(f'<ProsCons brand="{brand}" />')
            elif kind == "shot":
                items = [l.strip() for l in inner if l.strip()]
                shots.extend(items)
                for it in items:
                    out.append(f"<Shot>{inline(it)}</Shot>")
            else:
                tag = {"note": "Note", "warn": "Warn", "rg": "Rg"}[kind]
                body, _, _ = convert_body("\n".join(inner), brand)
                out.append(f"<{tag}>\n\n{body}\n\n</{tag}>")
            out.append("")
            continue
        if s.startswith("?? "):
            q = s[3:].strip(); i += 1; ans = []
            while i < n:
                t = lines[i].strip()
                if t.startswith("?? ") or t.startswith("## ") or t.startswith(":::") or t.startswith("[ps"):
                    break
                if t:
                    ans.append(t)
                i += 1
            faq.append({"q": q, "a": " ".join(ans)})
            if not faq_placed:
                out.append("<Faq items={frontmatter.faq} />"); out.append("")
                faq_placed = True
            continue
        m = re.fullmatch(r"\[(ps_\w+)((?:\s+\w+=\"[^\"]*\")*)\s*\]", s)
        if m:
            name, a = m.group(1), attrs(m.group(2))
            comp = {
                "ps_byline": "Byline", "ps_offer": "Offer", "ps_toc": "Toc", "ps_facts": "Facts",
                "ps_alternatives": "Alternatives", "ps_ranking": "Ranking", "ps_picks": "Picks",
            }[name]
            if comp == "Ranking":
                out.append("<TagBar />"); out.append("")
            out.append(f"<{comp} {jsx_attrs(a)} />".replace("  ", " ").replace(" />", " />"))
            i += 1
            continue
        out.append(inline(lines[i]))
        i += 1
    body = "\n".join(out)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body.strip() + "\n", faq, shots


def fm_value(v):
    return json.dumps(v, ensure_ascii=False)


for f in sorted(SRC.glob("*.md")):
    for chunk in f.read_text(encoding="utf-8").split("\n===\n"):
        m = re.match(r"\s*---\n(.*?)\n---\n(.*)", chunk, re.S)
        meta = {}
        for l in m.group(1).split("\n"):
            k, _, v = l.partition(":")
            meta[k.strip()] = v.strip()
        slug, parent = meta["slug"], meta.get("parent", "")
        brand = meta.get("brand", "")
        if slug == "accueil":
            path, ptype, out_file = "/", "ranking", DST / "index.mdx"
        elif parent:
            path = f"/{parent}/{slug}/"
            ptype = TYPE_MAP.get(slug, "")
            out_file = DST / parent / f"{slug}.mdx"
        elif brand and slug == brand:
            path, ptype, out_file = f"/{slug}/", "avis", DST / slug / "index.mdx"
        else:
            path, ptype, out_file = f"/{slug}/", "info", DST / f"{slug}.mdx"
        body, faq, shots = convert_body(m.group(2), brand or parent)
        front = {
            "path": path, "title": meta["title"], "seo_title": meta["seo_title"], "seo_desc": meta["seo_desc"],
            "focus": meta.get("focus", ""), "type": ptype,
        }
        if brand or parent:
            front["brand"] = brand or parent
        if faq:
            front["faq"] = faq
        if shots:
            front["shots"] = shots
        bc = {"apk": "Télécharger l'APK", "code-promo": "Code promo", "inscription": "Inscription", "avis": "Avis"}.get(ptype)
        if bc:
            front["breadcrumb"] = bc
        fm = "---\n" + "\n".join(f"{k}: {fm_value(v)}" for k, v in front.items()) + "\n---\n"
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(fm + body, encoding="utf-8")
        print(f"{path:28} -> {out_file.relative_to(DST)}  faq={len(faq)} shots={len(shots)}")

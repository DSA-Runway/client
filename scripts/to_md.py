"""Convert authored subtopic containers from TypeScript literals to Markdown."""
import re, io, json, os, sys, urllib.request

BASE = "http://localhost:3000/api/content"

def esc_scalar(v):
    # frontmatter scalars: our values are plain slugs/words/titles; quote if risky
    if re.search(r'^[\s]|[:#]|[\s]$', v) or v == "":
        return '"' + v.replace('"', '\\"') + '"'
    return v

def emit(c):
    o = []
    o.append("---")
    for k in ("id", "topic", "title", "difficulty", "status"):
        o.append(f"{k}: {esc_scalar(c[k])}")
    for k in ("prerequisites", "relatedIds"):
        v = c.get(k)
        if v:
            o.append(f"{k}:")
            for x in v: o.append(f"  - {x}")
    o.append("---")
    o.append("")
    o.append("<!-- @summary -->")
    o.append(c["summary"]); o.append("")
    o.append("<!-- @theory -->")
    o.append(c["theory"]); o.append("")
    if c.get("intuition"):
        o.append("<!-- @intuition -->")
        o.append(c["intuition"]); o.append("")

    for a in c["approaches"]:
        o.append("<!-- @approach -->")
        o.append(f"### {a['name']}"); o.append("")
        o.append("<!-- @idea -->")
        o.append(a["idea"]); o.append("")
        o.append("<!-- @steps -->")
        for i, s in enumerate(a["steps"], 1): o.append(f"{i}. {s}")
        o.append("")
        if a.get("complexity"):
            cx = a["complexity"]
            o.append("<!-- @complexity -->")
            o.append(f"- time: {cx['time']}")
            o.append(f"- space: {cx['space']}")
            if cx.get("note"): o.append(f"- note: {cx['note']}")
            o.append("")
        for smp in a["code"]:
            o.append(f"<!-- @code {smp['language']} -->")
            o.append(f"```{smp['language']}")
            o.append(smp["code"])
            o.append("```"); o.append("")
            ann = smp.get("annotations") or {}
            if ann:
                o.append("<!-- @annotations -->")
                for k in sorted(ann, key=lambda x: int(x)):
                    o.append(f"- {int(k)}: {ann[k]}")
                o.append("")

    for e in c["examples"]:
        o.append("<!-- @example -->"); o.append("")
        o.append("<!-- @input -->")
        o.append(e["input"]); o.append("")
        o.append("<!-- @output -->")
        o.append(e["output"]); o.append("")
        if e.get("why"):
            o.append("<!-- @why -->")
            o.append(e["why"]); o.append("")
        o.append("<!-- @walkthrough -->")
        for i, w in enumerate(e["walkthrough"], 1): o.append(f"{i}. {w}")
        o.append("")

    v = c["visualization"]
    o.append(f"<!-- @visualization {v['kind']} -->"); o.append("")
    o.append("<!-- @description -->")
    o.append(v["description"]); o.append("")
    o.append("<!-- @sampleInput -->")
    o.append("```json"); o.append(v["sampleInput"]); o.append("```"); o.append("")
    if v.get("highlights"):
        o.append("<!-- @highlights -->")
        for h in v["highlights"]: o.append(f"- {h}")
        o.append("")

    if c.get("edgeCases"):
        o.append("<!-- @edgeCases -->")
        for x in c["edgeCases"]: o.append(f"- {x}")
        o.append("")
    if c.get("pitfalls"):
        o.append("<!-- @pitfalls -->")
        for x in c["pitfalls"]: o.append(f"- {x}")
        o.append("")
    for d in (c.get("commonDoubts") or []):
        o.append("<!-- @doubt -->")
        o.append(f"### {d['question']}"); o.append("")
        o.append("<!-- @answer -->")
        o.append(d["answer"]); o.append("")
    return "\n".join(o).rstrip() + "\n"

def main():
    ids = re.findall(r'^\s*"([a-z0-9-]+)",\s*$',
                     io.open("src/content/manifest.ts", encoding="utf-8").read(), re.M)
    written = 0
    for i in ids:
        c = json.load(urllib.request.urlopen(f"{BASE}/{i}", timeout=30))
        folder = "basics" if c["topic"] == "Basics" else "arrays"
        path = f"src/content/{folder}/{i}.md"
        io.open(path, "w", encoding="utf-8").write(emit(c))
        json.dump(c, io.open(f"/tmp/orig_{i}.json", "w"), sort_keys=True)
        written += 1
    print(f"wrote {written} markdown files")

main()

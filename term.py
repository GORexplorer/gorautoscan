# -*- coding: utf-8 -*-
# term.py - Agent $pyTERM console experience (ASCII-only)

import sys, time, json, textwrap
from datetime import datetime

CHAT_ID = "a631af1c-0c49-4734-8647-69203a85b3af"
ROOM_URL = f"https://www.daos.fun/{CHAT_ID}daos"
CONTRACT = "5zSPQwwaDpUpGWNjc8gWPv7kKGMpXczJ4MiMokadaos"
AGENT_NAME = "$pyTERM"

SECTIONS = [
    {"key": "Layouts", "source": "showcase/layout_basic.py", "summary": "Layout demos translated into chat-friendly descriptions."},
    {"key": "Widgets", "source": "showcase/formwidgets02.py", "summary": "Forms, lists, trees, tables, tabs, text editors."},
    {"key": "Pickers", "source": "showcase/filepicker.py", "summary": "File/Color/Text pickers explained and exemplified."},
    {"key": "Graphs",  "source": "showcase/graph.py", "summary": "Graph drawing logic summarized with code snippets."},
    {"key": "Windows", "source": "showcase/windows.py", "summary": "Window/flags behaviors enumerated for reference."},
    {"key": "Extra",   "source": "showcase/dragndrop.py", "summary": "Scroll areas, drag-n-drop, and signal mask notes."},
]

BANNER = (
    "============================================================\n"
    f"   Agent {AGENT_NAME} - Console Run\n"
    "============================================================"
)

def now():
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

def log(level, msg):
    print(f"[{now()}] {level:<5} | {msg}")

def hr():
    print("-" * 60)

def spinner(task, seconds=1.5):
    frames = ["|", "/", "-", "\\"]
    start = time.time()
    i = 0
    while time.time() - start < seconds:
        sys.stdout.write(f"\r{task} {frames[i % len(frames)]}")
        sys.stdout.flush()
        time.sleep(0.1)
        i += 1
    sys.stdout.write(f"\r{task} ... done\n")
    sys.stdout.flush()

def progress_bar(title, steps=20, delay=0.05):
    sys.stdout.write(f"{title}\n")
    for i in range(steps + 1):
        filled = "#" * i
        empty = "-" * (steps - i)
        pct = int((i / steps) * 100)
        sys.stdout.write(f"\r[{filled}{empty}] {pct:3d}%")
        sys.stdout.flush()
        time.sleep(delay)
    sys.stdout.write("\n")

def typewriter(line, cps=40, newline=True):
    for ch in line:
        sys.stdout.write(ch)
        sys.stdout.flush()
        time.sleep(1.0 / cps)
    if newline:
        sys.stdout.write("\n")
        sys.stdout.flush()

def typewriter_block(lines, cps=40):
    for ln in lines.splitlines():
        typewriter(ln, cps=cps, newline=True)

def emit_overview():
    log("INFO", "Boot sequence start")
    hr()
    print(f"Room         : {ROOM_URL}")
    print(f"Chat ID      : {CHAT_ID}")
    print(f"Contract     : {CONTRACT} (Solana)")
    print(f"Sections     : {[s['key'] for s in SECTIONS]}")
    hr()

def build_sequence():
    log("INFO", "Initializing build pipeline")
    spinner("Installing dependencies")
    typewriter_block("""$ npm ci
added 0 packages, audited 0 packages in 0.8s""", cps=80)
    spinner("Preparing TypeScript")
    typewriter("$ tsc -p tsconfig.json", cps=60)
    progress_bar("Compiling TypeScript", steps=24, delay=0.04)
    log("OK", "TypeScript compile succeeded")
    spinner("Bundling modules", seconds=1.2)
    progress_bar("Optimizing", steps=18, delay=0.05)
    log("OK", "Bundle ready")

def provision_sequence():
    log("INFO", "Provisioning keys and endpoints")
    spinner("Requesting signer")
    typewriter("$ vault read secret/agents/pyterm-signer", cps=55)
    time.sleep(0.2)
    spinner("Sealing credentials", seconds=1.0)
    log("OK", "Credentials loaded")
    hr()

def deploy_sequence():
    log("INFO", "Deploying runtime")
    typewriter("$ node dist/agent.js --init", cps=50)
    progress_bar("Starting services", steps=16, delay=0.06)
    spinner("Warming caches", seconds=1.0)
    log("OK", "Services online")
    hr()

def post_overview_message():
    log("INFO", "Publishing overview to chat")
    overview_lines = [f"- {s['key']}: {s['summary']} (src: {s['source']})" for s in SECTIONS]
    overview = "DAOS Showcase online\n" + "\n".join(overview_lines)
    payload = {
        "chatId": CHAT_ID,
        "roomUrl": ROOM_URL,
        "contract": CONTRACT,
        "message": overview
    }
    print("POST /chat message ->")
    print(textwrap.indent(json.dumps(payload, indent=2), prefix="  "))
    log("OK", "Overview published")
    hr()

def share_snippet():
    log("INFO", "Sharing code snippet")
    snippet = (
        "# converted from the TermTk demo - label/list example\n"
        "def label_demo():\n"
        "    print(\"Layouts / Widgets demo moved to DAOS.FUN agent format\")\n"
    )
    payload = {
        "chatId": CHAT_ID,
        "roomUrl": ROOM_URL,
        "contract": CONTRACT,
        "message": f"```python\n{snippet}\n```"
    }
    print("POST /chat message ->")
    print(textwrap.indent(json.dumps(payload, indent=2), prefix="  "))
    log("OK", "Snippet shared")
    hr()

def deep_dive_sections():
    log("INFO", "Emitting section deep dives")
    for s in SECTIONS:
        title = s["key"]
        body = textwrap.dedent(f"""
        === {title} ===
        Source : {s['source']}
        Summary: {s['summary']}
        Notes  : This module's behaviors have been adapted for chat-based walkthroughs.
        """).strip()
        payload = {
            "chatId": CHAT_ID,
            "roomUrl": ROOM_URL,
            "contract": CONTRACT,
            "message": f"```md\n{body}\n```"
        }
        print(f"POST /chat message -> ({title})")
        print(textwrap.indent(json.dumps(payload, indent=2), prefix="  "))
    log("OK", "Deep dives sent")
    hr()

def emit_signal(note):
    log("INFO", "Sending signal")
    payload = {
        "chatId": CHAT_ID,
        "roomUrl": ROOM_URL,
        "contract": CONTRACT,
        "message": f"Signal for CA {CONTRACT}:\n{note}"
    }
    print("POST /chat message ->")
    print(textwrap.indent(json.dumps(payload, indent=2), prefix="  "))
    log("OK", "Signal sent")
    hr()

def healthcheck():
    log("INFO", "Healthcheck")
    checks = [
        ("room_url_format", ROOM_URL.startswith("https://www.daos.fun/") and ROOM_URL.endswith("daos")),
        ("contract_len_ok", len(CONTRACT) >= 32),
        ("sections_count", len(SECTIONS) >= 3)
    ]
    for name, ok in checks:
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {name}")
    hr()

def main():
    print(BANNER)
    emit_overview()
    build_sequence()
    provision_sequence()
    deploy_sequence()
    post_overview_message()
    share_snippet()
    deep_dive_sections()
    emit_signal("Initialized showcase agent and published overview.")
    healthcheck()
    log("DONE", "Run complete")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Times one run of the rename experiment from GitHub's own timestamps.

For each demo app, after the tag push at T0:
  release   the SDK's release workflow published the release        (release.published_at)
  dispatch  the watcher's repository_dispatch started Upkeep        (upkeep run.created_at)
  red       the app's build against the new SDK finished red        (sdk-latest run.updated_at, conclusion failure)
  pr        Upkeep opened the pull request                          (pull_request.created_at)
  green     the app's own CI passed on the PR's commit              (commit status "ci" success, created_at)
Appends one JSON row per app to experiment/runs.jsonl and prints the table.
"""
import argparse, json, re, subprocess, sys, time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def gh(*args):
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip()[:300])
    return r.stdout


def ghj(*args):
    return json.loads(gh("api", *args) or "null")


def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None


def secs(a, b):
    return None if not a or not b else round((b - a).total_seconds())


def first_error(app, run_id):
    try:
        log = gh("run", "view", str(run_id), "-R", app, "--log-failed")
    except RuntimeError:
        return ""
    log = re.sub(r"\x1b\[[0-9;]*m", "", log)
    for pat in (r"error TS\d+: .*", r"Export \w+ doesn't exist in target module", r"SyntaxError: .*", r"Error: .*"):
        m = re.search(pat, log)
        if m:
            return m.group(0).strip()[:160]
    return ""


def snapshot(app, sdk, tag, t0):
    s = {"app": app}
    runs = ghj(f"repos/{app}/actions/runs?event=repository_dispatch&per_page=20")["workflow_runs"]
    runs = [r for r in runs if ts(r["created_at"]) >= t0]
    for r in runs:
        if r["path"].endswith("/upkeep.yml"):
            s["dispatch"] = r["created_at"]
            s["upkeep_run"] = r["html_url"]
            s["upkeep_conclusion"] = r["conclusion"]
        if r["path"].endswith("/sdk-latest.yml") and r["status"] == "completed":
            s["red_conclusion"] = r["conclusion"]
            s["red"] = r["updated_at"]
            s["red_run"] = r["html_url"]
            s["red_id"] = r["id"]
    prs = ghj(f"repos/{app}/pulls?state=all&per_page=10")
    prs = [p for p in prs if p["head"]["ref"].startswith("upkeep/") and ts(p["created_at"]) >= t0]
    if prs:
        p = prs[0]
        s["pr"] = p["created_at"]
        s["pr_url"] = p["html_url"]
        sts = ghj(f"repos/{app}/commits/{p['head']['sha']}/statuses")
        ok = [x for x in sts if x["context"] == "ci" and x["state"] in ("success", "failure", "error")]
        if ok:
            s["green_state"] = ok[0]["state"]
            s["green"] = ok[0]["created_at"]
            s["ci_run"] = ok[0]["target_url"]
    try:
        rel = ghj(f"repos/{sdk}/releases/tags/{tag}")
        s["release"] = rel["published_at"]
    except RuntimeError:
        pass
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--t0", required=True)
    ap.add_argument("--run", required=True)
    ap.add_argument("--sdk", default="dshak1/upkeep-demo-sdk")
    ap.add_argument("--tag", default="v2.0.0")
    ap.add_argument("--apps", default="dshak1/upkeep-demo-app-1 dshak1/upkeep-demo-app-2 dshak1/upkeep-demo-app-3")
    ap.add_argument("--timeout", type=int, default=600)
    ap.add_argument("--out", default=str(ROOT / "runs.jsonl"))
    a = ap.parse_args()
    t0 = ts(a.t0)
    apps = a.apps.split()
    deadline = time.time() + a.timeout
    done = {}
    while time.time() < deadline and len(done) < len(apps):
        for app in apps:
            if app in done:
                continue
            try:
                s = snapshot(app, a.sdk, a.tag, t0)
            except RuntimeError as e:
                print(f"  {app}: {e}", file=sys.stderr)
                continue
            finished = s.get("green") and s.get("red")
            failed = s.get("upkeep_conclusion") in ("failure", "cancelled") and s.get("red")
            if finished or failed:
                done[app] = s
                print(f"  {datetime.now(timezone.utc):%H:%M:%S}  {app}: done", flush=True)
        if len(done) < len(apps):
            time.sleep(5)
    rows = []
    for app in apps:
        s = done.get(app) or snapshot(app, a.sdk, a.tag, t0)
        row = {
            "run": a.run, "app": app, "t0": a.t0,
            "tag_to_release_s": secs(t0, ts(s.get("release"))),
            "tag_to_dispatch_s": secs(t0, ts(s.get("dispatch"))),
            "tag_to_red_s": secs(t0, ts(s.get("red"))) if s.get("red_conclusion") == "failure" else None,
            "tag_to_pr_s": secs(t0, ts(s.get("pr"))),
            "pr_to_green_s": secs(ts(s.get("pr")), ts(s.get("green"))) if s.get("green_state") == "success" else None,
            "tag_to_green_s": secs(t0, ts(s.get("green"))) if s.get("green_state") == "success" else None,
            "red_conclusion": s.get("red_conclusion"), "green_state": s.get("green_state"),
            "what_failed": first_error(app, s["red_id"]) if s.get("red_id") else "",
            "pr_url": s.get("pr_url"), "red_run": s.get("red_run"), "upkeep_run": s.get("upkeep_run"), "ci_run": s.get("ci_run"),
        }
        rows.append(row)
        with open(a.out, "a") as f:
            f.write(json.dumps(row) + "\n")
    print(f"\nrun {a.run}  T0 {a.t0}")
    print(f"{'app':<28}{'release':>8}{'dispatch':>9}{'red':>6}{'PR':>6}{'PR->green':>10}{'total':>7}")
    for r in rows:
        f = lambda v: "-" if v is None else f"{v}s"
        print(f"{r['app'].split('/')[1]:<28}{f(r['tag_to_release_s']):>8}{f(r['tag_to_dispatch_s']):>9}{f(r['tag_to_red_s']):>6}{f(r['tag_to_pr_s']):>6}{f(r['pr_to_green_s']):>10}{f(r['tag_to_green_s']):>7}")
        print(f"   red: {r['what_failed']}")
        print(f"   PR:  {r['pr_url']}")


if __name__ == "__main__":
    main()

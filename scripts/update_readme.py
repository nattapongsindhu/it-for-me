"""
update_readme.py
Generates README.md from jobs.json
"""
import json, datetime, os


def main():
    try:
        with open("jobs.json") as f:
            data = json.load(f)
    except Exception as e:
        print(f"ERROR: cannot read jobs.json: {e}")
        return

    jobs    = data.get("jobs", [])
    updated = data.get("updated", "")
    count   = data.get("count", 0)
    today   = datetime.date.today()

    # --- job table ---
    if jobs:
        rows = []
        for j in jobs[:20]:  # show top 20
            title   = j.get("title", "—")
            company = j.get("company", "—")
            loc     = j.get("location", "—")
            salary  = j.get("salary", "—") or "—"
            jtype   = j.get("type", "—") or "—"
            posted  = j.get("posted", "—")
            url     = j.get("url", "")
            link    = f"[Apply]({url})" if url else "—"
            rows.append(f"| {title} | {company} | {loc} | {jtype} | {salary} | {posted} | {link} |")

        job_table = "| Title | Company | Location | Type | Salary | Posted | Link |\n"
        job_table += "|-------|---------|----------|------|--------|--------|------|\n"
        job_table += "\n".join(rows)
    else:
        job_table = "_No jobs found in this run_"

    # --- stats ---
    sources = {}
    for j in jobs:
        s = j.get("source", "unknown")
        sources[s] = sources.get(s, 0) + 1
    source_lines = "\n".join(f"- {s}: {c} jobs" for s, c in sources.items())

    updated_badge = updated.replace(":", "%3A").replace(" ", "_")

    readme_parts = [
        "# 🔍 IT For Me\n",
        f"![Updated](https://img.shields.io/badge/Updated-{updated_badge}-blue?style=flat-square)",
        f"![Jobs](https://img.shields.io/badge/Jobs_Found-{count}-brightgreen?style=flat-square)",
        f"![ZIP](https://img.shields.io/badge/ZIP-90029_%285mi%29-informational?style=flat-square)\n",
        "> Auto-updated twice daily — IT jobs within 5 miles of ZIP 90029 (East LA / Silver Lake area)",
        "> Powered by USAJobs API + Google Jobs via GitHub Actions. Zero cost.\n",
        "---\n",
        f"## 💼 Latest Jobs — {today.strftime('%B %d, %Y')}\n",
        job_table + "\n",
        "---\n",
        "## 📊 Stats\n",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total jobs found | {count} |",
        f"| Search area | 5 miles from ZIP 90029 |",
        f"| Last updated | {updated} |",
        f"| Update schedule | 06:00 + 18:00 UTC daily |\n",
        "**Sources:**",
        source_lines + "\n",
        "---\n",
        "## ⚙️ How It Works\n",
        "```",
        "GitHub Actions (06:00 + 18:00 UTC)",
        "  └── fetch_jobs.py  → USAJobs API + Google Jobs",
        "  └── update_readme.py → README.md job table",
        "  └── update_dashboard.py → index.html dashboard",
        "  └── auto-commit → GitHub Pages",
        "```\n",
        "**Stack:** Python · GitHub Actions · GitHub Pages · USAJobs API · FlyByAPIs\n",
        "---\n",
        "## 🎯 Target Profile\n",
        "- Keywords: IT, cybersecurity, helpdesk, network, sysadmin, healthcare IT",
        "- Location: ZIP 90029 (East Hollywood / Silver Lake / Los Feliz)",
        "- Radius: 5 miles",
        "- Schedule: Part-time and Full-time\n",
        "---\n",
        f"_Auto-generated · Last run: {updated}_\n"
    ]

    with open("README.md", "w") as f:
        f.write("\n".join(readme_parts))

    print(f"README.md updated: {count} jobs listed")


if __name__ == "__main__":
    main()

"""
update_readme.py
Generates a legacy markdown snapshot from jobs.json.
"""

import datetime
import json


def main():
    try:
        with open("jobs.json", encoding="utf-8") as file_handle:
            data = json.load(file_handle)
    except Exception as error:
        print(f"ERROR: cannot read jobs.json: {error}")
        return

    jobs = data.get("jobs", [])
    updated = data.get("updated", "")
    count = data.get("count", 0)
    today = datetime.date.today()

    if jobs:
      rows = []
      for job in jobs[:20]:
          title = job.get("title", "Not listed")
          company = job.get("company", "Not listed")
          location = job.get("location", "Not listed")
          salary = job.get("salary", "Not listed") or "Not listed"
          job_type = job.get("type", "Not listed") or "Not listed"
          posted = job.get("posted", "Not listed")
          url = job.get("url", "")
          link = f"[Apply]({url})" if url else "Not listed"
          rows.append(
              f"| {title} | {company} | {location} | {job_type} | {salary} | {posted} | {link} |"
          )

      job_table = "| Title | Company | Location | Type | Salary | Posted | Link |\n"
      job_table += "|-------|---------|----------|------|--------|--------|------|\n"
      job_table += "\n".join(rows)
    else:
      job_table = "_No jobs found in this run_"

    sources = {}
    for job in jobs:
        source = job.get("source", "unknown")
        sources[source] = sources.get(source, 0) + 1
    source_lines = "\n".join(f"- {source}: {count_value} jobs" for source, count_value in sources.items())

    updated_badge = updated.replace(":", "%3A").replace(" ", "_")

    readme_parts = [
        "# it-for-me legacy snapshot\n",
        f"![Updated](https://img.shields.io/badge/Updated-{updated_badge}-blue?style=flat-square)",
        f"![Jobs](https://img.shields.io/badge/Jobs_Found-{count}-brightgreen?style=flat-square)",
        f"![ZIP](https://img.shields.io/badge/ZIP-90029_%285mi%29-informational?style=flat-square)\n",
        "> This file is a legacy snapshot produced from jobs.json for backward compatibility.\n",
        "---\n",
        f"## Latest Jobs - {today.strftime('%B %d, %Y')}\n",
        job_table + "\n",
        "---\n",
        "## Stats\n",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Total jobs found | {count} |",
        "| Search area | 5 miles from ZIP 90029 |",
        f"| Last updated | {updated} |",
        "| Legacy update schedule | 06:00 + 18:00 UTC daily |\n",
        "**Sources:**",
        source_lines + "\n",
        "---\n",
        "## Legacy Flow\n",
        "```",
        "Legacy automation",
        "  fetch_jobs.py -> jobs.json",
        "  update_readme.py -> LATEST_JOBS.md",
        "  update_dashboard.py -> index.html",
        "```",
        "",
        "**Current active stack:** Next.js, Tailwind CSS, and Supabase\n",
        "---\n",
        f"_Auto-generated legacy snapshot. Last run: {updated}_\n",
    ]

    with open("LATEST_JOBS.md", "w", encoding="utf-8") as file_handle:
        file_handle.write("\n".join(readme_parts))

    print(f"LATEST_JOBS.md updated with a legacy snapshot for {count} jobs")


if __name__ == "__main__":
    main()

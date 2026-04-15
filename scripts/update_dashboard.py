"""
update_dashboard.py
Generates index.html dashboard from jobs.json
"""
import json, datetime


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

    # build job cards HTML
    if jobs:
        cards = []
        for j in jobs[:20]:
            title   = j.get("title", "—")
            company = j.get("company", "—")
            loc     = j.get("location", "—")
            jtype   = j.get("type", "") or ""
            salary  = j.get("salary", "") or ""
            posted  = j.get("posted", "—")
            url     = j.get("url", "#")
            source  = j.get("source", "")

            salary_html = f'<span class="salary">{salary}</span>' if salary and salary != "—" else ""
            type_class  = "ft" if "full" in jtype.lower() else "pt"
            type_label  = jtype if jtype else "—"

            cards.append(f"""
    <div class="job-card">
      <div class="job-header">
        <span class="job-title">{title}</span>
        <span class="job-type {type_class}">{type_label}</span>
      </div>
      <div class="job-company">{company}</div>
      <div class="job-meta">
        <span>📍 {loc}</span>
        <span>📅 {posted}</span>
        <span class="source">{source}</span>
        {salary_html}
      </div>
      <a href="{url}" target="_blank" class="apply-btn">Apply →</a>
    </div>""")
        cards_html = "\n".join(cards)
    else:
        cards_html = '<p class="no-jobs">No jobs found in this run. Check back soon.</p>'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>IT For Me — Jobs near 90029</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #0b1a2a;
      color: #e0f0ff;
      font-family: 'Segoe UI', Arial, sans-serif;
      min-height: 100vh;
      padding: 2rem 1rem;
    }}
    .container {{ max-width: 800px; margin: 0 auto; }}
    h1 {{ font-size: 1.8rem; margin-bottom: 0.25rem; text-align: center; }}
    .subtitle {{ color: #7ab; font-size: 0.9rem; text-align: center; margin-bottom: 1.5rem; }}
    .stats {{
      display: flex; flex-wrap: wrap; gap: 1rem;
      justify-content: center; margin-bottom: 2rem;
    }}
    .stat {{
      background: #0f2840; border: 1px solid #1e3a5f;
      border-radius: 10px; padding: 0.75rem 1.5rem; text-align: center;
    }}
    .stat .val {{ font-size: 1.8rem; font-weight: bold; color: #00ffcc; }}
    .stat .lbl {{ font-size: 0.75rem; color: #7ab; text-transform: uppercase; }}
    .filter-bar {{
      display: flex; gap: 0.5rem; flex-wrap: wrap;
      justify-content: center; margin-bottom: 1.5rem;
    }}
    .filter-btn {{
      background: #0f2840; border: 1px solid #1e3a5f;
      border-radius: 6px; color: #7ab; padding: 0.3rem 0.8rem;
      font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
    }}
    .filter-btn.active, .filter-btn:hover {{
      background: #00ffcc; border-color: #00ffcc;
      color: #0b1a2a; font-weight: bold;
    }}
    .job-card {{
      background: #0f2840; border: 1px solid #1e3a5f;
      border-radius: 10px; padding: 1rem 1.25rem;
      margin-bottom: 0.75rem; transition: border-color 0.2s;
    }}
    .job-card:hover {{ border-color: #00ffcc; }}
    .job-header {{
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;
    }}
    .job-title {{ font-weight: bold; font-size: 1rem; color: #e0f0ff; }}
    .job-type {{
      font-size: 0.7rem; padding: 0.15rem 0.5rem;
      border-radius: 4px; white-space: nowrap; flex-shrink: 0;
    }}
    .job-type.ft {{ background: #00443a; color: #00ffcc; }}
    .job-type.pt {{ background: #2a1a00; color: #ffaa00; }}
    .job-company {{ color: #7ab; font-size: 0.85rem; margin-bottom: 0.4rem; }}
    .job-meta {{
      font-size: 0.78rem; color: #456; display: flex;
      flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.6rem;
    }}
    .salary {{ color: #00cc88; font-weight: bold; }}
    .source {{ color: #334; font-size: 0.7rem; }}
    .apply-btn {{
      display: inline-block; background: #00ffcc; color: #0b1a2a;
      padding: 0.3rem 1rem; border-radius: 6px; font-size: 0.8rem;
      font-weight: bold; text-decoration: none; transition: opacity 0.2s;
    }}
    .apply-btn:hover {{ opacity: 0.85; }}
    .no-jobs {{ text-align: center; color: #456; padding: 3rem; }}
    .updated {{
      text-align: center; font-size: 0.75rem;
      color: #456; margin-top: 2rem;
    }}
    #job-list {{ }}
  </style>
</head>
<body>
<div class="container">
  <h1>🔍 IT For Me</h1>
  <p class="subtitle">IT jobs within 5 miles of ZIP 90029 · Auto-updated twice daily</p>

  <div class="stats">
    <div class="stat">
      <div class="val">{count}</div>
      <div class="lbl">Jobs Found</div>
    </div>
    <div class="stat">
      <div class="val">5mi</div>
      <div class="lbl">Radius</div>
    </div>
    <div class="stat">
      <div class="val">90029</div>
      <div class="lbl">ZIP Code</div>
    </div>
  </div>

  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterJobs('all')">All</button>
    <button class="filter-btn" onclick="filterJobs('full')">Full-time</button>
    <button class="filter-btn" onclick="filterJobs('part')">Part-time</button>
    <button class="filter-btn" onclick="filterJobs('usajobs')">USAJobs</button>
    <button class="filter-btn" onclick="filterJobs('google')">Google Jobs</button>
  </div>

  <div id="job-list">
    {cards_html}
  </div>

  <p class="updated">Last updated: {updated} · Runs at 06:00 + 18:00 UTC daily</p>
</div>

<script>
function filterJobs(type) {{
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  document.querySelectorAll('.job-card').forEach(card => {{
    const typeEl  = card.querySelector('.job-type');
    const srcEl   = card.querySelector('.source');
    const jobType = typeEl ? typeEl.textContent.toLowerCase() : '';
    const src     = srcEl  ? srcEl.textContent.toLowerCase()  : '';

    let show = true;
    if (type === 'full')     show = jobType.includes('full');
    if (type === 'part')     show = jobType.includes('part');
    if (type === 'usajobs')  show = src.includes('usajobs');
    if (type === 'google')   show = src.includes('google');

    card.style.display = show ? 'block' : 'none';
  }});
}}
</script>
</body>
</html>"""

    with open("index.html", "w") as f:
        f.write(html)

    print(f"index.html updated: {count} jobs rendered")


if __name__ == "__main__":
    main()

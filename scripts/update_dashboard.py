"""
update_dashboard.py
Generates a legacy static HTML notice page from jobs.json.
"""

import json


def main():
    try:
        with open("jobs.json", encoding="utf-8") as file_handle:
            data = json.load(file_handle)
    except Exception as error:
        print(f"ERROR: cannot read jobs.json: {error}")
        return

    count = data.get("count", 0)
    updated = data.get("updated", "")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>it-for-me - Legacy Static Snapshot</title>
  <style>
    body {{
      margin: 0;
      font-family: Arial, sans-serif;
      background: #0b1320;
      color: #e5edf8;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }}
    .card {{
      max-width: 720px;
      border: 1px solid #263348;
      border-radius: 24px;
      background: #121d2e;
      padding: 32px;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
    }}
    h1 {{
      margin: 0 0 12px;
      font-size: 32px;
    }}
    p {{
      line-height: 1.7;
      color: #b7c5d8;
    }}
    .meta {{
      margin-top: 24px;
      padding: 16px;
      border-radius: 16px;
      background: #0f1724;
      border: 1px solid #223047;
    }}
    code {{
      color: #f8fafc;
      font-weight: 700;
    }}
  </style>
</head>
<body>
  <main class="card">
    <p>Legacy static snapshot</p>
    <h1>it-for-me now runs as a Next.js portfolio application.</h1>
    <p>
      This legacy HTML file is kept only as a historical reference. The active experience now
      lives in the Next.js application shell with Supabase-backed data and application tracking.
    </p>
    <div class="meta">
      <p><strong>Jobs in the last legacy feed:</strong> {count}</p>
      <p><strong>Last legacy update:</strong> {updated}</p>
      <p><strong>Recommended entry point:</strong> <code>npm run dev</code> then open <code>http://localhost:3001</code></p>
    </div>
  </main>
</body>
</html>
"""

    with open("index.html", "w", encoding="utf-8") as file_handle:
      file_handle.write(html)

    print("index.html updated with the legacy static notice page")


if __name__ == "__main__":
    main()

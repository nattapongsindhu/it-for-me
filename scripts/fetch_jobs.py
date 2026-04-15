"""
fetch_jobs.py
Fetches IT jobs near zip code 90029 within 5 miles
Sources: USAJobs API + Jobs Search API (RapidAPI)
"""
import urllib.request, urllib.parse, json, os, sys, datetime

ZIP_CODE  = "90029"
RADIUS_MI = 5
LOCATION  = "Los Angeles, CA"

USAJOBS_KEYWORDS = [
    "IT", "information technology", "cybersecurity",
    "network administrator", "helpdesk", "systems administrator",
    "technical support", "healthcare IT", "health informatics", "IT support"
]

JOBS_SEARCH_KEYWORDS = ["IT support", "cybersecurity"]  # limit = 2 req × 2 runs = 4/day = 120/month


def fetch_usajobs() -> list:
    """Fetch federal IT jobs near 90029 — free, no quota"""
    key = os.environ.get("USAJOBS_KEY", "")
    if not key:
        print("USAJOBS_KEY not set, skipping", file=sys.stderr)
        return []

    jobs = []
    for kw in USAJOBS_KEYWORDS:
        try:
            params = urllib.parse.urlencode({
                "Keyword":        kw,
                "LocationName":   ZIP_CODE,
                "Radius":         str(RADIUS_MI),
                "ResultsPerPage": 25,
                "Fields":         "Min"
            })
            url = f"https://data.usajobs.gov/api/search?{params}"
            req = urllib.request.Request(url, headers={
                "Host":              "data.usajobs.gov",
                "User-Agent":        "nattapongsindhu@gmail.com",
                "Authorization-Key": key
            })
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())

            for item in data.get("SearchResult", {}).get("SearchResultItems", []):
                pos = item.get("MatchedObjectDescriptor", {})
                jobs.append({
                    "title":    pos.get("PositionTitle", ""),
                    "company":  pos.get("OrganizationName", ""),
                    "location": pos.get("PositionLocationDisplay", ""),
                    "url":      pos.get("PositionURI", ""),
                    "salary":   pos.get("PositionRemuneration", [{}])[0].get("MinimumRange", ""),
                    "posted":   pos.get("PublicationStartDate", "")[:10],
                    "source":   "USAJobs",
                    "type":     pos.get("PositionSchedule", [{}])[0].get("Name", "")
                })
        except Exception as e:
            print(f"USAJobs error for '{kw}': {e}", file=sys.stderr)

    return jobs


def fetch_jobs_search_api() -> list:
    """
    Fetch jobs via Jobs Search API (RapidAPI)
    POST https://jobs-search-api.p.rapidapi.com/getjobs_excel
    Free tier: 100 req/month → use 2 keywords × 2 runs/day = ~120/month (tight)
    """
    key = os.environ.get("JOBS_SEARCH_API", "")
    if not key:
        print("JOBS_SEARCH_API not set, skipping Jobs Search API", file=sys.stderr)
        return []

    jobs = []
    for kw in JOBS_SEARCH_KEYWORDS:
        try:
            body = json.dumps({
                "search_term":    kw,
                "location":       LOCATION,
                "results_wanted": 10,
                "site_name":      ["indeed", "linkedin", "glassdoor"],
                "distance":       RADIUS_MI,
                "job_type":       "fulltime",
                "hours_old":      72
            }).encode("utf-8")

            url = "https://jobs-search-api.p.rapidapi.com/getjobs_excel"
            req = urllib.request.Request(url, data=body, method="POST", headers={
                "Content-Type":    "application/json",
                "X-RapidAPI-Key":  key,
                "X-RapidAPI-Host": "jobs-search-api.p.rapidapi.com"
            })

            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.loads(r.read())

            for job in data.get("jobs", []):
                jobs.append({
                    "title":    job.get("title", ""),
                    "company":  job.get("company", ""),
                    "location": job.get("location", ""),
                    "url":      job.get("job_url", ""),
                    "salary":   job.get("compensation", "") or "",
                    "posted":   job.get("date_posted", "")[:10] if job.get("date_posted") else "",
                    "source":   "Jobs Search API",
                    "type":     job.get("job_type", "") or ""
                })

        except Exception as e:
            print(f"Jobs Search API error for '{kw}': {e}", file=sys.stderr)

    return jobs


def dedupe(jobs: list) -> list:
    seen  = set()
    clean = []
    for j in jobs:
        key = (j["title"].lower().strip(), j["company"].lower().strip())
        if key not in seen and j["title"]:
            seen.add(key)
            clean.append(j)
    return clean


def main():
    now  = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    jobs  = fetch_usajobs()
    jobs += fetch_jobs_search_api()
    jobs  = dedupe(jobs)
    jobs.sort(key=lambda x: x.get("posted", ""), reverse=True)

    result = {
        "updated":   now,
        "zip":       ZIP_CODE,
        "radius_mi": RADIUS_MI,
        "count":     len(jobs),
        "jobs":      jobs
    }

    with open("jobs.json", "w") as f:
        json.dump(result, f, indent=2)

    print(f"jobs.json: {len(jobs)} jobs found near {ZIP_CODE} within {RADIUS_MI} miles")


if __name__ == "__main__":
    main()

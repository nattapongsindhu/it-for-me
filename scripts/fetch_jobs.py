"""
fetch_jobs.py
Fetches IT jobs near zip code 90029 within 5 miles
Sources: USAJobs API + FlyByAPIs (Google Jobs)
Saves results to jobs.json
"""
import urllib.request, urllib.parse, json, os, sys, datetime

ZIP_CODE  = "90029"
RADIUS_MI = 5
KEYWORDS  = [
    "IT", "information technology", "cybersecurity", "network",
    "helpdesk", "help desk", "systems administrator", "sysadmin",
    "technical support", "IT support", "healthcare IT", "health informatics"
]

def fetch_usajobs() -> list:
    """Fetch federal IT jobs near 90029 — free, requires free API key"""
    key = os.environ.get("USAJOBS_KEY", "")
    if not key:
        print("USAJOBS_KEY not set, skipping USAJobs")
        return []

    jobs = []
    for kw in KEYWORDS[:3]:  # limit to avoid rate limit
        try:
            params = urllib.parse.urlencode({
                "Keyword":       kw,
                "LocationName":  ZIP_CODE,
                "Radius":        str(RADIUS_MI),
                "ResultsPerPage": 10,
                "Fields":        "Min"
            })
            url = f"https://data.usajobs.gov/api/search?{params}"
            req = urllib.request.Request(url, headers={
                "Host":            "data.usajobs.gov",
                "User-Agent":      "nattapongsindhu@gmail.com",
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


def fetch_flyby() -> list:
    """Fetch IT jobs via FlyByAPIs (Google Jobs) — 200 free req/month"""
    key = os.environ.get("FLYBY_KEY", "")
    if not key:
        print("FLYBY_KEY not set, skipping FlyByAPIs")
        return []

    jobs = []
    for kw in ["IT support", "cybersecurity", "helpdesk", "systems administrator"]:
        try:
            params = urllib.parse.urlencode({
                "query":       f"{kw} near {ZIP_CODE}",
                "location":    f"zip:{ZIP_CODE}",
                "distance":    str(RADIUS_MI),
                "employment_types": "PART_TIMER,FULLTIME",
                "date_posted": "week"
            })
            url = f"https://jobs-search-api.p.rapidapi.com/getjobs?{params}"
            req = urllib.request.Request(url, headers={
                "X-RapidAPI-Key":  key,
                "X-RapidAPI-Host": "jobs-search-api.p.rapidapi.com"
            })
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())

            for job in data.get("jobs", []):
                jobs.append({
                    "title":    job.get("job_title", ""),
                    "company":  job.get("employer_name", ""),
                    "location": job.get("job_city", "") + ", " + job.get("job_state", ""),
                    "url":      job.get("job_apply_link", ""),
                    "salary":   job.get("job_salary", ""),
                    "posted":   job.get("job_posted_at_datetime_utc", "")[:10],
                    "source":   "Google Jobs",
                    "type":     job.get("job_employment_type", "")
                })
        except Exception as e:
            print(f"FlyByAPIs error for '{kw}': {e}", file=sys.stderr)

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
    jobs = []

    jobs += fetch_usajobs()
    jobs += fetch_flyby()
    jobs  = dedupe(jobs)

    # sort by posted date descending
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

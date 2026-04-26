"""
fetch_jobs.py
Fetch IT jobs near ZIP code 90029 within 5 miles.
Sources: USAJobs API and Jobs Search API (RapidAPI)
"""

import datetime
import json
import os
import sys
import urllib.parse
import urllib.request

ZIP_CODE = "90029"
RADIUS_MI = 5
LOCATION = "Los Angeles, CA"

USAJOBS_KEYWORDS = [
    "IT",
    "information technology",
    "cybersecurity",
    "network administrator",
    "helpdesk",
    "systems administrator",
    "technical support",
    "healthcare IT",
    "health informatics",
    "IT support",
]

JOBS_SEARCH_KEYWORDS = [
    "IT support",
    "cybersecurity",
]  # 2 requests x 2 runs = 4 per day = 120 per month


def fetch_usajobs() -> list:
    """Fetch federal IT jobs near 90029 with no quota cost."""
    key = os.environ.get("USAJOBS_KEY", "")
    if not key:
        print("USAJOBS_KEY not set, skipping", file=sys.stderr)
        return []

    jobs = []
    for keyword in USAJOBS_KEYWORDS:
        try:
            params = urllib.parse.urlencode(
                {
                    "Keyword": keyword,
                    "LocationName": ZIP_CODE,
                    "Radius": str(RADIUS_MI),
                    "ResultsPerPage": 25,
                    "Fields": "Min",
                }
            )
            url = f"https://data.usajobs.gov/api/search?{params}"
            request = urllib.request.Request(
                url,
                headers={
                    "Host": "data.usajobs.gov",
                    "User-Agent": "nattapongsindhu@gmail.com",
                    "Authorization-Key": key,
                },
            )
            with urllib.request.urlopen(request, timeout=10) as response:
                data = json.loads(response.read())

            for item in data.get("SearchResult", {}).get("SearchResultItems", []):
                position = item.get("MatchedObjectDescriptor", {})
                jobs.append(
                    {
                        "title": position.get("PositionTitle", ""),
                        "company": position.get("OrganizationName", ""),
                        "location": position.get("PositionLocationDisplay", ""),
                        "url": position.get("PositionURI", ""),
                        "salary": position.get("PositionRemuneration", [{}])[0].get(
                            "MinimumRange", ""
                        ),
                        "posted": position.get("PublicationStartDate", "")[:10],
                        "source": "USAJobs",
                        "type": position.get("PositionSchedule", [{}])[0].get("Name", ""),
                    }
                )
        except Exception as error:
            print(f"USAJobs error for '{keyword}': {error}", file=sys.stderr)

    return jobs


def fetch_jobs_search_api() -> list:
    """
    Fetch jobs via Jobs Search API (RapidAPI).
    POST https://jobs-search-api.p.rapidapi.com/getjobs_excel
    Free tier: 100 requests per month.
    2 keywords x 1 run per day x 30 days = 60 requests per month.
    """
    key = os.environ.get("JOBS_SEARCH_API", "")
    if not key:
        print("JOBS_SEARCH_API not set, skipping Jobs Search API", file=sys.stderr)
        return []

    current_hour = datetime.datetime.utcnow().hour
    if current_hour != 6:
        print(
            f"Jobs Search API skipped because the current UTC hour is {current_hour}. "
            "This script only runs at 06:00 UTC."
        )
        return []

    jobs = []
    for keyword in JOBS_SEARCH_KEYWORDS:
        try:
            body = json.dumps(
                {
                    "search_term": keyword,
                    "location": LOCATION,
                    "results_wanted": 10,
                    "site_name": ["indeed", "linkedin", "glassdoor"],
                    "distance": RADIUS_MI,
                    "job_type": "fulltime",
                    "hours_old": 72,
                }
            ).encode("utf-8")

            url = "https://jobs-search-api.p.rapidapi.com/getjobs_excel"
            request = urllib.request.Request(
                url,
                data=body,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "X-RapidAPI-Key": key,
                    "X-RapidAPI-Host": "jobs-search-api.p.rapidapi.com",
                },
            )

            with urllib.request.urlopen(request, timeout=15) as response:
                data = json.loads(response.read())

            for job in data.get("jobs", []):
                jobs.append(
                    {
                        "title": job.get("title", ""),
                        "company": job.get("company", ""),
                        "location": job.get("location", ""),
                        "url": job.get("job_url", ""),
                        "salary": job.get("compensation", "") or "",
                        "posted": job.get("date_posted", "")[:10]
                        if job.get("date_posted")
                        else "",
                        "source": "Jobs Search API",
                        "type": job.get("job_type", "") or "",
                    }
                )
        except Exception as error:
            print(f"Jobs Search API error for '{keyword}': {error}", file=sys.stderr)

    return jobs


def dedupe(jobs: list) -> list:
    seen = set()
    clean = []
    for job in jobs:
        key = (job["title"].lower().strip(), job["company"].lower().strip())
        if key not in seen and job["title"]:
            seen.add(key)
            clean.append(job)
    return clean


def main():
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    jobs = fetch_usajobs()
    jobs += fetch_jobs_search_api()
    jobs = dedupe(jobs)
    jobs.sort(key=lambda job: job.get("posted", ""), reverse=True)

    result = {
        "updated": now,
        "zip": ZIP_CODE,
        "radius_mi": RADIUS_MI,
        "count": len(jobs),
        "jobs": jobs,
    }

    with open("jobs.json", "w", encoding="utf-8") as file_handle:
        json.dump(result, file_handle, indent=2)

    print(f"jobs.json: {len(jobs)} jobs found near {ZIP_CODE} within {RADIUS_MI} miles")


if __name__ == "__main__":
    main()

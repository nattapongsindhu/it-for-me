"""
fetch_hospital_jobs.py
Fetch direct hospital career listings for the Phase 5 hospital-careers lane.

The script writes a separate hospital_jobs.json snapshot so the legacy USAJobs
feed stays isolated until the Supabase sync step is ready.
"""

import datetime
from html.parser import HTMLParser
import json
import re
import sys
import time
import urllib.parse
import urllib.request

TRACK_SLUG = "hospital-careers"
SOURCE = "Hospital_Direct"
REQUEST_DELAY_SECONDS = 1.0
HOURS_PER_YEAR = 2080

KAISER_URLS = [
    "https://www.kaiserpermanentejobs.org/category/information-technology-jobs/641/11210/1",
    "https://www.kaiserpermanentejobs.org/category/clinical-technology-jobs/641/41909/1",
]

HUNTINGTON_URL = "https://www.hhcareers.com/career-search"

GENERIC_LINK_SOURCES = [
    {
        "company": "Cedars-Sinai",
        "hospital_name": "Cedars-Sinai",
        "location": "Los Angeles, CA",
        "urls": [
            "https://careers.cshs.org/choose-your-area-of-interest-information-technology",
            "https://careers.cshs.org/search-jobs",
        ],
        "job_path": "/job/",
    },
    {
        "company": "UCLA Health",
        "hospital_name": "UCLA Health",
        "location": "Los Angeles, CA",
        "urls": [
            "https://www.uclahealthcareers.org/job-search-results/?primary_category%5B%5D=Information+Technology",
            "https://www.uclahealthcareers.org/career-areas/information-careers/",
            "https://www.uclahealthcareers.org/non-clinical-careers/",
        ],
        "job_path": "/job/",
    },
    {
        "company": "Keck Medicine of USC",
        "hospital_name": "Keck Medicine of USC",
        "location": "Los Angeles, CA",
        "urls": [
            "https://www.keckmedicine.org/keck-medicine-careers-information/",
        ],
        "job_path": "/job/",
    },
    {
        "company": "Children's Hospital Los Angeles",
        "hospital_name": "Children's Hospital Los Angeles",
        "location": "Los Angeles, CA",
        "urls": [
            "https://www.chla.org/careers",
        ],
        "job_path": "/careers/jobs/",
    },
    {
        "company": "Providence Saint Joseph Medical Center",
        "hospital_name": "Providence Saint Joseph Medical Center",
        "location": "Burbank, CA",
        "urls": [
            "https://providence-burbank.jobs/",
        ],
        "job_path": "/job/",
    },
]

COMMONSPIRIT_JOB_URLS = [
    "https://www.commonspirit.careers/en/job/glendale/maintenance-mechanic-i/35300/88427204080",
    "https://www.commonspirit.careers/job/glendale/maintenance-mechanic-ii/35300/88427204336",
    "https://www.commonspirit.careers/job/glendale/maintenance-mechanic-iii/35300/89557141872",
    "https://www.commonspirit.careers/job/glendale/instrument-tech/35300/93728030752",
    "https://www.commonspirit.careers/job/glendale/central-service-tech-i/35300/91601441424",
]

TARGET_KEYWORDS = [
    "application specialist",
    "applications specialist",
    "bmet",
    "biomedical",
    "biomedical equipment",
    "clinical technology",
    "clinical systems",
    "desktop",
    "electrical",
    "electronics",
    "endpoint",
    "epic",
    "facilities",
    "field technician",
    "help desk",
    "imaging",
    "informatics",
    "information technology",
    "it support",
    "kphc",
    "maintenance",
    "medical equipment",
    "network",
    "radiant",
    "security systems",
    "sterile processing",
    "systems administrator",
    "technician",
    "technologist",
]

KAISER_LOCATION_KEYWORDS = [
    "los angeles",
    "pasadena",
    "sunset",
    "west los angeles",
]

HUNTINGTON_CATEGORIES = {
    "Clerical",
    "Laboratory",
    "Nursing",
    "Pharmacy",
    "Professional / Managerial",
    "Rehabilitation",
    "Respiratory",
    "Service / Maintenance",
    "Technical",
}

HUNTINGTON_INCLUDED_CATEGORIES = {
    "Service / Maintenance",
    "Technical",
}

HUNTINGTON_LOCATIONS = {"Pasadena", "San Marino"}

HUNTINGTON_SERVICE_KEYWORDS = [
    "electrical",
    "engineer",
    "facilities",
    "maintenance",
    "mechanic",
    "painter",
    "plumber",
    "stationary engineer",
]

HUNTINGTON_TECH_KEYWORDS = [
    "anesthesia technologist",
    "biomedical",
    "clinical technology",
    "equipment",
    "nuclear medicine tech",
]

EXCLUDED_TITLE_KEYWORDS = [
    "registered nurse",
    "rn ",
    "physician",
    "dietitian",
    "food service",
    "environmental service",
    "security officer",
]


class LinkAndTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.events = []
        self.links = []
        self._link_href = None
        self._link_text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            attrs_map = dict(attrs)
            self._link_href = attrs_map.get("href")
            self._link_text = []

    def handle_data(self, data):
        text = normalize_space(data)
        if not text:
            return

        self.events.append({"kind": "text", "text": text})

        if self._link_href is not None:
            self._link_text.append(text)

    def handle_endtag(self, tag):
        if tag.lower() != "a" or self._link_href is None:
            return

        text = normalize_space(" ".join(self._link_text))
        if text:
            link = {"kind": "link", "text": text, "href": self._link_href}
            self.events.append(link)
            self.links.append(link)

        self._link_href = None
        self._link_text = []


def normalize_space(value):
    return re.sub(r"\s+", " ", value or "").strip()


def normalize_salary(value):
    numbers = [
        float(item.replace(",", ""))
        for item in re.findall(r"\d[\d,]*(?:\.\d+)?", value or "")
    ]
    numbers = [item for item in numbers if item > 0]

    if not numbers:
        return {"salary_annual": None, "salary_hourly": None}

    midpoint = sum(numbers) / len(numbers)
    normalized = value.lower()
    is_hourly = (
        "hour" in normalized
        or "/hr" in normalized
        or "per hr" in normalized
        or max(numbers) <= 300
    )

    if is_hourly:
        return {
            "salary_annual": round(midpoint * HOURS_PER_YEAR, 2),
            "salary_hourly": round(midpoint, 2),
        }

    return {
        "salary_annual": round(midpoint, 2),
        "salary_hourly": round(midpoint / HOURS_PER_YEAR, 2),
    }


def absolute_url(base_url, href):
    return urllib.parse.urljoin(base_url, href)


def fetch_html(url):
    time.sleep(REQUEST_DELAY_SECONDS)
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "it-for-me phase5 hospital job scanner",
            "Accept": "text/html,application/xhtml+xml",
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_html(html):
    parser = LinkAndTextParser()
    parser.feed(html)
    return parser


def keyword_match(job):
    haystack = " ".join(
        [
            job.get("title", ""),
            job.get("company", ""),
            job.get("location", ""),
            job.get("match_reason", ""),
            job.get("type", ""),
        ]
    ).lower()
    return [keyword for keyword in TARGET_KEYWORDS if keyword in haystack]


def is_excluded_title(title):
    haystack = f"{title} ".lower()
    return any(keyword in haystack for keyword in EXCLUDED_TITLE_KEYWORDS)


def huntington_match(job):
    title = job.get("title", "").lower()

    if job["type"] == "Service / Maintenance":
        return [keyword for keyword in HUNTINGTON_SERVICE_KEYWORDS if keyword in title]

    if job["type"] not in HUNTINGTON_INCLUDED_CATEGORIES:
        return []

    return [keyword for keyword in HUNTINGTON_TECH_KEYWORDS if keyword in title]


def kaiser_location_match(job):
    haystack = f"{job.get('title', '')} {job.get('location', '')}".lower()
    return any(keyword in haystack for keyword in KAISER_LOCATION_KEYWORDS)


def make_source_key(hospital_name, url, title):
    raw = f"{SOURCE}::{hospital_name}::{url or title}".lower()
    return normalize_space(raw)


def build_job(title, company, hospital_name, location, url, job_type, match_reason):
    title = normalize_space(title).rstrip(",")
    return {
        "title": title,
        "company": company,
        "hospital_name": hospital_name,
        "location": location,
        "url": url,
        "salary": "",
        "salary_annual": None,
        "salary_hourly": None,
        "posted": "",
        "source": SOURCE,
        "source_key": make_source_key(hospital_name, url, title),
        "track_slug": TRACK_SLUG,
        "type": job_type or "Open",
        "match_reason": match_reason,
    }


def parse_kaiser_link(base_url, link):
    text = normalize_space(link["text"])
    if "/job/" not in link.get("href", ""):
        return None

    match = re.match(
        r"(?P<title>.+?)\s+(?P<city>[A-Za-z][A-Za-z .'-]+),\s*(?P<state>[A-Z]{2})(?:,\s*(?P<tail>.*))?$",
        text,
    )
    if not match:
        return None

    tail_parts = [
        normalize_space(part)
        for part in (match.group("tail") or "").split(",")
        if normalize_space(part)
    ]
    job_type = ", ".join(tail_parts[:3])
    url = absolute_url(base_url, link["href"])

    return build_job(
        title=match.group("title"),
        company="Kaiser Permanente",
        hospital_name="Kaiser Permanente",
        location=f"{normalize_space(match.group('city'))}, {match.group('state')}",
        url=url,
        job_type=job_type or "Open",
        match_reason="Direct Kaiser career listing.",
    )


def fetch_kaiser_jobs():
    jobs = []

    for url in KAISER_URLS:
        try:
            parser = parse_html(fetch_html(url))
        except Exception as error:
            print(f"Kaiser fetch error for {url}: {error}", file=sys.stderr)
            continue

        for link in parser.links:
            job = parse_kaiser_link(url, link)
            if not job:
                continue

            matches = keyword_match(job)
            if not matches or not kaiser_location_match(job):
                continue

            job["match_reason"] = f"Kaiser direct match: {', '.join(matches[:3])}"
            jobs.append(job)

    return jobs


def event_texts(events):
    return [(index, event["text"]) for index, event in enumerate(events) if event["kind"] == "text"]


def find_next_apply_url(events, start_index):
    for event in events[start_index:]:
        if event["kind"] == "link" and event["text"].lower() == "apply now":
            return absolute_url(HUNTINGTON_URL, event["href"])

    return HUNTINGTON_URL


def parse_huntington_jobs_from_events(events):
    text_items = event_texts(events)
    start = 0

    for index, text in text_items:
        if text.startswith("Showing ") and "matching roles" in text:
            start = index
            break

    jobs = []
    for item_number, (event_index, text) in enumerate(text_items):
        if event_index <= start or text not in HUNTINGTON_CATEGORIES or item_number == 0:
            continue

        title = text_items[item_number - 1][1]
        if title in HUNTINGTON_CATEGORIES or title.lower() in {"reset", "category"}:
            continue

        description_parts = []
        location = "Pasadena, CA"
        for _, next_text in text_items[item_number + 1 :]:
            if next_text in HUNTINGTON_LOCATIONS:
                location = f"{next_text}, CA"
                break
            if next_text in HUNTINGTON_CATEGORIES:
                break
            description_parts.append(next_text)

        summary = normalize_space(" ".join(description_parts))
        url = find_next_apply_url(events, event_index)
        job = {
            "title": normalize_space(title),
            "company": "Huntington Health",
            "hospital_name": "Huntington Health",
            "location": location,
            "url": url,
            "salary": "",
            "posted": "",
            "source": SOURCE,
            "source_key": make_source_key("Huntington Health", url, title),
            "track_slug": TRACK_SLUG,
            "type": text,
            "match_reason": summary[:220],
        }

        matches = huntington_match(job)
        if matches:
            job["match_reason"] = f"Huntington direct match: {', '.join(matches[:3])}"
            jobs.append(job)

    return jobs


def fetch_huntington_jobs():
    try:
        parser = parse_html(fetch_html(HUNTINGTON_URL))
    except Exception as error:
        print(f"Huntington fetch error: {error}", file=sys.stderr)
        return []

    return parse_huntington_jobs_from_events(parser.events)


def parse_generic_link_source(source):
    jobs = []

    for source_url in source["urls"]:
        try:
            parser = parse_html(fetch_html(source_url))
        except Exception as error:
            print(
                f"{source['hospital_name']} fetch error for {source_url}: {error}",
                file=sys.stderr,
            )
            continue

        for link in parser.links:
            href = link.get("href", "")
            title = normalize_space(link.get("text", ""))

            if source["job_path"] not in href or not title or is_excluded_title(title):
                continue

            url = absolute_url(source_url, href)
            job = build_job(
                title=title,
                company=source["company"],
                hospital_name=source["hospital_name"],
                location=source["location"],
                url=url,
                job_type="Open",
                match_reason=f"Direct {source['hospital_name']} career listing.",
            )
            matches = keyword_match(job)

            if not matches:
                continue

            job["match_reason"] = f"{source['hospital_name']} direct match: {', '.join(matches[:3])}"
            jobs.append(job)

    return jobs


def extract_direct_title(parser):
    blocked = {
        "apply",
        "apply now",
        "save for later",
        "about us",
        "our mission",
    }

    for _, text in event_texts(parser.events):
        clean = normalize_space(text)
        if len(clean) < 6 or clean.lower() in blocked:
            continue
        if " at commonspirit health" in clean.lower():
            return clean.split(" at CommonSpirit Health")[0].strip()
        if any(keyword in clean.lower() for keyword in TARGET_KEYWORDS):
            return clean

    return ""


def fetch_commonspirit_jobs():
    jobs = []

    for url in COMMONSPIRIT_JOB_URLS:
        try:
            parser = parse_html(fetch_html(url))
        except Exception as error:
            print(f"CommonSpirit fetch error for {url}: {error}", file=sys.stderr)
            continue

        title = extract_direct_title(parser)
        if not title or is_excluded_title(title):
            continue

        job = build_job(
            title=title,
            company="Dignity Health",
            hospital_name="Glendale Memorial Hospital and Health",
            location="Glendale, CA",
            url=url,
            job_type="Facilities",
            match_reason="Direct CommonSpirit / Dignity Health career listing.",
        )
        matches = keyword_match(job)

        if matches:
            job["match_reason"] = f"Dignity Health direct match: {', '.join(matches[:3])}"
            jobs.append(job)

    return jobs


def dedupe(jobs):
    seen = set()
    clean = []

    for job in jobs:
        key = job["source_key"]
        if key in seen:
            continue

        seen.add(key)
        clean.append(job)

    return clean


def main():
    now = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    jobs = fetch_kaiser_jobs()
    jobs += fetch_huntington_jobs()
    jobs += fetch_commonspirit_jobs()
    for source in GENERIC_LINK_SOURCES:
        jobs += parse_generic_link_source(source)
    jobs = dedupe(jobs)
    for job in jobs:
        job.update(normalize_salary(job.get("salary", "")))
    jobs.sort(key=lambda job: (job["hospital_name"], job["title"]))

    result = {
        "updated": now,
        "count": len(jobs),
        "sources": sorted({job["hospital_name"] for job in jobs}),
        "track_slug": TRACK_SLUG,
        "jobs": jobs,
    }

    with open("hospital_jobs.json", "w", encoding="utf-8") as file_handle:
        json.dump(result, file_handle, indent=2)

    print(f"hospital_jobs.json: {len(jobs)} direct hospital jobs found")


if __name__ == "__main__":
    main()

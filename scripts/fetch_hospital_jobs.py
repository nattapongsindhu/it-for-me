"""
fetch_hospital_jobs.py
Fetch direct hospital career listings for the Phase 5 hospital-careers lane.

Step 5.2.1 covers Kaiser Permanente and Huntington Health only. The script
writes a separate hospital_jobs.json snapshot so the legacy USAJobs feed stays
isolated until the Supabase sync step is ready.
"""

import datetime
from html.parser import HTMLParser
import json
import re
import sys
import urllib.parse
import urllib.request

TRACK_SLUG = "hospital-careers"
SOURCE = "Hospital_Direct"

KAISER_URLS = [
    "https://www.kaiserpermanentejobs.org/category/information-technology-jobs/641/11210/1",
    "https://www.kaiserpermanentejobs.org/category/clinical-technology-jobs/641/41909/1",
]

HUNTINGTON_URL = "https://www.hhcareers.com/career-search"

TARGET_KEYWORDS = [
    "biomedical",
    "clinical technology",
    "clinical systems",
    "desktop",
    "endpoint",
    "epic",
    "facilities",
    "field technician",
    "imaging",
    "information technology",
    "it support",
    "kphc",
    "maintenance",
    "medical equipment",
    "systems administrator",
    "technician",
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


def absolute_url(base_url, href):
    return urllib.parse.urljoin(base_url, href)


def fetch_html(url):
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

    return {
        "title": normalize_space(match.group("title")).rstrip(","),
        "company": "Kaiser Permanente",
        "hospital_name": "Kaiser Permanente",
        "location": f"{normalize_space(match.group('city'))}, {match.group('state')}",
        "url": url,
        "salary": "",
        "posted": "",
        "source": SOURCE,
        "source_key": make_source_key("Kaiser Permanente", url, text),
        "track_slug": TRACK_SLUG,
        "type": job_type or "Open",
        "match_reason": "Direct Kaiser career listing.",
    }


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
    jobs = dedupe(jobs)
    jobs.sort(key=lambda job: (job["hospital_name"], job["title"]))

    result = {
        "updated": now,
        "count": len(jobs),
        "sources": ["Kaiser Permanente", "Huntington Health"],
        "track_slug": TRACK_SLUG,
        "jobs": jobs,
    }

    with open("hospital_jobs.json", "w", encoding="utf-8") as file_handle:
        json.dump(result, file_handle, indent=2)

    print(f"hospital_jobs.json: {len(jobs)} direct hospital jobs found")


if __name__ == "__main__":
    main()

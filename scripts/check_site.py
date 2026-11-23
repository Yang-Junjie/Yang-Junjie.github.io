"""Validate the generated CGLab site."""

from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import quote, unquote, urljoin, urlsplit


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = set()
        self.links = set()
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        attribute = {"a": "href", "img": "src", "link": "href", "script": "src"}.get(tag)
        if values.get(attribute):
            self.links.add(values[attribute])


def check_links(output, base_url):
    base = urlsplit(base_url)
    pages = {path: Page(path) for path in sorted(output.rglob("*.html"))}
    errors = []
    for path, page in pages.items():
        relative = path.relative_to(output)
        page_url = urljoin(base_url, quote(relative.as_posix()))
        for link in sorted(page.links):
            target = urlsplit(urljoin(page_url, link))
            if (target.scheme, target.netloc) != (base.scheme, base.netloc):
                continue
            if not target.path.startswith(base.path):
                errors.append(f"{relative}: {link} escapes the site base path")
                continue
            destination = output / unquote(target.path[len(base.path):])
            if destination.is_dir():
                destination /= "index.html"
            if not destination.is_file():
                errors.append(f"{relative}: missing target {link}")
            elif target.fragment and destination in pages and unquote(target.fragment) not in pages[destination].ids:
                errors.append(f"{relative}: missing anchor {link}")
    if errors:
        raise SystemExit("\n".join(errors))
    return len(pages)


def main():
    output = Path(sys.argv[1]).resolve()
    base_url = sys.argv[2].rstrip("/") + "/"
    if not urlsplit(base_url).netloc or urlsplit(base_url).scheme not in {"http", "https"}:
        raise SystemExit("An absolute HTTP(S) site URL is required.")
    for required in ("index.html", "rss.xml", "sitemap.xml", "profile/index.html"):
        if not (output / required).is_file():
            raise SystemExit(f"Missing build output: {required}")
    pages = check_links(output, base_url)
    print(f"Checked local links in {pages} pages.")


if __name__ == "__main__":
    main()

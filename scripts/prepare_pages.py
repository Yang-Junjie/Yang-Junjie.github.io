"""Prepare legacy routes and validate the generated CGLab site."""

from html import escape
from html.parser import HTMLParser
import json
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


def add_redirect(output, base_url, old_path, new_path):
    if not (output / new_path).is_file():
        raise ValueError(f"Missing redirect target: {new_path}")
    path = output / old_path / "index.html"
    destination = urljoin(base_url, quote(new_path))
    link = escape(destination, quote=True)
    script_url = json.dumps(destination)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8") as file:
        file.write(f"""<!DOCTYPE html>
<html lang="zh-CN">
<meta charset="utf-8">
<title>页面已迁移 · CGLab</title>
<link rel="canonical" href="{link}">
<meta http-equiv="refresh" content="0; url={link}">
<script>location.replace({script_url} + location.search + location.hash);</script>
<p><a href="{link}">前往新页面</a></p>
</html>
""")


def add_legacy_routes(output, base_url):
    articles = sorted((output / "posts").rglob("*.html"))
    for article in articles:
        relative = article.relative_to(output)
        old_path = relative.with_suffix("").as_posix().lower()
        add_redirect(output, base_url, old_path, relative.as_posix())
    add_redirect(output, base_url, "archive", "archives/index.html")
    add_redirect(output, base_url, "about", "pages/about.html")
    return len(articles) + 2


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
    redirects = add_legacy_routes(output, base_url)
    pages = check_links(output, base_url)
    print(f"Checked local links in {pages} pages, including {redirects} legacy redirects.")


if __name__ == "__main__":
    main()

"""URL scraper — extracts text and image URLs from web pages."""

import logging
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from app.models.schemas import ScrapedContent

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    ),
}

_STRIP_TAGS = ["script", "style", "nav", "footer", "header", "aside", "noscript"]


async def scrape_url(url: str) -> ScrapedContent:
    """Fetch a URL and extract its readable text and image URLs."""
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(url, headers=_HEADERS)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Remove noise elements
    for tag in soup(_STRIP_TAGS):
        tag.decompose()

    # Extract text
    text = soup.get_text(separator="\n", strip=True)

    # Extract images — resolve relative URLs
    images: list[str] = []
    for img in soup.find_all("img", src=True):
        src = img["src"]
        if not src.startswith(("data:", "javascript:")):
            images.append(urljoin(url, src))

    title = soup.title.string.strip() if soup.title and soup.title.string else None

    logger.info("Scraped %s: %d chars, %d images", url, len(text), len(images))
    return ScrapedContent(text=text, images=images, title=title)

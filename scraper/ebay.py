import os
import requests

EBAY_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1"

def parse_condition(title: str) -> str:
    title_lower = title.lower()
    if "psa 10" in title_lower:
        return "PSA 10"
    if "psa 9" in title_lower:
        return "PSA 9"
    if "psa 8" in title_lower:
        return "PSA 8"
    if "bgs" in title_lower or "beckett" in title_lower:
        return "BGS"
    if "cgc" in title_lower:
        return "CGC"
    return "Raw"

def fetch_sold_listings(query: str, max_results: int = 50) -> list[dict]:
    """
    Calls eBay Finding API for completed (sold) listings.
    Returns list of {price, title, condition, end_time}.
    """
    params = {
        "OPERATION-NAME": "findCompletedItems",
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": os.environ["EBAY_APP_ID"],
        "RESPONSE-DATA-FORMAT": "JSON",
        "keywords": query,
        "itemFilter(0).name": "SoldItemsOnly",
        "itemFilter(0).value": "true",
        "paginationInput.entriesPerPage": str(max_results),
        "sortOrder": "EndTimeSoonest",
    }

    resp = requests.get(EBAY_API_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    try:
        items = data["findCompletedItemsResponse"][0]["searchResult"][0].get("item", [])
    except (KeyError, IndexError):
        return []

    results = []
    for item in items:
        try:
            price = float(item["sellingStatus"][0]["currentPrice"][0]["__value__"])
            title = item["title"][0]
            results.append({
                "price": price,
                "title": title,
                "condition": parse_condition(title),
            })
        except (KeyError, IndexError, ValueError):
            continue

    return results

def median_price(prices: list[float]) -> float:
    if not prices:
        return 0.0
    s = sorted(prices)
    mid = len(s) // 2
    return (s[mid - 1] + s[mid]) / 2 if len(s) % 2 == 0 else s[mid]

def filter_outliers(listings: list[dict]) -> list[dict]:
    """Remove sales > 3x or < 0.3x the median price."""
    prices = [l["price"] for l in listings]
    if not prices:
        return listings
    med = median_price(prices)
    return [l for l in listings if 0.3 * med <= l["price"] <= 3 * med]

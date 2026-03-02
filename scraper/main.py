import time
from apscheduler.schedulers.blocking import BlockingScheduler
from db import fetch_all_cards, insert_price
from ebay import fetch_sold_listings, filter_outliers
from indices import recompute_all_indices

def scrape_all_cards():
    print("Starting scrape run...")
    cards = fetch_all_cards()
    print(f"  Scraping {len(cards)} cards")

    for card in cards:
        try:
            listings = fetch_sold_listings(card["ebay_search_query"])
            listings = filter_outliers(listings)

            if not listings:
                print(f"  [{card['name']}] No valid listings found")
                continue

            prices = [l["price"] for l in listings]
            avg_price = sum(prices) / len(prices)
            condition = listings[0]["condition"] if listings else "Raw"

            insert_price(
                card_id=card["id"],
                price=round(avg_price, 2),
                volume=len(listings),
                condition=condition,
            )
            print(f"  [{card['name']}] ${avg_price:.2f} ({len(listings)} sales)")

        except Exception as e:
            print(f"  [{card['name']}] ERROR: {e}")

    recompute_all_indices()
    print("Scrape run complete.")

if __name__ == "__main__":
    # Run once immediately on startup
    scrape_all_cards()

    scheduler = BlockingScheduler()
    scheduler.add_job(scrape_all_cards, "interval", hours=6)
    print("Scheduler started — scraping every 6 hours")
    scheduler.start()

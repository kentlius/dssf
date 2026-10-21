# 🏰 Disney Store Stock Finder

> [!WARNING]
> **In-store stock is unreliable.** The app reads the same inventory data the
> stores use, which is often wrong. Call the store before you travel.

## How it works

`store.disney.co.jp` runs on Salesforce Commerce Cloud (Demandware):

```
GET /ja_JP/Product-Variation?pid=<SKU>&quantity=1
  → availability, price, images, rating, release date, descriptions
  → enableStoreStock is false, but store data still exists

GET /ja_JP/Product-FindInStore?sku=<SKU>
  → store list HTML (9 regions)
  → in stock / out of stock / ask the store
```

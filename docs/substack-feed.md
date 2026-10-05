# Substack articles

Willi Galloway's Substack profile publishes **The Garden Dish** at https://thegardendish.substack.com. The homepage lists the three latest publication articles with their dates and plain-text RSS descriptions, and links readers to individual posts and the publication archive. The navigation also links to the publication. Profile Notes and reposts are not included in the publication RSS feed.

Publication URLs are configured in `src/content/substack.json`. Run `npm run refresh:substack` to fetch the public RSS feed and update `src/content/substack-feed.json`. No credentials are required. The component bundles this snapshot, so visitors do not need a third-party RSS proxy or a browser request to Substack.

The existing GitHub Pages deployment refreshes this snapshot before each build, including its daily scheduled run. It validates publication links and dates, sorts articles newest first, removes duplicates, and keeps the latest three. Substack may reject GitHub-hosted runners with HTTP 403. Deployment uses `npm run refresh:substack -- --allow-cached`: if the live refresh fails, it validates and uses the checked-in snapshot and emits an Actions warning. Existing article dates, content, and snapshot freshness are preserved; the next deployment retries the live feed. A missing or invalid saved snapshot still stops deployment. The default local refresh command remains strict. Local `npm run dev` and `npm run build` use the saved snapshot without network access.

Verify with `npm run test:substack` and `npm run build`.

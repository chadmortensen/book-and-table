# Instagram feed

The home page renders `InstagramFeed` from `src/content/events.mdx`, beneath the founders' letter. The component reads a public static snapshot at `instagram/feed.json`; it never calls Meta or receives credentials. Event Calendar and Substack share a two-column row above an Instagram carousel that starts at the content column’s left edge, extends to the right edge of the desktop viewport, while its heading, Follow Along link and navigation controls align with the content column. The carousel matches the Portfolio site interaction: native swipe and wheel scrolling, mouse dragging, arrow controls, keyboard navigation and reduced-motion support. Desktop cards keep a fixed 45rem width as the window narrows and a consistent 350px image height. Each image column takes its width from the loaded image’s natural aspect ratio, preserving the full image with contain sizing; the caption fills the remaining space (roughly two-thirds for the current portrait images). Cards show the original caption and date on the right without generated titles. Trailing scroll space lets every card, including the last one, snap fully to the content’s left edge. Mobile cards stack the full image above the date, a three-line caption and the Instagram link. Posts link to Instagram, videos use thumbnail images, and carousel posts use their cover image. Captions remain plain text.

The Pages workflow fetches the latest three posts, verifies that the token belongs to `book.and.table`, and downloads preview images before building. This avoids expiring Instagram CDN URLs on the published site. No app secret is needed for this dashboard-token approach.

## Credentials and renewal

Store the long-lived dashboard token only in the repository Actions secret `INSTAGRAM_ACCESS_TOKEN`. Never use a `VITE_` variable, paste it into source, or enable shell tracing or debug HTTP output. GitHub Pages deployment uses GitHub's existing Actions permissions and OIDC; no personal deployment token is needed.

Meta dashboard tokens last 60 days. Generate a replacement and update the Actions secret before expiry (aim for day 50), or immediately if Meta revokes account authorization. Generate replacements in Meta's **API setup with Instagram login**. This implementation does not automatically rotate the secret: doing so would require another credential authorized to write repository Actions secrets. Daily post refreshes do not extend token expiry.

The feed needs `instagram_business_basic` and an authorized professional Instagram account. Messaging, publishing, webhook configuration and Facebook Page linking are not required for this read-only snapshot.

## Refresh and failure behavior

The Pages workflow runs on main pushes, manual dispatch, and daily at 15:23 UTC (8:23 a.m. Pacific during daylight saving time; 7:23 a.m. during standard time). GitHub may delay scheduled jobs. Schedules run from the default branch, and GitHub can disable schedules in inactive public repositories after 60 days. Enable failed-workflow notifications in GitHub.

An API, token or preview-download error fails the workflow before deployment, leaving the currently published site intact. Investigate the failed run, renew credentials if needed, and manually run **Deploy Book & Table to GitHub Pages**. When no local snapshot is present, the component shows a profile link until real posts are fetched. The public snapshot and preview images are generated files excluded from Git.

Run `npm run test:instagram` and `npm run build` locally. To fetch live content, use the Actions workflow so the token stays in GitHub. The temporary `codex/instagram-feed-check` branch runs a verification workflow that produces only public post metadata and image artifacts, without deploying the site.

Sources: [Meta's Instagram Login setup guide](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started), [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

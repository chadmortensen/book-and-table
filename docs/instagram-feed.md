# Instagram feed

The home page renders `InstagramFeed` from `src/content/events.mdx`, beneath the founders' letter. The component reads a public static snapshot at `instagram/feed.json`; it never calls Meta or receives credentials. Event Calendar and Substack share a two-column row above the Instagram carousel. Each full, uncropped image sits above its date, two lines of its original caption, and a Read on Instagram link, all matching the image width. Desktop images share a 350px height and retain their natural aspect ratios. Mobile cards retain the stacked image and text layout within a swipeable carousel. No titles are generated. The carousel stays enabled with the current three posts and renders every post in future snapshots, with native swipe and wheel scrolling, mouse dragging, arrows, keyboard navigation, reduced-motion support, and trailing space so the final post can align at the left edge. It starts at the content column’s left edge and extends to the right of the viewport on desktop, while its heading and controls stay aligned with the content column. Posts link to Instagram, videos use thumbnails, and carousel posts use their cover image. Captions remain plain text.

The Pages workflow fetches the latest three posts, verifies that the token belongs to `book.and.table`, and downloads preview images before building. This avoids expiring Instagram CDN URLs on the published site. No app secret is needed for this dashboard-token approach.

## Credentials and renewal

Store the long-lived dashboard token only in the repository Actions secret `INSTAGRAM_ACCESS_TOKEN`. Never use a `VITE_` variable, paste it into source, or enable shell tracing or debug HTTP output. GitHub Pages deployment uses GitHub's existing Actions permissions and OIDC; no personal deployment token is needed.

Meta dashboard tokens last 60 days. The **Renew Instagram access token** workflow checks weekly and renews once the stored secret is at least 30 days old, leaving at least 23 days before expiry for normal scheduled retries. It validates that both tokens belong to the same `book.and.table` account before saving the returned token. It does not deploy the website. Daily post refreshes alone do not extend token expiry.

To enable renewal:

1. In GitHub **Settings > Developer settings > Personal access tokens > Fine-grained tokens**, create a token named **Book & Table Instagram renewal**. Select resource owner `chadmortensen`, **Only select repositories**, and `book-and-table`. Set **Repository permissions > Secrets** to **Read and write**; leave other permissions unchanged (Metadata read is automatic). Choose an expiration date and record it: this GitHub credential will itself need replacing before that date. A GitHub App is an alternative for longer-term unattended operation.
2. In the repository **Settings > Secrets and variables > Actions**, add **New repository secret** named `INSTAGRAM_SECRET_WRITER` and paste the GitHub token there. Never paste it in chat or source. This permission covers repository Actions secrets; GitHub does not scope it to a single secret.
3. Put `.github/workflows/renew-instagram-token.yml`, `scripts/renew-instagram-token.mjs`, and `tests/instagram-renewal.test.mjs` on the default branch. The workflow uses the existing `INSTAGRAM_ACCESS_TOKEN` and the new writer credential.
4. Once the Instagram secret has been saved for at least 24 hours, open **Actions > Renew Instagram access token > Run workflow**. Confirm success and the updated timestamp for `INSTAGRAM_ACCESS_TOKEN`; do not inspect its value. Manual runs skip tokens saved less than 24 hours ago. Subsequent scheduled checks wait 30 days after each successful save.
5. Enable failed-workflow notifications in your GitHub notification settings. If renewal fails, resolve the authorization or credential issue and rerun the workflow. GitHub can disable scheduled workflows in inactive public repositories after 60 days; check that the schedule remains enabled.

If the Instagram token expires or Meta revokes authorization, generate a replacement in Meta's **API setup with Instagram login**, update `INSTAGRAM_ACCESS_TOKEN`, and wait 24 hours before testing renewal. Expired tokens cannot be refreshed. The script never logs token responses or renewal URLs, masks the returned token, and passes it to GitHub CLI through stdin for encrypted storage.

The feed needs `instagram_business_basic` and an authorized professional Instagram account. Messaging, publishing, webhook configuration and Facebook Page linking are not required for this read-only snapshot.

## Refresh and failure behavior

The Pages workflow runs on main pushes, manual dispatch, and daily at 15:23 UTC (8:23 a.m. Pacific during daylight saving time; 7:23 a.m. during standard time). GitHub may delay scheduled jobs. Schedules run from the default branch, and GitHub can disable schedules in inactive public repositories after 60 days. Enable failed-workflow notifications in GitHub.

An API, token or preview-download error fails the workflow before deployment, leaving the currently published site intact. Investigate the failed run, renew credentials if needed, and manually run **Deploy Book & Table to GitHub Pages**. When no local snapshot is present, the component shows a profile link until real posts are fetched. The public snapshot and preview images are generated files excluded from Git.

Run `npm run test:instagram` and `npm run build` locally. To fetch live content, use the Actions workflow so the token stays in GitHub. The temporary `codex/instagram-feed-check` branch runs a verification workflow that produces only public post metadata and image artifacts, without deploying the site.

Sources: [Meta's token renewal guide](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login/), [GitHub secret permissions](https://docs.github.com/en/rest/actions/secrets#create-or-update-a-repository-secret), [Meta's Instagram Login setup guide](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started), [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

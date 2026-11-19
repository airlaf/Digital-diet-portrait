# Digital Diet exhibition

Separate working copy on branch `codex/exhibition-qr`. The original Desktop checkout and live GitHub Pages site are unchanged. The duplicate also preserves pre-existing uncommitted Spotify-folder changes; those are unrelated to the exhibition implementation.

## Run the exhibition

Requires Node.js 20 or newer.

```sh
cd "/Users/airla/Documents/ChatGPT/Digital diet exhibit/exhibition"
npm install
npm start
```

Open the **Exhibition station** URL printed in Terminal on the exhibition computer. It includes a private station key: do not share that URL. The key is kept in this tab's session storage and removed from the address bar. Keep the terminal running. Use localhost for camera access. Allow the camera when Start Camera is clicked.

The QR code points to the computer's LAN address by default. Connect visitors to the same trusted Wi-Fi; guest-network device isolation or the macOS firewall can prevent connection. If the detected address is wrong, set PUBLIC_URL to the correct reachable address before starting.

For visitors on cellular, deploy this Node server behind HTTPS or connect an HTTPS tunnel to port 3000, then start with `PUBLIC_URL=https://your-exhibition-host.example npm start` (replace with your actual address). Keep that address stable during the event. GitHub Pages cannot run this server. No cloud hosting, tunnel, GitHub push, or public deployment was performed in this change. A hosted deployment must use a single Node process/instance because sessions are held in memory; do not load-balance across instances. If hosted remotely, use the HTTPS host with the station key fragment to open the kiosk. Set STATION_KEY in the host's secret environment configuration, never in source control.

## Visitor experience

1. Scan the session-specific QR code.
2. Export Safari History only, unzip in Files, and select History.json. Export availability and labels depend on iOS version. See [Apple's guide](https://support.apple.com/guide/iphone/iph1852764a6/ios) and [format documentation](https://developer.apple.com/documentation/safariservices/importing-data-exported-from-safari.md).
3. Preview the first three titles on the phone and consent to public display. The phone extracts titles; URLs and timestamps are discarded before sending.
4. Send. The computer imports the titles into the existing word-processing and portrait renderer. The visitor or host clicks Start Camera on the computer.
5. Download PNG/SVG on the computer if desired. Select Next visitor to clear the portrait and create a new QR. The page automatically clears five minutes after receipt or sample selection. Local uploads clear five minutes after Start Camera.

Use Try a sample portrait for visitors without an export. Existing computer upload, paste, topic colors and portrait controls remain available. Camera imagery stays in the browser. Page titles can include sensitive words; the phone explicitly asks permission before sharing them.

## Retention and operating limits

Titles are relayed in process memory, cleared on acknowledgment, and expire with the pairing session after at most 15 minutes. Expired allocations are swept every 30 seconds. Reset deletes the pairing and reloads the kiosk to clear its words and stop camera capture. No database or upload files are written. Restarting the server clears all sessions. Downloaded portraits are intentional local files and are not deleted by reset.

A session accepts one upload; new visitors must scan a new code. The random QR token grants upload/status access only. Portrait retrieval and session control require the private station key. Raw request bodies are not logged by this application; configure any hosting proxy to avoid body logging. Use HTTPS for public operation. The local Wi-Fi prototype uses HTTP.

File selection allows 10 MB JSON; the phone takes at most 10,000 nonempty titles, truncating each to 500 characters. The relay limits requests to 1 MB, so very large exports may require a smaller selection/export. An export with no usable words is rejected. Portrait word processing retains the original project's vocabulary filtering.

The original renderer loads p5, Compromise, fonts and segmentation assets from the internet. This is not an offline installation. Rehearse with the actual exhibit computer, camera, iPhone and venue Wi-Fi before opening.

## Verification

`npm test` covers Safari title extraction, rejecting non-history exports, station authorization, QR session creation, one-upload enforcement, title retrieval, acknowledgment clearing, reset invalidation, expiration, and blocking access to Git metadata. JavaScript syntax checks also pass. Browser checks cover the welcome UI, sample loading and phone instructions. The browser file-picker automation timed out, so a full upload through the phone UI has not been verified. Physical iPhone scanning and actual camera portrait rendering still require an on-site rehearsal.

## Public-display word filter

`exhibit/word-filter.js` is the shared editable list and matching logic. It removes common English profanity, explicit sexual vocabulary and adult-site names; normalization handles case, accents, full-width characters, common leetspeak and punctuation-separated variants. The phone filters before preview/transmission, the relay filters incoming titles again, and the portrait filters both before NLP and before accepting word frequencies. JSON, CSV and pasted text follow the same portrait rules. Empty filtered phone uploads are rejected without consuming the session. If the filter fails to load, portrait word ingestion fails closed.

This is a conservative vocabulary filter, not a guarantee against every explicit term, other languages, deliberate evasion or sensitive personal information. Some ambiguous terms are intentionally removed for the public setting. Ordinary words such as analysis, class and assignment are retained. Add exhibition-specific terms to the shared list and run `npm test`. Refresh already-open kiosk and phone pages after an update; existing portraits are not retroactively sanitized until reloaded.

## Improved category matching

The exhibition keeps the original eight topics and colors. Extra whole-word vocabulary in `EXHIBITION_TOPIC_WORDS` covers common food, travel, design, technology, health and social browsing terms. Matching now checks conservative plural/verb forms against known dictionary entries before falling back to the existing stem rules. Exact matches retain priority; tied inflection matches remain Miscellaneous. Unknown words are not forced into a topic. Results are cached (up to 20,000 words) for rendering performance.

The regression suite includes category assignments, inflections, unknown words, consistent topic counts, and explicit-word filtering. A hand-selected diagnostic set of 76 everyday words went from 35 Miscellaneous results to zero after addressing those vocabulary gaps; this is a targeted regression check, not an accuracy estimate for real visitor history. Refresh the kiosk and re-import history to use updated rules. Categorization remains entirely local and uses no external AI service.

## Expanded sample portraits

The welcome screen's **Explore a sample** selector offers:

- **Curated · 1,000 words:** round-robin selection from the project's topic lexicons, after public-display filtering and category matching. It is deliberately varied across all eight categories, not an empirical popularity ranking. Each word has weight 1.
- **Google searches · June 2026:** 704 distinct usable words derived from [OpenRush's downloadable 1,000-query snapshot](https://www.openrush.com/free-resources/most-searched-keywords), [JSON source](https://www.openrush.com/data/most-searched-keywords.json), retrieved November 19, 2026. The publisher describes bucketed global monthly Google search estimates for June 2026. This is a third-party snapshot, not audited browsing-history data and not a full-year 2026 ranking. Exclude source-flagged adult/piracy entries and non-ASCII queries (893 eligible queries remain), then apply the project's fallback tokenization, noise filtering and explicit-word filter. Additional adult-site names found in review are blocked. Deduplicate and give surviving words equal weight. ASCII eligibility does not guarantee English; the sample retains global names and romanized terms.

The derived vocabulary and provenance are bundled in `exhibit/data/search-sample.js`; selecting a sample makes no external data request. The displayed word count is calculated from the current filter. Full snapshot ranks and volume estimates are not used as portrait weights. Google Year in Search is a different metric: [Google's methodology](https://trends.withgoogle.com/year-in-search/data-methodology/) describes rising/trending searches, not a most-searched list.

Both presets were verified through the browser's sample selection, loading and reset flow. Unit tests check size, unique words, category spread, provenance and explicit-word filtering. A new JSON-upload browser check also verified selecting a synthetic history file and delivering its words to the kiosk; the earlier file-picker automation limitation is now resolved for that browser test (physical iPhone/venue rehearsal remains necessary).

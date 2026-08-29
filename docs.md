# Helper-Hub Developer Documentation

This document explains the technical architecture, design decisions, and local verification steps for the Auto-Committer tool.

## Key Design Considerations

### Timezone Safety
Because GitHub Actions runners operate in UTC time, and the day boundary changes at 12:00 AM local time (Asia/Kolkata), we ensure the script determines the date using the local time of the user:
- We parse dates and check the commit history relative to `Asia/Kolkata` time.
- The cron schedule `45 17 * * *` is set specifically to fire at 11:15 PM IST.

### Iterative Page Evolution
Instead of creating scattered files across the repository, the auto-committer focuses on iteratively improving a single project: the **"Whiskers & Paws" cat landing page** located in `features/cat-landing/`.

Each daily run enhances the same 3 files:
- `features/cat-landing/index.html` — page structure and content
- `features/cat-landing/style.css` — styling, animations, and themes
- `features/cat-landing/script.js` — interactivity, effects, and logic

This means the landing page grows richer and more polished every day — new sections get added, animations become more refined, and the overall experience improves incrementally.

### Non-Breaking Changes
To ensure the commits do not break any existing functionality:
- The Gemini API is instructed to return the **complete updated file content** for each change.
- The prompt enforces **additive-only** changes — existing features are preserved, never removed.
- Changes are applied sequentially, with each building on the previous one.
- If the script fails, changes are automatically reverted.

### Safety Validations — Whitelist Approach
The auto-commit script uses a **whitelist-only** approach for maximum safety:
1. **Whitelisted Files Only**: Only these 3 files can be modified:
   - `features/cat-landing/index.html`
   - `features/cat-landing/style.css`
   - `features/cat-landing/script.js`
2. **Path Traversal Rejection**: File paths containing `..` are rejected.
3. **Empty Content Check**: Changes with empty or whitespace-only content are skipped.
4. **Any other file path is rejected** — the script will never touch `auto-commit.js`, `.github/`, `README.md`, `docs.md`, or anything in `utils/`.

### API & Reliability Architecture
- **Multi-Model Candidate Chain**: The script queries `v1beta` models using a fallback order (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`). If any model endpoint is unavailable, rate-limited, or deprecated, the script automatically retries with the next candidate without crashing.
- **Robust JSON Extraction**: Automatically strips markdown code blocks (```json ... ```) and extracts raw JSON objects from response text.
- **Porcelain Commit Guard**: Validates that staged changes exist in `git status --porcelain` before executing `git commit`.
- **Cross-Platform Line Endings (`.gitattributes`)**: Enforces `eol=lf` across all text files (`*.js`, `*.json`, `*.html`, `*.css`, `*.md`, `*.yml`) to prevent false diffs when toggling between Windows and WSL Linux terminals.

## Auto-Generated Improvement Categories

The Gemini prompt guides improvements across 5 categories (at least 3 are used per run):

### 1. New Sections & Content (HTML)
Adding new page sections to enrich the landing page:
- Gallery grids, testimonials carousels, cat care tips
- FAQ accordions, newsletter signup forms, featured cat of the day
- Cat breed comparison tables, interactive quizzes, timelines

### 2. Visual Enhancements (CSS)
Adding styling upgrades for a premium look:
- Glassmorphism cards, gradient mesh backgrounds, animated borders
- Neon glow effects, parallax scroll effects, 3D transform card flips
- Skeleton loading states, morphing shape dividers, custom scrollbar styling

### 3. Micro-Animations (CSS)
Adding subtle motion design for engagement:
- Scroll-triggered reveals, staggered entrance animations
- Magnetic hover effects, ripple click effects, infinite marquees
- Count-up animations, floating elements, wave animations

### 4. Interactive Features (JS)
Adding dynamic behavior and user interaction:
- Smooth scroll with progress indicator, cursor effects
- Scroll-to-top button, image lightbox/modal, breed search/filter
- localStorage favorites, confetti effects, parallax mouse tracking

### 5. Responsiveness & Polish (CSS + HTML)
Improving cross-device experience and accessibility:
- Mobile hamburger menu animation, tablet breakpoint optimization
- ARIA labels, focus states, skip navigation, print styles
- Reduced motion preferences, fluid typography improvements

## Helper Utilities

The repository includes modular helper utilities in the `utils/` directory:
- `utils/arrayUtils.js`: Array manipulation, compacting, chunking, and difference helpers.
- `utils/asyncUtils.js`: Asynchronous utilities including `sleep`, `withTimeout`, and `retry`.
- `utils/collectionUtils.js`: Array grouping (`groupBy`), key indexing (`keyBy`), and partitioning (`partition`) helpers.
- `utils/colorUtils.js`: ANSI terminal color styling and ANSI escape code stripping helpers.
- `utils/cryptoUtils.js`: Cryptographic hashing (SHA-256, MD5) and random hex generation helpers.
- `utils/dateFormatter.js`: Formats dates into `YYYY-MM-DD` strings according to specific timezones.
- `utils/envUtils.js`: Safe environment variable retrieval, fallback, and type parsing helpers.
- `utils/fileUtils.js`: Safe directory creation, file reading/writing, and file presence checks.
- `utils/functionUtils.js`: Function execution control helpers (`once`, `identity`, `constant`, `noop`).
- `utils/jsonUtils.js`: Safe JSON parsing, stringification, and string validation.
- `utils/logger.js`: Standardized timestamped logging helpers (`logInfo`, `logWarn`, `logError`).
- `utils/mathUtils.js`: Advanced mathematical and statistical helpers (`factorial`, `gcd`, `lcm`, `median`).
- `utils/numberUtils.js`: Mathematical helpers for clamping, rounding, and range checks.
- `utils/objectUtils.js`: Safe object key picking, omission, and type validation helpers.
- `utils/pathUtils.js`: File path manipulation, extension extraction, and path normalization helpers.
- `utils/promiseUtils.js`: Deferred promise control and concurrency-limited mapping helpers.
- `utils/rateLimiter.js`: Rate limiting and execution control helpers (`debounce`, `throttle`).
- `utils/stringUtils.js`: String formatting, truncation, slugification, and validation utilities.
- `utils/typeUtils.js`: Precise data type checking and validation helpers (primitives, objects, nil).
- `utils/urlUtils.js`: Query parameter parsing and query string building helpers.
- `utils/validationUtils.js`: String, email, URL, and numeric format validation utilities.

## Local Development & Testing

You can run the script locally to verify its functionality.

```bash
# Set your Gemini API key in your terminal/environment
$env:GEMINI_API_KEY="your-gemini-key"

# Run utility unit tests
node utils/arrayUtils.test.js
node utils/asyncUtils.test.js
node utils/collectionUtils.test.js
node utils/colorUtils.test.js
node utils/cryptoUtils.test.js
node utils/dateFormatter.test.js
node utils/envUtils.test.js
node utils/fileUtils.test.js
node utils/functionUtils.test.js
node utils/jsonUtils.test.js
node utils/logger.test.js
node utils/mathUtils.test.js
node utils/numberUtils.test.js
node utils/objectUtils.test.js
node utils/pathUtils.test.js
node utils/promiseUtils.test.js
node utils/rateLimiter.test.js
node utils/stringUtils.test.js
node utils/typeUtils.test.js
node utils/urlUtils.test.js
node utils/validationUtils.test.js

# Open the cat landing page locally
# Just open features/cat-landing/index.html in your browser

# Run the auto-committer script
node auto-commit.js
```

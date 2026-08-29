# Helper-Hub Tool

An intelligent, cloud-based auto-committer that automatically keeps your GitHub contributions green and active. 

If no commits have been pushed by **11:15 PM IST (17:45 UTC)** on a given day, this tool wakes up, calls the Gemini API to generate 4-5 meaningful improvements to an evolving **"Whiskers & Paws" cat landing page** — adding new sections, visual enhancements, animations, interactive features, and responsive polish — and commits/pushes them automatically.

## How It Works

1. **Scheduled Run**: A GitHub Actions workflow runs every day at 17:45 UTC (11:15 PM IST).
2. **Commit Check**: The tool queries the repository's commit history for the current day in the `Asia/Kolkata` timezone.
3. **Check Condition**:
   - If commits exist for the day, it logs the condition and exits.
   - If no commits exist, it requests code changes from the Gemini API.
4. **Change Generation**: Gemini iteratively improves the cat landing page across these categories:
   - 🎨 **New Sections & Content** — gallery grids, testimonials, FAQ accordions, quizzes
   - 💅 **Visual Enhancements** — glassmorphism, gradient meshes, animated borders, neon effects
   - ✨ **Micro-Animations** — scroll reveals, hover effects, ripple clicks, marquees
   - ⚡ **Interactive Features** — cursor effects, scroll progress, lightbox, search/filter
   - 📱 **Responsiveness & Polish** — mobile menu, tablet breakpoints, accessibility, fluid typography
5. **Safety Validation**: Only 3 whitelisted files can be modified. Path traversal and empty content are rejected.
6. **Auto-Commit**: The script applies changes one by one, making separate git commits with conventional commit messages.
7. **Push**: The commits are pushed back to the `main` branch.

## Project Structure

```
.
├── auto-commit.js                  # Core script: commit check, Gemini API, safety validation
├── docs.md                         # Developer documentation and design decisions
├── README.md                       # Project overview and setup guide
├── features/
│   └── cat-landing/                # 🐱 The evolving cat landing page (auto-improved daily)
│       ├── index.html              # Page structure and content
│       ├── style.css               # Styling, animations, and themes
│       └── script.js               # Interactivity, effects, and logic
└── utils/                          # 🔧 Modular helper utilities and tests
    ├── arrayUtils.js, asyncUtils.js, collectionUtils.js, ...
    └── *.test.js                   # Corresponding test suites
```

## Setup Instructions

1. **Get a Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/) and get a free API Key.

2. **Add Key to GitHub Secrets**:
   - Go to your repository settings on GitHub.
   - Navigate to **Settings** > **Secrets and variables** > **Actions**.
   - Create a new repository secret named `GEMINI_API_KEY` and paste your API key.

3. **Enable Workflow Permissions**:
   - In your repository settings, go to **Settings** > **Actions** > **General**.
   - Under **Workflow permissions**, select **Read and write permissions** so the GitHub Actions runner can push commits.

## Safety Features

The auto-committer includes multiple layers of safety validation:
- **Whitelist-Only**: Only 3 specific files can be modified (`features/cat-landing/index.html`, `style.css`, `script.js`)
- **Path Traversal Prevention**: File paths containing `..` are rejected
- **Empty Content Check**: Changes with empty content are skipped
- **Bot Detection**: Auto-commits by `github-actions[bot]` don't count as real activity
- **Preserve-First**: The Gemini prompt enforces additive-only changes — existing features are never removed

## Troubleshooting / Recent Updates
- **Iterative Page Evolution**: The auto-committer now iteratively improves a single cat landing page rather than creating scattered files. Each day's commits build on the previous day's work.
- **Schedule Update**: Changed from 9:00 PM IST to 11:15 PM IST for better end-of-day coverage.
- **Multi-Model Reliability**: Uses a multi-model candidate fallback chain (`gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-2.0-flash`) via the `v1beta` endpoint to ensure reliable execution without API failure crashes.
- **Robust JSON & Git Guard**: Strips markdown formatting before parsing and verifies staged porcelain changes prior to executing commits.
- **Cross-Platform Line Endings**: Includes `.gitattributes` to enforce consistent `LF` line endings across Windows and WSL Linux environments.

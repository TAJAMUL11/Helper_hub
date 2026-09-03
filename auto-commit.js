const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

function getKolkataDateString(date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const year = parts.find(p => p.type === 'year').value;
  return `${year}-${month}-${day}`;
}

function getCodebaseContext() {
  const files = [];
  function scan(dir) {
    if (
      dir.includes('.git') ||
      dir.includes('node_modules') ||
      dir.includes('.github')
    ) {
      return;
    }
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (stat.isFile()) {
        if (
          file.endsWith('.js') ||
          file.endsWith('.json') ||
          file.endsWith('.md') ||
          file.endsWith('.html') ||
          file.endsWith('.css')
        ) {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({
            path: path.relative(process.cwd(), fullPath),
            content: content
          });
        }
      }
    }
  }
  scan(process.cwd());
  return files;
}

function checkGitHubActivity(username) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/users/${encodeURIComponent(username)}/events`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js-Helper-Hub',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            return reject(new Error(`GitHub user "${username}" not found.`));
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`GitHub API error (status ${res.statusCode}): ${data}`));
          }
          const events = JSON.parse(data);
          resolve(events);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.end();
  });
}

function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('GEMINI_API_KEY environment variable is not set.'));
  }

  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash'
  ];

  return (async () => {
    let lastError = null;
    for (const model of candidateModels) {
      try {
        console.log(`Querying Gemini API using model: ${model}...`);
        const text = await new Promise((resolve, reject) => {
          const postData = JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          });

          const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                if (res.statusCode !== 200) {
                  return reject(new Error(`Gemini API Error for model ${model} (status ${res.statusCode}): ${data}`));
                }
                const json = JSON.parse(data);
                if (
                  json.candidates &&
                  json.candidates[0] &&
                  json.candidates[0].content &&
                  json.candidates[0].content.parts[0]
                ) {
                  resolve(json.candidates[0].content.parts[0].text);
                } else {
                  reject(new Error(`Unexpected API response structure for model ${model}: ${data}`));
                }
              } catch (e) {
                reject(e);
              }
            });
          });

          req.on('error', (e) => { reject(e); });
          req.write(postData);
          req.end();
        });
        return text;
      } catch (err) {
        console.warn(`Model ${model} failed: ${err.message}. Retrying with next model...`);
        lastError = err;
      }
    }
    throw new Error(`All candidate Gemini models failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
  })();
}

function parseGeminiJson(responseText) {
  let cleaned = responseText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

const AUTO_COMMIT_ENABLED = false;

async function run() {
  if (!AUTO_COMMIT_ENABLED) {
    console.log('[Helper-Hub] Auto-committer is currently DISABLED. No commits will be generated or added to your GitHub profile.');
    return;
  }

  const todayStr = getKolkataDateString(new Date());
  console.log(`Checking commits for Kolkata Date: ${todayStr}`);

  // Resolve GitHub Username
  const githubRepository = process.env.GITHUB_REPOSITORY;
  let username = '';
  if (githubRepository) {
    username = githubRepository.split('/')[0];
  } else {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remoteUrl.match(/github\.com[/:]([^/]+)\/[^/]+/);
      if (match) {
        username = match[1];
      }
    } catch (e) {
      // Fallback if git remote command fails
    }
    if (!username) {
      try {
        username = execSync('git config user.name', { encoding: 'utf-8' }).trim();
      } catch (e) {
        username = process.env.GITHUB_USERNAME;
      }
    }
  }

  if (!username) {
    console.error('Could not determine GitHub username. Please set GITHUB_REPOSITORY or GITHUB_USERNAME environment variable.');
    process.exit(1);
  }

  console.log(`Checking GitHub activity for user: ${username}`);
  let hasPushedToday = false;

  try {
    const events = await checkGitHubActivity(username);
    hasPushedToday = events.some(event => {
      if (event.type !== 'PushEvent') return false;

      // Ignore pushes made by github-actions[bot] (our own auto-commits)
      if (event.actor && event.actor.login === 'github-actions[bot]') return false;

      const eventDate = new Date(event.created_at);
      return getKolkataDateString(eventDate) === todayStr;
    });
  } catch (error) {
    console.warn(`Failed to fetch GitHub activity: ${error.message}. Falling back to local git history check.`);
    let commitDates = [];
    try {
      const gitUserName = (() => {
        try { return execSync('git config user.name', { encoding: 'utf-8' }).trim().toLowerCase(); } catch (e) { return ''; }
      })();
      const output = execSync('git log --pretty=format:"%aI|%an"', { encoding: 'utf-8' });
      commitDates = output.split('\n').filter(Boolean).map(line => {
        const [dateStr, authorName] = line.trim().split('|');
        const lowerAuthor = (authorName || '').toLowerCase();
        // Ignore bot commits
        if (lowerAuthor.includes('github-actions')) return null;
        if (
          !username ||
          lowerAuthor.includes(username.toLowerCase()) ||
          (gitUserName && lowerAuthor.includes(gitUserName))
        ) {
          return new Date(dateStr);
        }
        return null;
      }).filter(Boolean);
    } catch (e) {
      console.log('No local git history found.');
    }
    const commitsToday = commitDates.filter(d => getKolkataDateString(d) === todayStr);
    hasPushedToday = commitsToday.length > 0;
  }

  if (hasPushedToday) {
    console.log(`Real commits found today (Kolkata time) for user "${username}". Auto-committer will stand down.`);
    return;
  }
  console.log('No commits found today. Querying Gemini for improvements...');
  const context = getCodebaseContext();

  const prompt = `
You are an expert frontend developer iteratively improving a "Whiskers & Paws" cat landing page.
The project has exactly 3 files that you will enhance:
- features/cat-landing/index.html (structure and content)
- features/cat-landing/style.css (styling, animations, themes)
- features/cat-landing/script.js (interactivity, effects, logic)

Here is the CURRENT state of these files:
${JSON.stringify(context, null, 2)}

Your task: generate 4 to 5 sequential improvements that make the cat landing page BETTER than it is now.
Each change MUST modify one of the 3 files above. You are enhancing an evolving project — not starting from scratch.

Pick improvements from these categories (choose at least 3 different ones per run):

1. **New Sections & Content** (HTML) — Add new page sections like: a gallery grid, testimonials carousel,
   cat care tips, FAQ accordion, newsletter signup form, featured cat of the day, cat breed comparison table,
   photo masonry layout, interactive quiz ("Which cat breed are you?"), timeline of cat history.

2. **Visual Enhancements** (CSS) — Add new styles: glassmorphism cards, gradient mesh backgrounds,
   animated borders, neon glow effects, parallax scroll effects, 3D transform card flips,
   skeleton loading states, morphing shape dividers, text gradient animations, custom scrollbar styling,
   new color scheme variations, CSS grid art, animated SVG backgrounds, blur/frosted glass overlays.

3. **Micro-Animations** (CSS) — Scroll-triggered reveals, staggered entrance animations,
   magnetic hover effects, ripple click effects, infinite marquee scrollers, typewriter effects,
   count-up number animations, progress bar animations, floating elements, wave animations.

4. **Interactive Features** (JS) — Smooth scroll with progress indicator, lazy image loading,
   interactive cursor effects, dark/light theme with system preference detection, keyboard shortcuts,
   scroll-to-top button with progress ring, image lightbox/modal, filter/search for breeds,
   localStorage favorites, confetti effects on button click, sound toggle, parallax mouse tracking.

5. **Responsiveness & Polish** (CSS + HTML) — Mobile hamburger menu animation, tablet breakpoint optimization,
   touch-friendly interactions, accessibility improvements (ARIA labels, focus states, skip navigation),
   print styles, reduced motion preferences, container queries, fluid typography improvements.

CRITICAL RULES:
- You are MODIFYING the existing files — return the COMPLETE updated file content for each change.
- Each change must build on top of the previous ones in sequence (change 2 sees the result of change 1, etc).
- ONLY modify these 3 files: features/cat-landing/index.html, features/cat-landing/style.css, features/cat-landing/script.js
- NEVER touch: auto-commit.js, .github/, .gitignore, README.md, docs.md, package.json, or anything in utils/
- All HTML must remain fully responsive across mobile, tablet, and desktop.
- Use Google Fonts via CDN, modern CSS (grid, flexbox, clamp(), custom properties), and vanilla JS only.
- Preserve ALL existing functionality — only add or enhance, never remove working features.
- Keep the code clean, well-commented, and free of syntax errors.
- Commit messages must follow conventional commits (feat:, style:, fix:, refactor:).
- Do NOT duplicate existing sections or features — always add something NEW.

Return a JSON object in this exact format:
{
  "changes": [
    {
      "filePath": "features/cat-landing/style.css",
      "content": "/* complete updated CSS file content */",
      "commitMessage": "style: add glassmorphism card hover effects"
    }
  ]
}

Ensure:
1. The changes list has exactly 4 or 5 elements.
2. Changes span at least 2 of the 3 files.
3. Each change returns the FULL updated file content (not a diff or partial snippet).
4. The changes are sequential — each one builds on the previous.
5. Return ONLY the JSON object. Do not wrap in markdown.
`;

  try {
    const responseText = await callGemini(prompt);
    const result = parseGeminiJson(responseText);

    if (!result.changes || !Array.isArray(result.changes) || result.changes.length === 0) {
      throw new Error('Gemini returned empty or invalid changes structure.');
    }

    // Safety: only these files may be modified by the auto-committer
    const allowedPaths = [
      'features/cat-landing/index.html',
      'features/cat-landing/style.css',
      'features/cat-landing/script.js'
    ];

    console.log(`Applying ${result.changes.length} generated changes...`);
    for (const change of result.changes) {
      // Safety validation: reject path traversal
      if (change.filePath.includes('..')) {
        console.warn(`- SKIPPED (path traversal detected): "${change.filePath}"`);
        continue;
      }

      // Safety validation: only allow whitelisted files
      if (!allowedPaths.includes(change.filePath)) {
        console.warn(`- SKIPPED (not a whitelisted file): "${change.filePath}"`);
        continue;
      }

      // Safety validation: reject empty content
      if (!change.content || change.content.trim().length === 0) {
        console.warn(`- SKIPPED (empty content): "${change.filePath}"`);
        continue;
      }

      const fullPath = path.resolve(process.cwd(), change.filePath);

      // Ensure target directory exists
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      // Write the updated content
      fs.writeFileSync(fullPath, change.content, 'utf8');

      // Stage change
      execSync(`git add "${change.filePath}"`);

      // Check if git status has staged modifications before committing
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
      if (statusOutput) {
        execSync(`git commit -m "${change.commitMessage}"`);
        console.log(`- Created commit: "${change.commitMessage}"`);
      } else {
        console.log(`- Skipped commit for "${change.filePath}": No changes detected.`);
      }
    }

    console.log('Successfully applied all changes locally.');
  } catch (error) {
    console.error('Error during auto-commit process:', error);
    process.exit(1);
  }
}

run();


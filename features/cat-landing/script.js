/**
 * Whiskers & Paws — Cat Landing Page Scripts
 * Handles: typing animation, stats counter, carousel, theme toggle,
 *          floating paws, scroll animations, breed filter/search,
 *          accordion tips, interactive quiz, breed favoriting,
 *          gallery lightbox, history timeline scroll observer, custom cursor,
 *          Web Audio cat sound synthesizer, cat name generator, sound toggle,
 *          confetti effects, scroll progress, back to top, and keyboard shortcuts.
 */

(function () {
  'use strict';

  // ─── Typing Animation ───────────────────────────────────
  const heroDescriptions = [
    "Cats have been our companions for over 10,000 years — mysterious, graceful, and endlessly entertaining.",
    "From ancient Egypt to your living room, cats continue to captivate hearts around the world.",
    "Whether they're napping in a sunbeam or chasing laser dots, cats make every day brighter.",
    "A house is not a home without a cat curled up somewhere, purring contentedly."
  ];

  function typeWriter(element, text, speed = 30) {
    return new Promise((resolve) => {
      let i = 0;
      element.textContent = '';
      function type() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          resolve();
        }
      }
      type();
    });
  }

  async function runTypingLoop() {
    const el = document.getElementById('heroDesc');
    if (!el) return;

    let index = 0;
    while (true) {
      await typeWriter(el, heroDescriptions[index], 28);
      await sleep(4000);

      // Fade out text
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      await sleep(500);

      index = (index + 1) % heroDescriptions.length;
      el.style.opacity = '1';
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Stats Counter ──────────────────────────────────────
  function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      function update() {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current).toLocaleString();
          requestAnimationFrame(update);
        } else {
          counter.textContent = target.toLocaleString();
        }
      }
      update();
    });
  }

  // ─── Facts Carousel ─────────────────────────────────────
  function initCarousel() {
    const track = document.getElementById('factsTrack');
    const cards = document.querySelectorAll('.fact-card');
    const dotsContainer = document.getElementById('carouselDots');
    const prevBtn = document.getElementById('prevFact');
    const nextBtn = document.getElementById('nextFact');
    let currentIndex = 0;
    let autoPlayInterval;

    if (!track || !cards.length || !dotsContainer) return;

    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', `Go to fact ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(index) {
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });

      resetAutoPlay();
    }

    function next() {
      goTo((currentIndex + 1) % cards.length);
    }

    function prev() {
      goTo((currentIndex - 1 + cards.length) % cards.length);
    }

    function resetAutoPlay() {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(next, 5000);
    }

    prevBtn?.addEventListener('click', prev);
    nextBtn?.addEventListener('click', next);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    resetAutoPlay();
  }

  // ─── Web Audio API Sound Synthesizer ─────────────────────
  let audioCtx = null;
  let isSoundMuted = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playCatSound(type) {
    if (isSoundMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    animateVisualizer();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'meow') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.4);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'purr') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(30, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.start(now);
      osc.stop(now + 0.75);
    } else if (type === 'chirp') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1150, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(850, now + 0.2);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'trill') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(820, now + 0.1);
      osc.frequency.linearRampToValueAtTime(680, now + 0.2);
      osc.frequency.linearRampToValueAtTime(920, now + 0.35);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
    }
  }

  function animateVisualizer() {
    const viz = document.getElementById('soundVisualizer');
    if (!viz) return;
    viz.classList.add('playing');
    setTimeout(() => viz.classList.remove('playing'), 800);
  }

  function initSoundboard() {
    const pads = document.querySelectorAll('.sound-pad');
    const soundToggle = document.getElementById('soundToggle');

    pads.forEach((pad) => {
      pad.addEventListener('click', () => {
        const soundType = pad.getAttribute('data-sound');
        playCatSound(soundType);
      });
    });

    soundToggle?.addEventListener('click', () => {
      isSoundMuted = !isSoundMuted;
      soundToggle.classList.toggle('muted', isSoundMuted);
      const icon = soundToggle.querySelector('.sound-icon');
      if (icon) {
        icon.textContent = isSoundMuted ? '🔇' : '🔊';
      }
    });
  }

  // ─── Cat Name Generator ──────────────────────────────────
  function initNameGenerator() {
    const vibeSelect = document.getElementById('nameVibeSelect');
    const generateBtn = document.getElementById('generateNameBtn');
    const resultName = document.getElementById('resultName');
    const copyBtn = document.getElementById('copyNameBtn');

    if (!generateBtn || !resultName) return;

    const nameDatabase = {
      cute: ['Mochi', 'Peanut', 'Bubbles', 'Ziggy', 'Pippin', 'Button', 'Clover', 'Toffee'],
      majestic: ['Cleopatra', 'Lord Whiskers', 'Duchess', 'Apollo', 'Zeus', 'Aurelius', 'Serafina', 'Gatsby'],
      food: ['Cannoli', 'Noodle', 'Waffles', 'Saffron', 'Biscuit', 'Pickle', 'Miso', 'Matcha'],
      mythical: ['Nebula', 'Phoenix', 'Cosmo', 'Merlin', 'Loki', 'Freya', 'Orion', 'Astral']
    };

    function generateName() {
      const vibe = vibeSelect?.value || 'cute';
      const list = nameDatabase[vibe] || nameDatabase.cute;
      const randomName = list[Math.floor(Math.random() * list.length)];

      resultName.style.transform = 'scale(0.8)';
      resultName.style.opacity = '0';
      setTimeout(() => {
        resultName.textContent = randomName;
        resultName.style.transform = 'scale(1)';
        resultName.style.opacity = '1';
        resultName.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }, 150);

      playCatSound('chirp');
    }

    generateBtn.addEventListener('click', generateName);

    copyBtn?.addEventListener('click', () => {
      const text = resultName.textContent;
      if (text && text !== 'Click generate!') {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = '✅';
          setTimeout(() => { copyBtn.textContent = '📋'; }, 2000);
        });
      }
    });
  }

  // ─── Theme Toggle ───────────��──────────────────────────
  function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    const icon = toggle?.querySelector('.toggle-icon');
    if (!toggle || !icon) return;

    const savedTheme = localStorage.getItem('cat-landing-theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      icon.textContent = '☀️';
    }

    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        icon.textContent = '🌙';
        localStorage.setItem('cat-landing-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.textContent = '☀️';
        localStorage.setItem('cat-landing-theme', 'dark');
      }
    });
  }

  // ─── Floating Paw Prints ────────────────────────────────
  function initFloatingPaws() {
    const container = document.getElementById('pawContainer');
    if (!container) return;

    const paws = ['🐾', '🐾', '🐾', '🐾', '🐾'];

    function spawnPaw() {
      const paw = document.createElement('span');
      paw.classList.add('paw');
      paw.textContent = paws[Math.floor(Math.random() * paws.length)];
      paw.style.left = Math.random() * 100 + 'vw';
      paw.style.fontSize = (0.8 + Math.random() * 1) + 'rem';
      paw.style.animationDuration = (8 + Math.random() * 8) + 's';
      paw.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(paw);

      setTimeout(() => {
        paw.remove();
      }, 18000);
    }

    for (let i = 0; i < 8; i++) {
      setTimeout(spawnPaw, i * 600);
    }

    setInterval(spawnPaw, 2500);
  }

  // ─── Custom Pointer Follower ───────────────────────────
  function initCustomCursor() {
    const cursor = document.getElementById('customCursor');
    if (!cursor) return;

    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, { passive: true });
  }

  // ─── Scroll Animations ─────────────────────────────────
  function initScrollAnimations() {
    const breedCards = document.querySelectorAll('.breed-card');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, index * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    breedCards.forEach((card) => observer.observe(card));
  }

  // ─── Timeline Scroll Reveal ────────────────────────────
  function initTimeline() {
    const items = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, i * 150);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));
  }

  // ─── Lightbox Modal Handler ─────────────────────────────
  function initLightbox() {
    const modal = document.getElementById('lightboxModal');
    const closeBtn = document.getElementById('lightboxClose');
    const emojiEl = document.getElementById('lightboxEmoji');
    const titleEl = document.getElementById('lightboxTitle');
    const captionEl = document.getElementById('lightboxCaption');
    const cards = document.querySelectorAll('.gallery-card');

    if (!modal || !cards.length) return;

    function openModal(card) {
      const emoji = card.querySelector('.gallery-emoji')?.textContent || '🐱';
      const title = card.getAttribute('data-title') || 'Cat Photo';
      const caption = card.getAttribute('data-caption') || '';

      if (emojiEl) emojiEl.textContent = emoji;
      if (titleEl) titleEl.textContent = title;
      if (captionEl) captionEl.textContent = caption;

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      playCatSound('meow');
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => openModal(card));
    });

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // ─── Breed Search & Filtering ───────────────────────────
  function initBreedFilter() {
    const searchInput = document.getElementById('breedSearch');
    const filterTags = document.querySelectorAll('.filter-tag');
    const breedCards = document.querySelectorAll('.breed-card');
    let currentFilter = 'all';

    function applyFilter() {
      const query = (searchInput?.value || '').toLowerCase().trim();

      breedCards.forEach((card) => {
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
        const traits = (card.getAttribute('data-traits') || '').toLowerCase();

        const matchesQuery = !query || name.includes(query) || desc.includes(query) || traits.includes(query);
        const matchesTag = currentFilter === 'all' || traits.includes(currentFilter);

        if (matchesQuery && matchesTag) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    searchInput?.addEventListener('input', applyFilter);

    filterTags.forEach((tag) => {
      tag.addEventListener('click', () => {
        filterTags.forEach((t) => t.classList.remove('active'));
        tag.classList.add('active');
        currentFilter = tag.getAttribute('data-filter') || 'all';
        applyFilter();
      });
    });
  }

  // ─── Care Tips Accordion ────────────────────────────────
  function initAccordion() {
    const items = document.querySelectorAll('.accordion-item');

    items.forEach((item) => {
      const header = item.querySelector('.accordion-header');
      const body = item.querySelector('.accordion-body');

      header?.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        items.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.accordion-header')?.setAttribute('aria-expanded', 'false');
            const otherBody = other.querySelector('.accordion-body');
            if (otherBody) otherBody.style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove('active');
          header.setAttribute('aria-expanded', 'false');
          if (body) body.style.maxHeight = null;
        } else {
          item.classList.add('active');
          header.setAttribute('aria-expanded', 'true');
          if (body) body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });
  }

  // ─── Breed Favorites (LocalStorage) ─────────────────────
  function initFavorites() {
    const favButtons = document.querySelectorAll('.fav-btn');
    const savedFavs = JSON.parse(localStorage.getItem('cat-favorites') || '[]');

    favButtons.forEach((btn) => {
      const breedId = btn.getAttribute('data-breed-id');
      if (savedFavs.includes(breedId)) {
        btn.classList.add('active');
        btn.textContent = '❤️';
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        let currentFavs = JSON.parse(localStorage.getItem('cat-favorites') || '[]');
        const isFav = currentFavs.includes(breedId);

        if (isFav) {
          currentFavs = currentFavs.filter((id) => id !== breedId);
          btn.classList.remove('active');
          btn.textContent = '🤍';
        } else {
          currentFavs.push(breedId);
          btn.classList.add('active');
          btn.textContent = '❤️';
          playCatSound('chirp');
        }
        localStorage.setItem('cat-favorites', JSON.stringify(currentFavs));
      });
    });
  }

  // ─── Interactive Quiz ────────────────────────────────────
  function initQuiz() {
    const quizBody = document.getElementById('quizBody');
    const progressFill = document.getElementById('quizProgressFill');
    if (!quizBody || !progressFill) return;

    const questions = [
      {
        question: "What is your ideal weekend vibe?",
        options: [
          { label: "Relaxing on the couch with a book", breed: "persian", emoji: "🐱" },
          { label: "Chatting and catching up with friends", breed: "siamese", emoji: "😺" },
          { label: "Hiking or playing energetic games", breed: "bengal", emoji: "😼" },
          { label: "Hanging out casually with family", breed: "mainecoon", emoji: "😸" }
        ]
      },
      {
        question: "How much attention does your future cat need?",
        options: [
          { label: "Constant affection & vocal chatter", breed: "siamese", emoji: "🗣️" },
          { label: "Gentle cuddling when in the mood", breed: "ragdoll", emoji: "🧸" },
          { label: "Independent & quietly loving", breed: "scottish", emoji: "🦉" },
          { label: "High energy interactive play", breed: "bengal", emoji: "⚡" }
        ]
      },
      {
        question: "What cat coat type do you prefer?",
        options: [
          { label: "Super fluffy & glamorous coat", breed: "persian", emoji: "✨" },
          { label: "Large & majestic mane", breed: "mainecoon", emoji: "🦁" },
          { label: "Sleek & exotic leopard spots", breed: "bengal", emoji: "🐆" },
          { label: "Soft, unique folded ears", breed: "scottish", emoji: "🎀" }
        ]
      }
    ];

    const results = {
      persian: { name: "Persian", emoji: "🐱", desc: "You matched with the Persian! Gentle, quiet, and peaceful — perfect for cozy homebodies." },
      siamese: { name: "Siamese", emoji: "😺", desc: "You matched with the Siamese! Vocal, social, and intelligent — your companion for endless chats." },
      mainecoon: { name: "Maine Coon", emoji: "😸", desc: "You matched with the Maine Coon! Friendly, playful, and majestic — a true gentle giant." },
      bengal: { name: "Bengal", emoji: "😼", desc: "You matched with the Bengal! Energetic, exotic, and athletic — built for adventure lovers." },
      ragdoll: { name: "Ragdoll", emoji: "😻", desc: "You matched with the Ragdoll! Docile, affectionate, and sweet — the ultimate cuddler." },
      scottish: { name: "Scottish Fold", emoji: "🐈", desc: "You matched with the Scottish Fold! Charming, sweet-tempered, and endlessly cute." }
    };

    let currentStep = 0;
    let scores = {};

    function renderQuestion() {
      const q = questions[currentStep];
      progressFill.style.width = `${((currentStep + 1) / questions.length) * 100}%`;

      quizBody.innerHTML = `
        <h3 class="quiz-question-title">${q.question}</h3>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option-btn" data-index="${i}">
              <span>${opt.emoji} ${opt.label}</span>
            </button>
          `).join('')}
        </div>
      `;

      quizBody.querySelectorAll('.quiz-option-btn').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          const selectedBreed = q.options[idx].breed;
          scores[selectedBreed] = (scores[selectedBreed] || 0) + 1;
          currentStep++;
          playCatSound('chirp');

          if (currentStep < questions.length) {
            renderQuestion();
          } else {
            showResult();
          }
        });
      });
    }

    function showResult() {
      let topBreed = 'persian';
      let maxScore = -1;
      for (const [breed, count] of Object.entries(scores)) {
        if (count > maxScore) {
          maxScore = count;
          topBreed = breed;
        }
      }

      const res = results[topBreed] || results.persian;
      progressFill.style.width = '100%';

      quizBody.innerHTML = `
        <div class="quiz-result">
          <span class="quiz-result-emoji">${res.emoji}</span>
          <h3 class="quiz-result-title">${res.name}</h3>
          <p class="quiz-result-desc">${res.desc}</p>
          <button class="btn btn-primary" id="quizRestart">
            <span>Take Quiz Again</span>
            <span class="btn-icon">🔄</span>
          </button>
        </div>
      `;

      triggerConfetti();
      playCatSound('meow');

      document.getElementById('quizRestart')?.addEventListener('click', () => {
        currentStep = 0;
        scores = {};
        renderQuestion();
      });
    }

    renderQuestion();
  }

  // ─── Particle Confetti Effect ────────────────────────────
  function triggerConfetti() {
    const colors = ['#ff6b9d', '#c44dff', '#ff8c42', '#6e5cff', '#ffd166'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.classList.add('confetti-particle');
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.top = (window.scrollY + Math.random() * 300) + 'px';
      p.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      document.body.appendChild(p);

      setTimeout(() => p.remove(), 3000);
    }
  }

  // ─── Keyboard Shortcuts ─────────────────────────
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Prevent handling inside inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      if (e.key === 'd' || e.key === 'D') {
        document.getElementById('themeToggle')?.click();
      }
      if (e.key === 'm' || e.key === 'M') {
        document.getElementById('soundToggle')?.click();
      }
      if (e.key === 'g' || e.key === 'G') {
        document.getElementById('generateNameBtn')?.click();
      }
    });
  }

  // ─── Scroll Progress & Back to Top ─────────────────────
  function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgressBar');
    const backToTopBtn = document.getElementById('backToTop');
    const circle = document.querySelector('.progress-ring-circle');
    const circumference = 125.6;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) : 0;

      if (progressBar) {
        progressBar.style.width = `${scrollPercent * 100}%`;
      }

      if (backToTopBtn) {
        if (scrollTop > 300) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }

      if (circle) {
        const offset = circumference - (scrollPercent * circumference);
        circle.style.strokeDashoffset = offset;
      }
    }, { passive: true });

    backToTopBtn?.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ─── Newsletter & Adoption Buttons ──────────────────────
  function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('newsletterEmail');
    const adoptBtn = document.getElementById('adoptBtn');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput?.value;
      if (email) {
        const btn = form.querySelector('button');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span>Subscribed!</span> <span class="btn-icon">🎉</span>';
          triggerConfetti();
          playCatSound('trill');
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<span>Subscribe</span> <span class="btn-icon">✨</span>';
            if (emailInput) emailInput.value = '';
          }, 3000);
        }
      }
    });

    adoptBtn?.addEventListener('click', () => {
      triggerConfetti();
      playCatSound('meow');
    });
  }

  // ─── Navbar Scroll Effect ───────────────────────────────
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ─── Mobile Menu ────────────────────────────────────────
  function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const links = document.querySelector('.nav-links');
    if (!btn || !links) return;

    btn.addEventListener('click', () => {
      const isOpen = links.style.display === 'flex';
      links.style.display = isOpen ? 'none' : 'flex';
      links.style.position = 'absolute';
      links.style.top = 'var(--nav-height)';
      links.style.left = '0';
      links.style.right = '0';
      links.style.flexDirection = 'column';
      links.style.padding = '1.5rem';
      links.style.gap = '1rem';
      links.style.background = 'var(--glass-bg)';
      links.style.backdropFilter = 'blur(20px)';
      links.style.borderBottom = '1px solid var(--glass-border)';
    });

    links.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          links.style.display = 'none';
        }
      });
    });
  }

  // ─── Initialize Everything ──────────────────────────────
  function init() {
    initThemeToggle();
    initFloatingPaws();
    initCustomCursor();
    initCarousel();
    initScrollAnimations();
    initTimeline();
    initLightbox();
    initBreedFilter();
    initAccordion();
    initFavorites();
    initQuiz();
    initSoundboard();
    initNameGenerator();
    initScrollProgress();
    initNewsletter();
    initNavbar();
    initMobileMenu();
    initKeyboardShortcuts();
    animateCounters();
    runTypingLoop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
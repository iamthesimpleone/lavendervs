const TRACKS = [
  { slug: "will-you-bring-it-in",    title: "Will You Bring It In" },
  { slug: "christmas-party",         title: "Christmas Party" },
  { slug: "never-quite-time",        title: "Never Quite Time" },
  { slug: "man-in-the-glass-house",  title: "Man In The Glass House" },
  { slug: "not-a-world",             title: "Not A World" },
  { slug: "just-what-you-said",      title: "Just What You Said" },
  { slug: "capsized",                title: "Capsized" },
  { slug: "footloose",               title: "Footloose" },
  { slug: "fascination-waters",      title: "Fascination Waters" },
  { slug: "texas-cactus",            title: "Texas Cactus" },
];

function initSite() {
  document.getElementById("year").textContent = new Date().getFullYear();

  buildTracklist();
  bindLyricToggles();
  bindPlayButtons();
  bindPlayerClose();
}

initSite();

function buildTracklist() {
  const ol = document.getElementById("tracklist");
  ol.innerHTML = TRACKS.map(t => `
    <li class="track" data-slug="${t.slug}">
      <div class="track-head">
        <div class="track-actions">
          <button class="play-btn" data-play aria-label="Play ${escapeAttr(t.title)}">▶</button>
        </div>
        <span class="track-num"></span>
        <span class="track-title">${escapeHtml(t.title)}</span>
        <button class="lyrics-toggle" data-lyrics>Lyrics</button>
      </div>
      <div class="lyrics"><div class="lyrics-inner" data-lyrics-body>Loading…</div></div>
    </li>
  `).join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

// ---------- Lyrics toggle ----------
const lyricsCache = new Map();

async function loadLyrics(slug) {
  if (lyricsCache.has(slug)) return lyricsCache.get(slug);
  try {
    const res = await fetch(`lyrics/${slug}.txt`);
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    lyricsCache.set(slug, text);
    return text;
  } catch (e) {
    return "Lyrics unavailable.";
  }
}

function bindLyricToggles() {
  document.querySelectorAll(".track").forEach(track => {
    const btn = track.querySelector("[data-lyrics]");
    const body = track.querySelector("[data-lyrics-body]");
    btn.addEventListener("click", async () => {
      const isOpen = track.classList.contains("open");
      if (isOpen) {
        track.classList.remove("open");
        return;
      }
      body.textContent = await loadLyrics(track.dataset.slug);
      track.classList.add("open");
    });
  });
}

// ---------- Shared audio player ----------
const player = {
  el: null,
  audio: null,
  title: null,
  sub: null,
  currentBtn: null,
};

function setupPlayer() {
  player.el = document.getElementById("player");
  player.audio = document.getElementById("audio");
  player.title = document.getElementById("player-title");
  player.sub = document.getElementById("player-sub");

  player.audio.addEventListener("ended", () => {
    if (player.currentBtn) {
      player.currentBtn.classList.remove("playing");
      player.currentBtn.textContent = "▶";
    }
    player.currentBtn = null;
  });
}

function playTrack(btn, slug, title, sub = "") {
  if (!player.el) setupPlayer();

  if (player.currentBtn && player.currentBtn !== btn) {
    player.currentBtn.classList.remove("playing");
    player.currentBtn.textContent = "▶";
  }

  if (player.currentBtn === btn && !player.audio.paused) {
    player.audio.pause();
    btn.classList.remove("playing");
    btn.textContent = "▶";
    return;
  }

  if (player.currentBtn === btn && player.audio.paused && player.audio.src) {
    player.audio.play();
    btn.classList.add("playing");
    btn.textContent = "❚❚";
    return;
  }

  player.audio.src = `audio/${slug}.mp3`;
  player.title.textContent = title;
  player.sub.textContent = sub;
  player.el.hidden = false;
  player.audio.play();
  btn.classList.add("playing");
  btn.textContent = "❚❚";
  player.currentBtn = btn;
}

function bindPlayButtons() {
  document.querySelectorAll(".track").forEach(track => {
    const btn = track.querySelector("[data-play]");
    const title = track.querySelector(".track-title").textContent;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      playTrack(btn, track.dataset.slug, title);
    });
  });
}

function bindPlayerClose() {
  document.getElementById("player-close").addEventListener("click", () => {
    if (player.audio) {
      player.audio.pause();
      player.audio.removeAttribute("src");
      player.audio.load();
    }
    if (player.currentBtn) {
      player.currentBtn.classList.remove("playing");
      player.currentBtn.textContent = "▶";
      player.currentBtn = null;
    }
    player.el.hidden = true;
  });
}

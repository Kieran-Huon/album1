// ---------- DATA ----------
const trips = [
  { id: "canada-2025", title: "Canada 2025", subtitle: "Québec → Montréal", cover: "photos/01.jpeg" },
  { id: "italie-2024", title: "Italie 2024", subtitle: "Rome, Florence, Venise", cover: "photos/02.jpeg" },
  { id: "espagne-2023", title: "Espagne 2023", subtitle: "Barcelone & plages", cover: "photos/03.jpeg" },
];

// IMPORTANT: uniformise tes extensions (01.jpeg -> 16.jpeg)
const basePhotos = [
  { src: "photos/01.jpeg", title: "Photo 01", tags: ["quebec"] },
  { src: "photos/02.jpeg", title: "Photo 02", tags: ["quebec"] },
  { src: "photos/03.jpeg", title: "Photo 03", tags: ["montreal"] },
  { src: "photos/04.jpeg", title: "Photo 04", tags: ["montreal"] },
  { src: "photos/05.jpeg", title: "Photo 05", tags: ["nature"] },
  { src: "photos/06.jpeg", title: "Photo 06", tags: ["montreal"] },
  { src: "photos/07.jpeg", title: "Photo 07", tags: ["quebec"] },
  { src: "photos/08.jpeg", title: "Photo 08", tags: ["nature"] },
  { src: "photos/09.jpeg", title: "Photo 09", tags: ["montreal"] },
  { src: "photos/10.jpeg", title: "Photo 10", tags: ["quebec"] },
  { src: "photos/11.JPG", title: "Photo 11", tags: ["nature"] }, // <- évite 11.JPG
  { src: "photos/12.jpeg", title: "Photo 12", tags: ["montreal"] },
  { src: "photos/13.jpeg", title: "Photo 13", tags: ["quebec"] },
  { src: "photos/14.jpeg", title: "Photo 14", tags: ["nature"] },
  { src: "photos/15.jpeg", title: "Photo 15", tags: ["montreal"] },
  { src: "photos/16.jpeg", title: "Photo 16", tags: ["montreal"] },
];

// ---------- HELPERS ----------
function $(sel){ return document.querySelector(sel); }
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// ---------- PAGE: HOME ----------
function initHome(){
  const tripsEl = $("#trips");
  if (!tripsEl) return;

  tripsEl.innerHTML = trips.map(t => `
    <article class="trip" data-id="${t.id}">
      <img src="${t.cover}" alt="${t.title}" loading="lazy" />
      <div class="info">
        <h3>${t.title}</h3>
        <p>${t.subtitle}</p>
      </div>
    </article>
  `).join("");

  tripsEl.addEventListener("click", (e) => {
    const card = e.target.closest(".trip");
    if (!card) return;
    const id = card.dataset.id;
    window.location.href = `album.html?trip=${encodeURIComponent(id)}`;
  });
}

// ---------- PAGE: ALBUM ----------
function initAlbum(){
  const grid = $("#grid");
  if (!grid) return; // pas sur album.html

  const search = $("#search");
  const filter = $("#filter");

  // titre dynamique selon voyage
  const tripId = getParam("trip") || trips[0].id;
  const trip = trips.find(t => t.id === tripId) || trips[0];
  const albumTitle = $("#albumTitle");
  const albumSubtitle = $("#albumSubtitle");
  if (albumTitle) albumTitle.textContent = trip.title + " ✈️";
  if (albumSubtitle) albumSubtitle.textContent = trip.subtitle;

  // Pour l'instant: mêmes photos pour tous les voyages
  const photos = [...basePhotos];

  let currentList = [...photos];
  let currentIndex = 0;

  // Lightbox
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  const closeBtn = $("#closeBtn");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");

  // Slideshow controls
  const slideshowBtn = $("#slideshowBtn");
  const playPauseBtn = $("#playPauseBtn");
  const speedSelect = $("#speedSelect");
  const fullscreenBtn = $("#fullscreenBtn");

  let isPlaying = false;
  let timer = null;

  function render(list){
    grid.innerHTML = "";
    list.forEach((p, idx) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="badges">
          ${p.tags.map(t => `<span class="badge">${t}</span>`).join("")}
        </div>
        <img src="${p.src}" alt="${p.title}" loading="lazy" />
        <div class="caption">${p.title}</div>
      `;
      card.addEventListener("click", () => openLightbox(idx, list));
      grid.appendChild(card);
    });
  }

  function applyFilters(){
    const q = (search.value || "").toLowerCase().trim();
    const f = filter.value;

    const list = photos.filter(p => {
      const matchesText = !q || p.title.toLowerCase().includes(q) || p.tags.join(" ").includes(q);
      const matchesFilter = (f === "all") || p.tags.includes(f);
      return matchesText && matchesFilter;
    });

    currentList = list;
    render(list);
  }

  function showInLightbox(photo){
    lbImg.src = photo.src;
    lbImg.alt = photo.title;
    lbCap.textContent = photo.title;
  }

  function openLightbox(index, list){
    currentIndex = index;
    showInLightbox(list[currentIndex]);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox(){
    stopSlideshow();
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function prev(){
    if (!currentList.length) return;
    currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    showInLightbox(currentList[currentIndex]);
  }

  function next(){
    if (!currentList.length) return;
    currentIndex = (currentIndex + 1) % currentList.length;
    showInLightbox(currentList[currentIndex]);
  }

  function startSlideshow(){
    if (!currentList.length) return;
    isPlaying = true;
    if (playPauseBtn) playPauseBtn.textContent = "⏸ Pause";
    clearInterval(timer);
    const delay = Number(speedSelect?.value || 2500);
    timer = setInterval(next, delay);
  }

  function stopSlideshow(){
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.textContent = "▶ Lecture";
    clearInterval(timer);
    timer = null;
  }

  function toggleSlideshow(){
    if (!lightbox.classList.contains("open")) {
      // ouvre la première image filtrée
      if (!currentList.length) return;
      openLightbox(0, currentList);
    }
    if (isPlaying) stopSlideshow();
    else startSlideshow();
  }

  async function toggleFullscreen(){
    try{
      if (!document.fullscreenElement) {
        await lightbox.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch(e){
      console.warn("Fullscreen non dispo:", e);
    }
  }

  // events
  search.addEventListener("input", applyFilters);
  filter.addEventListener("change", applyFilters);

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
    if (e.key.toLowerCase() === " ") { e.preventDefault(); toggleSlideshow(); }
  });

  slideshowBtn?.addEventListener("click", toggleSlideshow);
  playPauseBtn?.addEventListener("click", toggleSlideshow);

  speedSelect?.addEventListener("change", () => {
    if (isPlaying) startSlideshow(); // relance avec nouveau délai
  });

  fullscreenBtn?.addEventListener("click", toggleFullscreen);

  // init
  applyFilters();
}

// ---------- BOOT ----------
initHome();
initAlbum();

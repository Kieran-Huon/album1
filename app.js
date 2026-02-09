// 1) Liste de photos (tu peux en ajouter autant que tu veux)
const photos = [
  { src: "photos/01.jpeg", title: "Vieux-Québec", tags: ["quebec", "ville"] },
  { src: "photos/02.jpeg", title: "Chute en forêt", tags: ["nature"] },
  { src: "photos/03.jpeg", title: "Montréal de nuit", tags: ["montreal", "ville"] },
  { src: "photos/04.jpeg", title: "Vieux-Québec", tags: ["quebec", "ville"] },
  { src: "photos/05.jpeg", title: "Chute en forêt", tags: ["nature"] },
  { src: "photos/06.jpeg", title: "Montréal de nuit", tags: ["montreal", "ville"] },
  { src: "photos/07.jpeg", title: "Vieux-Québec", tags: ["quebec", "ville"] },
  { src: "photos/08.jpeg", title: "Chute en forêt", tags: ["nature"] },
  { src: "photos/09.jpeg", title: "Montréal de nuit", tags: ["montreal", "ville"] },
  { src: "photos/10.jpeg", title: "Vieux-Québec", tags: ["quebec", "ville"] },
  { src: "photos/11.JPG", title: "Chute en forêt", tags: ["nature"] },
  { src: "photos/12.jpeg", title: "Montréal de nuit", tags: ["montreal", "ville"] },
  { src: "photos/13.jpeg", title: "Vieux-Québec", tags: ["quebec", "ville"] },
  { src: "photos/14.jpeg", title: "Chute en forêt", tags: ["nature"] },
  { src: "photos/15.jpeg", title: "Montréal de nuit", tags: ["montreal", "ville"] },
  { src: "photos/16.jpeg", title: "Montréal de nuit", tags: ["montreal", "ville"] },
];

// 2) Rendu de la grille
const grid = document.querySelector("#grid");
const search = document.querySelector("#search");
const filter = document.querySelector("#filter");

let currentList = [...photos];
let currentIndex = 0;

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

search.addEventListener("input", applyFilters);
filter.addEventListener("change", applyFilters);

// 3) Lightbox (plein écran)
const lightbox = document.querySelector("#lightbox");
const lbImg = document.querySelector("#lbImg");
const lbCap = document.querySelector("#lbCap");
const closeBtn = document.querySelector("#closeBtn");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");

function openLightbox(index, list){
  currentIndex = index;
  showInLightbox(list[currentIndex]);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox(){
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showInLightbox(photo){
  lbImg.src = photo.src;
  lbImg.alt = photo.title;
  lbCap.textContent = photo.title;
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
});

// Init
applyFilters();

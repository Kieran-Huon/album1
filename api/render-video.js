const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

// Utilitaire : fetch en buffer (Node 18+ a fetch natif)
async function fetchToFile(url, filepath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
}

// Sécurité : on n'autorise que des images venant de ton domaine
function isAllowedUrl(urlStr, origin) {
  try {
    const u = new URL(urlStr, origin);

    // Autorise uniquement les fichiers sous /photos/
    // (tu peux élargir si besoin)
    if (u.origin !== origin) return false;
    if (!u.pathname.startsWith("/photos/")) return false;

    // Extensions autorisées
    const ext = path.extname(u.pathname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return false;

    return true;
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  try {
    // Body JSON
    const { images, secondsPerImage = 1.5, width = 1280, height = 720, filename = "vacances.mp4" } = req.body || {};

    if (!Array.isArray(images) || images.length < 1) {
      res.status(400).json({ error: "images[] requis" });
      return;
    }

    // Origin (domaine actuel)
    const origin =
      (req.headers["x-forwarded-proto"] ? `${req.headers["x-forwarded-proto"]}://` : "https://") +
      (req.headers["x-forwarded-host"] || req.headers.host);

    // Vérif URLs
    for (const url of images) {
      if (!isAllowedUrl(url, origin)) {
        res.status(400).json({ error: "URL non autorisée (doit être sur /photos/)" });
        return;
      }
    }

    // Dossier temporaire
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "album-"));
    const framesDir = path.join(tmpDir, "frames");
    fs.mkdirSync(framesDir);

    // 1) Télécharge les images + convertit en frames numérotées
    // On les nomme frame_0001.jpg, frame_0002.jpg, ...
    for (let i = 0; i < images.length; i++) {
      const n = String(i + 1).padStart(4, "0");
      const outPath = path.join(framesDir, `frame_${n}.jpg`);
      await fetchToFile(images[i], outPath);
    }

    // 2) On crée la vidéo avec ffmpeg :
    // - framerate = 1/secondsPerImage (ex: 1/1.5 = 0.666.. fps)
    // - scale pour uniformiser en 1280x720
    // - libx264 + yuv420p = compatibilité iPhone/WhatsApp/Instagram
    const outputPath = path.join(tmpDir, "out.mp4");
    const framerate = (1 / Number(secondsPerImage)).toString();

    const args = [
      "-y",
      "-framerate", framerate,
      "-i", path.join(framesDir, "frame_%04d.jpg"),
      "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-r", "30",
      outputPath
    ];

    await new Promise((resolve, reject) => {
      const p = spawn(ffmpegPath, args);

      let stderr = "";
      p.stderr.on("data", d => (stderr += d.toString()));

      p.on("close", code => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg failed (${code}): ${stderr}`));
      });
    });

    const videoBuffer = fs.readFileSync(outputPath);

    // Nettoyage best-effort
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

    // Réponse MP4 + download
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(videoBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur génération vidéo", detail: String(err.message || err) });
  }
};

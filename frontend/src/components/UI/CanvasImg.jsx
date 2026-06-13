export const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/);

  if (!parts.length) return "";

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};

export const getAvatarColor = (name = "") => {
  const colors = [
    "var(--primary-color)",
    "#8B5CF6",
    "#10B981",
    "#F59E0B",
    "#EC4899",
    "#EF4444",
    "#06B6D4",
    "#6366F1",
  ];

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash % colors.length)];
};

const avatarCache = new Map();

export const getInitialsImage = (name, size = 80) => {
  if (!name || typeof document === "undefined") return "";

  const cacheKey = `${name}_${size}`;

  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey);
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  const bgColor = getAvatarColor(name);

  // Circle Background
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Initials
  ctx.fillStyle = "#fff";
  ctx.font = `400 ${size * 0.4}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getInitials(name), size / 2, size / 2);

  const image = canvas.toDataURL("image/png");

  avatarCache.set(cacheKey, image);

  return image;
};
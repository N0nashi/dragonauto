/**
 * Bidirectionally translates auto-generated request descriptions.
 * DB may store either Russian or English form depending on UI language at creation time.
 * This function normalises the display without touching the DB.
 */
export function translateDesc(desc, lang) {
  if (!desc) return desc;

  if (lang === "en") {
    // RU → EN
    const partMatch = desc.match(/^Заявка на запчасть (.+?) для (.+)$/);
    if (partMatch) return `Request for spare part ${partMatch[1]} for ${partMatch[2]}`;
    const carMatch = desc.match(/^Заявка на (.+)$/);
    if (carMatch) return `Request for ${carMatch[1]}`;
  } else {
    // EN → RU
    const partMatch = desc.match(/^Request for spare part (.+?) for (.+)$/);
    if (partMatch) return `Заявка на запчасть ${partMatch[1]} для ${partMatch[2]}`;
    const carMatch = desc.match(/^Request for (.+)$/);
    if (carMatch) return `Заявка на ${carMatch[1]}`;
  }

  return desc;
}

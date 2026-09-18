/**
 * 📱 WhatsApp Message Formatting Utilities
 *
 * Converts standard Markdown into clean WhatsApp-compatible text:
 * - **bold** → *bold*
 * - ### Header → *Header*
 * - `code` → ```code```
 * - Cleans up formatting artifacts for crisp WhatsApp mobile reading.
 */

export function formatWhatsAppText(text: string): string {
  if (!text) return "";

  let formatted = text
    // Convert HTML breaks
    .replace(/<br\s*\/?>/gi, "\n")
    // Remove markdown table divider rows (e.g. |---|---|)
    .replace(/^\|?[\s-:]+\|?$/gm, "")
    // Convert table rows to plain text without pipes (e.g. | col1 | col2 | -> col1 - col2)
    .replace(/^\|(.*)\|$/gm, (match, p1) => {
      const cols = p1.split('|').map((s: string) => s.trim()).filter(Boolean);
      return `• ${cols.join(' - ')}`;
    })
    // Convert markdown headers ### Title to *Title*
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    // Convert markdown bold **text** to WhatsApp bold *text* (multiline safe)
    .replace(/\*\*([\s\S]+?)\*\*/g, "*$1*")
    // Convert markdown bold-italic ***text*** to WhatsApp *_text_*
    .replace(/\*\*\*(.+?)\*\*\*/g, "*_$1_*")
    // Remove markdown links [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2")
    // Ensure clean bullet points (if not already formatted as our new list items)
    .replace(/^-\s+/gm, "• ");

  // Cleanup multiple blank lines left by removing table dividers
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
}

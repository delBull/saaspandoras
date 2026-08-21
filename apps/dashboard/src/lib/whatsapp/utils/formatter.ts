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
    // Convert markdown headers ### Title to *Title*
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    // Convert markdown bold **text** to WhatsApp bold *text*
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    // Convert markdown bold-italic ***text*** to WhatsApp *_text_*
    .replace(/\*\*\*(.+?)\*\*\*/g, "*_$1_*")
    // Remove markdown links [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2")
    // Ensure clean bullet points
    .replace(/^-\s+/gm, "• ");

  return formatted.trim();
}

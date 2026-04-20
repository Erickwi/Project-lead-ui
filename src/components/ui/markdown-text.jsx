import { cn } from "@/lib/utils";

/**
 * Renders simple markdown produced by the backend's adfToText.
 * Supports: # headings, **bold**, _italic_, `code`, - lists, > blockquote, ---
 */
function renderInline(text) {
  // Split on bold, italic, code marks
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|_(.+?)_|`(.+?)`)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>);
    else if (match[4])
      parts.push(
        <code key={match.index} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
          {match[4]}
        </code>,
      );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

export function MarkdownText({ text, className }) {
  if (!text) return null;

  const blocks = text.split(/\n\n+/);

  const rendered = blocks.map((block, bi) => {
    const lines = block.split("\n");
    const first = lines[0];

    // Headings
    const hMatch = first.match(/^(#{1,3}) (.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const content = renderInline(hMatch[2]);
      if (level === 1)
        return (
          <p key={bi} className="font-bold text-sm text-foreground mt-0.5">
            {content}
          </p>
        );
      if (level === 2)
        return (
          <p key={bi} className="font-semibold text-sm text-foreground mt-0.5">
            {content}
          </p>
        );
      return (
        <p key={bi} className="font-medium text-sm text-foreground mt-0.5">
          {content}
        </p>
      );
    }

    // Horizontal rule
    if (first.trim() === "---") {
      return <hr key={bi} className="border-border my-1" />;
    }

    // Bullet list
    if (lines.every((l) => l.startsWith("- ") || l.startsWith("  "))) {
      return (
        <ul key={bi} className="list-disc list-inside space-y-0.5">
          {lines
            .filter((l) => l.startsWith("- "))
            .map((l, li) => (
              <li key={li} className="text-sm text-muted-foreground">
                {renderInline(l.slice(2))}
              </li>
            ))}
        </ul>
      );
    }

    // Numbered list
    if (lines.every((l) => /^\d+\. /.test(l) || l.startsWith("  "))) {
      return (
        <ol key={bi} className="list-decimal list-inside space-y-0.5">
          {lines
            .filter((l) => /^\d+\. /.test(l))
            .map((l, li) => (
              <li key={li} className="text-sm text-muted-foreground">
                {renderInline(l.replace(/^\d+\. /, ""))}
              </li>
            ))}
        </ol>
      );
    }

    // Blockquote
    if (lines.every((l) => l.startsWith("> "))) {
      return (
        <blockquote key={bi} className="border-l-2 border-border pl-3 text-sm text-muted-foreground italic">
          {lines.map((l) => l.slice(2)).join(" ")}
        </blockquote>
      );
    }

    // Regular paragraph (may have inline \n as hard breaks)
    const inlineLines = block.split("\n").map((l, li, arr) => (
      <span key={li}>
        {renderInline(l)}
        {li < arr.length - 1 && <br />}
      </span>
    ));
    return (
      <p key={bi} className="text-sm text-muted-foreground leading-relaxed">
        {inlineLines}
      </p>
    );
  });

  return <div className={cn("space-y-1.5", className)}>{rendered}</div>;
}

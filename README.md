📝 [axeldelafosse.com](https://axeldelafosse.com)

🔊 [sweetspotsoundsystem.com](https://sweetspotsoundsystem.com)

🧑‍🚀 [pro.sweetspotsoundsystem.com](https://pro.sweetspotsoundsystem.com)

🌀 [sweetspot.stream](https://sweetspot.stream)

🎛️ [stemgen.dev](https://stemgen.dev)

## Editing posts locally

Run `bun run dev`, open a post at `http://localhost:3000/blog/<slug>`, and click **edit ✍︎** in the header.

The local editor shows the Markdown (including frontmatter) beside a live preview. Click **Save**, or press **⌘S / Ctrl+S**, to write to the existing `blog/<slug>.mdx` file. Saving does not publish, commit, or change dates automatically. On small screens, switch between Markdown and Preview.

Click text in the preview to edit it directly. Headings, paragraphs, list items, table cells, link labels, and inline code keep their surrounding Markdown formatting. Press Enter (or Shift+Enter) for a new line in text; press Escape or click elsewhere to finish. Line breaks and blank lines are saved as inline `<br />` elements, so they survive reopening without changing the surrounding structure. Multiline paste works too. Changes appear in the Markdown pane but are not written to disk until you save. Use the Markdown pane for new paragraphs or list items, formatting, link destinations, multiline code, and MDX embeds.

Unsaved drafts are kept in the current browser tab across reloads. If the file changes in another editor, saving is blocked rather than overwriting those changes; copy your draft before using **Reload file**. Closing with unsaved changes asks for confirmation.

Editing is enabled only in development through a loopback address (`localhost`, `127.0.0.1`, or `[::1]`). Production has no edit button and its local editing API returns 404. Only existing root-level blog posts can be edited; drafts, archives, and arbitrary files are not exposed.

## Blog checks

`bun run build` validates post metadata, checks TypeScript, and checks the generated pages for canonical URLs, missing internal pages, and broken section links. Publication dates determine the index order; the listing displays only the latest-updated date. All dates are formatted in UTC to preserve the authored calendar day.

Small “previous” (older) and “next” (newer) links follow publication order automatically. They sit outside the reading column on wide screens and below the post on smaller screens. The header still links back to the blog. No recommendation engine or subscription UI is involved.

Run `bun run test:blog` for navigation, metadata, and tweet-rendering regressions; `bun run typecheck` for a standalone type check. After building, `bun run check:site --external` also checks external links. Network failures and blocked requests are reported as inconclusive, while confirmed 404/410 responses fail that optional check. External services are never contacted by the normal build checks.

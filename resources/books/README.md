# Local books (not committed)

Put PDFs / spreadsheets you own here and ask Claude to research them (`research-book` agent). They are
git-ignored because they're copyrighted. What gets committed is `resources/refs/<source>.json`:
page-numbered references with one-line summaries in our own words, never copied text or solutions.
Sources registered with `access: "local"` in `resources/sources.json` name a file in this folder; a
clone without the file still shows the references, just without the local page link.

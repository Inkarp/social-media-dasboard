# Post formats rollout

For an existing database, run `migrations/0006_post_formats.sql` in the project's Supabase SQL Editor. Use `setup.sql` only for a complete setup. Both paths are tested and repeatable.

The migration preserves every existing post with a null format, displayed as **Not classified**. It does not guess content types. New posts require `static`, `carousel`, `reel`, or `video`. Editing a legacy post through the form requires choosing its format; moving its workflow status on the board can leave it unclassified.

Dashboard and Principals charts count published and pending activity separately for each format. Format filters narrow activity, while targets remain overall principal targets. Channel and workflow status are independent of format.

Spreadsheet imports require a **Post format** column. Download the updated template; accepted labels are Static, Carousel, Reel, and Video, case-insensitively. Invalid/missing formats are reported by spreadsheet row. Exported legacy posts must be classified before re-importing.

Until the migration is applied, existing pages remain readable, legacy activity appears as Not classified, and post creation/full editing/imports show a setup message. No data is silently assigned a format. Refresh after applying the migration to enable the feature.

Validation: `npm run verify`, `npm run typecheck`, and `npm run build` (set `NEXT_DIST_DIR=.next-verify` when a dev server is running).

## Summary

<!-- What does this change do? -->

## Release behavior (read me)

- The **PR title** (Conventional Commit) becomes the **squash commit**; semantic-release uses it.
- If **multiple PRs** are merged since the last tag, they are **bundled into one release**. The next version is the **highest bump** required among those PRs (e.g., any `feat` → minor; any breaking → major).

## Title examples (use one of these styles)

- `feat: add play() API`
- `fix: handle EPIPE on stdin`
- `refactor!: drop Node 16`
  - Footer (if breaking):
    ```
    BREAKING CHANGE: Requires Node 18+
    ```

## Checklist

- [ ] PR title follows Conventional Commits
- [ ] Tests/lint pass
- [ ] Docs updated (if needed)
- [ ] Breaking change marked with `!` or `BREAKING CHANGE:` footer

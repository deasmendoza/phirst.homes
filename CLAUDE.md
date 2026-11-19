# phirst.homes — rules for every Claude chat working on this repo

The owner runs several chats at once (often one per website section). These rules keep
everyone on the same, newest code and keep Netlify untouched until she asks.

## 1. Always work on the newest code: branch `claude/latest`

`claude/latest` holds the newest version of the whole site. It is the only shared branch.

- Before you start, and again right before every push:
  `git fetch origin claude/latest` then `git rebase origin/claude/latest`
  (or merge it). Never start from an older branch, a pull request branch, or `main`-like
  branches without checking `claude/latest` first.
- Push finished work to `claude/latest` (`git push origin HEAD:claude/latest`). The owner
  gives standing permission for this. If the push is rejected because someone else pushed
  first, fetch, rebase onto `origin/claude/latest`, re-run the build, and push again.
  Never force-push.
- Your session may also have its own `claude/...` branch; pushing there as well is fine,
  but `claude/latest` must always end up with your work.

## 2. Do not trigger Netlify

Netlify credits are limited. Until the owner says otherwise:

- Do not open pull requests, and do not push to `claude/stoic-pascal-n74t5s` (production)
  or to any branch that has an open pull request (those start Netlify builds).
- Put `[skip netlify]` in every commit message as a safeguard.
- The owner will ask when she wants a preview or a release.

## 3. Before you push

- `npm run build` must pass.
- If you touched `lib/compute.ts` or `components/calculator.tsx`, the calculator must still
  match the official Excel templates; do not invent prices, rates, discounts or terms.
- Do not change other sections than the one you were asked about.

## 4. Talking to the owner

Reply in Taglish, plainly. She is a designer, not a developer.

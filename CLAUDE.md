# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Repository Purpose

This is a **redirect site** for the NerdType typing game. The actual game has moved to [nerdtypegame.org](https://nerdtypegame.org).

## What This Repo Does

- Redirects all traffic from nerdtypegame.com → nerdtypegame.org
- Preserves URL paths during redirect
- Shows a branded redirect page for user trust

## Files Structure

**Keep these files:**

- `index.html` - Main redirect page with logo and branding
- `404.html` - Catches all other URLs and redirects them
- `js/redirect.js` - JavaScript redirect logic
- `images/logo-text-no-keyboard.png` - Logo for redirect page
- `images/logo-no-keyboard-blue-bg-*.png` - Favicon files
- `font/JetBrainsMonoNLNerdFont-Light.ttf` - Custom font
- `favicon.png` - Main favicon
- `README.md` - Documentation
- `.git/` - Version control
- `.claude/` - Claude Code configuration

**Everything else has been archived** - the old game code is no longer in this repo.

## Development Notes

- This is a static site hosted on GitHub Pages
- No build system required
- Changes to redirect logic should be made in `js/redirect.js`
- Redirect delay is currently set to 5 seconds

## Important

**Do not add game features or code to this repository.** This is solely for redirecting traffic to the new domain.

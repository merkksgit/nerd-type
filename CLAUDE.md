# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NerdType is a fast-paced, minimalistic typing game built with vanilla HTML, CSS, and JavaScript. It's a client-side web application with multilingual support, multiple game modes, achievements system, and global leaderboards. The project uses vanilla web technologies without a build system - it's designed to run directly in browsers and is hosted on GitHub Pages.

## Project Structure

This is a static web application with the following architecture:

- **Root HTML files**: `index.html` (landing page), pages in `/pages/` directory
- **JavaScript modules**: Located in `/js/` - uses ES6 modules for organization
- **Styling**: Custom CSS in `/css/` with Bootstrap for responsive design
- **Assets**: Fonts (`/font/`), images (`/images/`), sounds (`/sounds/`)

## Key Architecture Components

### Core Game System

- **Game Logic**: Main game mechanics handled across multiple files:
  - `pages/game.html` - Main game interface
  - Game state management through localStorage
  - Real-time energy/timer system with countdown mechanics

### Game Commands (`js/game-commands.js`)

- In-game slash commands (e.g., `/setwords`, `/mode`, `/help`)
- Allows players to modify settings without opening menus
- Automatic game reload after certain configuration changes
- Command validation and error handling

### Achievement System (`js/achievements.js`)

- Comprehensive achievement tracking with categories:
  - Score-based achievements
  - Speed/WPM achievements
  - Gameplay style achievements
  - Daily play frequency achievements
  - Language-specific achievements
  - Secret/hidden achievements
- Persistent achievement data in localStorage
- Toast notification system for achievement unlocks
- Achievement rendering for achievements page

### Word List Management

- Multiple language support: English, Finnish, Swedish, Programming terms, "Nightmare" mode
- Dynamic word list loading
- Language-specific WPM tracking for achievements

### Settings System

- Game modes: Classic, Hard, Practice, Speedrunner, Zen, Custom
- Persistent settings storage in localStorage
- Real-time settings updates through custom events
- Modal-based settings interface

## Development Commands

This project has no build system or package.json - it runs directly in browsers:

**Local Development:**

- Use any local web server (e.g., `python -m http.server`, Live Server extension)
- All files can be edited directly
- Changes are immediately visible on refresh

**Testing:**

- Manual testing in browser
- No automated test framework currently implemented

**Deployment:**

- Static hosting via GitHub Pages
- All files are deployed as-is to production

## Important Implementation Details

### Data Persistence

- All user data stored in browser localStorage
- No backend database - fully client-side application
- Achievement data, game results, and settings persist across sessions
- Data collection toggle for global leaderboards (optional)

### Global Leaderboard System

- Optional data sharing to external Firebase service
- User can disable data collection entirely
- Seasonal competitive system with leaderboard resets

### Game Modes

- **Classic/Hard/Practice/Speedrunner**: Traditional energy-based typing with different parameters
- **Zen Mode**: No energy limit, word goal-based completion
- **Custom Mode**: User-defined parameters

### Slash Commands (In-Game)

Available during gameplay with `/` prefix:

- `/setwords <n>` - Set word goal
- `/mode <type>` - Change mode
- `/zen` - Toggle Zen mode
- `/lang <language>` - Switch language
- `/sound` - Toggle keypress sounds
- `/data` - Toggle data collection
- `/reset` - Reset to defaults

## Code Conventions

- Vanilla JavaScript with ES6 modules
- Class-based architecture for major systems
- Event-driven communication between modules using CustomEvents
- Extensive use of localStorage for persistence
- Bootstrap classes for responsive design
- FontAwesome icons throughout UI
- Consistent color scheme using CSS custom properties

### Code Formatting

- Use Prettier default formatting for all code (JavaScript, CSS, HTML, JSON)
- 2-space indentation
- Semicolons in JavaScript
- Double quotes for strings
- Trailing commas where valid
- Line length limit of 80 characters

### Commenting Guidelines

- Write professional comments that explain what the code does, not that it's a fix or improvement
- Avoid references to previous versions, fixes, or changes (no "fix:", "better version", etc.)
- Use JSDoc comments for functions and classes
- Focus on explaining complex logic, business rules, or non-obvious behavior
- Use descriptive variable/function names to reduce need for comments

### Commit Message Guidelines

Use these prefixes for commit messages:

- `feat`: A new feature
- `balance`: For gameplay balance changes, tuning, or adjustments to game mechanics
- `impr`: An improvement to an existing feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature, but makes the code easier to read, understand, or improve
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `revert`: Reverts a previous commit
- `chore`: Other changes that don't apply to any of the above

## File Naming Patterns

- JavaScript files: kebab-case (e.g., `game-commands.js`)
- CSS files: kebab-case (e.g., `settings-modal.css`)
- Image files: kebab-case with descriptive names
- Data files: descriptive names for game data storage

## Key Configuration Files

- Settings stored in localStorage as `gameSettings`
- Achievement data in localStorage as `nerdtype_achievements`
- Game results in localStorage as `gameResults`
- Username in localStorage as `nerdtype_username`

## Notable Features

- **Easter Eggs**: Various hidden features and achievements
- **Responsive Design**: Mobile-optimized with device-specific adaptations
- **Accessibility**: Keyboard navigation support
- **Internationalization**: Multi-language word lists and UI elements
- **Analytics**: Google Analytics integration for usage tracking

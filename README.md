![nerdtype](./images/nt-logo-text-link.png)

# NerdType

A fast-paced, minimalistic typing game built with vanilla web technologies. Challenge yourself with multilingual vocabulary including programming terms, English, Finnish, and Swedish words. Features energy-based gameplay, multiple game modes, achievements system, and global leaderboards.

<!-- vim-markdown-toc GFM -->

* [Key Features](#key-features)
    * [Core Gameplay](#core-gameplay)
    * [Advanced Features](#advanced-features)
    * [User Experience](#user-experience)
* [How to Play](#how-to-play)
* [Game Modes](#game-modes)
* [Achievement System](#achievement-system)
* [Technical Details](#technical-details)
    * [Architecture](#architecture)
    * [Project Structure](#project-structure)
    * [In-Game Commands](#in-game-commands)
* [Development](#development)
    * [Quick Start](#quick-start)
    * [Development Setup](#development-setup)
    * [Code Conventions](#code-conventions)
* [Customization](#customization)
* [Platform Support](#platform-support)
* [Contact](#contact)

<!-- vim-markdown-toc -->

## Key Features

### Core Gameplay

- **Energy-Based System**: Type words correctly to restore energy to stay in the game
- **Multilingual Support**: Programming terms, English, Finnish, Swedish, and "Nightmare" mode
- **Multiple Game Modes**: Classic, Hard, Practice, Speedrunner, Zen, and Custom
- **Real-Time Progress**: Visual progress tracking and WPM calculation

### Advanced Features

- **Slash Commands**: In-game commands (e.g., `/setwords`, `/mode`, `/help`) for quick settings changes
- **Achievement System**: Comprehensive tracking with score, speed, gameplay style, and secret achievements
- **Global Leaderboards**: Optional seasonal competitive system with Firebase integration
- **Persistent Progress**: All data stored locally in browser with optional cloud sync

### User Experience

- **Responsive Design**: Optimized for desktop and mobile with Bootstrap
- **Accessibility**: Full keyboard navigation support
- **Customization**: Extensive settings, custom difficulty modes, and personalization options
- **No Build Required**: Pure vanilla JavaScript - runs directly in any modern browser

## How to Play

1. **Start**: Click Start or press Enter to begin
2. **Type**: Enter the displayed word before your energy depletes
3. **Progress**: Each correct word restores energy and advances your hack
4. **Commands**: Use `/` prefix during gameplay for quick settings (try `/help`)
5. **Win**: Complete your word goal or survive until energy runs out

## Game Modes

| Mode            | Description                                             |
| --------------- | ------------------------------------------------------- |
| **Classic**     | Balanced gameplay with standard energy mechanics        |
| **Hard**        | Tighter time constraints for experienced players        |
| **Practice**    | Extended time limits perfect for learning               |
| **Speedrunner** | Fast-paced mode                                         |
| **Zen**         | Relaxed mode with no energy limit, word goal-based      |
| **Custom**      | Create your own difficulty with personalized parameters |

## Achievement System

- **Score Achievements**: Reach specific point milestones
- **Speed Achievements**: Hit WPM targets and typing speeds
- **Gameplay Style**: Unlock rewards for different play patterns
- **Language Mastery**: Achievements for each supported language
- **Daily Streaks**: Rewards for consistent daily play
- **Secret Achievements**: Hidden unlockables to discover

## Technical Details

### Architecture

- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+ modules
- **Styling**: Bootstrap 5 for responsive design + custom CSS
- **Storage**: Browser localStorage for persistence
- **Backend**: Static hosting via GitHub Pages (no server required)
- **Analytics**: Firebase integration for global leaderboards (optional)

### Project Structure

```
├── index.html               # Landing page
├── pages/                   # Game pages (game.html, achievements.html, etc.)
├── js/                      # JavaScript modules
│   ├── game-commands.js     # Slash command system
│   ├── achievements.js      # Achievement tracking
│   ├── word-list-manager.js # Language and word management
│   └── ...
├── css/                     # Stylesheets
├── images/                  # Game assets and logos
├── sounds/                  # Audio files
└── font/                    # Typography assets
```

### In-Game Commands

Access with `/` prefix during gameplay:

- `/setwords <n>` - Set word completion goal
- `/mode <type>` - Switch game mode instantly
- `/zen` - Toggle Zen mode on/off
- `/lang <language>` - Change language (eng/fin/sve/prog/nm)
- `/sound` - Toggle keypress sound effects
- `/data` - Toggle global leaderboard data collection
- `/reset` - Reset all settings to defaults
- `/help` - Show all available commands

## Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/username/nerd-type.git
cd nerd-type
```

### Development Setup

- **No Build System**: Edit files directly, changes are immediate
- **Testing**: Manual testing in browser (no automated tests currently)
- **Deployment**: Static files deploy directly to GitHub Pages
- **Dependencies**: None - pure vanilla web technologies

### Code Conventions

- ES6+ JavaScript modules with class-based architecture
- Event-driven communication using CustomEvents
- Kebab-case file naming (`game-commands.js`)
- Bootstrap classes for responsive components
- FontAwesome icons for UI elements

## Customization

- **Fonts**: Various monospace fonts optimized for typing
- **Game Parameters**: Fully customizable difficulty settings
- **Keyboard Shortcuts**: Comprehensive keyboard navigation support

## Platform Support

- **Desktop**: Full feature support on all modern browsers
- **Mobile**: Responsive design with touch-optimized interface
- **Offline**: Works completely offline after initial load
- **Cross-Device**: Achievement sync available with optional cloud features

## Contact

- **Email**: nerdtype-contact@protonmail.com
- **Feedback**: [Contact Page](https://www.nerdtypegame.com/pages/contact.html)
- **Website**: [nerdtypegame.com](https://www.nerdtypegame.com)

---

Built with ❤️ using vanilla web technologies. No frameworks, no bloat, just pure typing game fun.


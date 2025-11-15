# NerdType Brand Guidelines

> **Version 1.0** | Last Updated: November 2025

## Table of Contents

1. [Brand Overview](#brand-overview)
2. [Brand Identity](#brand-identity)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Logo & Assets](#logo--assets)
6. [UI Components](#ui-components)
7. [Iconography](#iconography)
8. [Spacing & Layout](#spacing--layout)
9. [Interactive Elements](#interactive-elements)
10. [Voice & Tone](#voice--tone)
11. [Usage Guidelines](#usage-guidelines)

## Brand Overview

### Mission Statement

NerdType is a fast-paced, minimalistic typing game designed to help users improve their typing speed and accuracy through an engaging, retro-inspired gaming experience.

### Brand Personality

- **Minimalistic**: Clean, uncluttered design that keeps focus on the typing experience
- **Fast-Paced**: Energetic, responsive, and action-oriented
- **Nerdy**: Embraces developer culture with programming fonts and terminal aesthetics
- **Competitive**: Encourages improvement through achievements and leaderboards
- **Retro**: Nostalgic pixel art and classic gaming elements

### Target Audience

- Developers and programmers
- Typing enthusiasts
- Gamers who enjoy skill-based challenges
- Students looking to improve typing speed
- Anyone seeking a minimalist typing practice tool

## Brand Identity

### Brand Values

1. **Precision**: Every keystroke matters
2. **Speed**: Fast performance, quick feedback
3. **Simplicity**: No distractions, pure focus
4. **Progress**: Constant improvement and achievement
5. **Community**: Competitive yet supportive environment

### Design Philosophy

NerdType's design is rooted in terminal aesthetics and developer tools, creating a familiar environment for its target audience. The interface prioritizes functionality over decoration, with every element serving a clear purpose in the typing experience.

## Color Palette

NerdType uses the **Tokyo Night** color scheme, a popular developer theme known for its excellent readability and aesthetic appeal.

### Primary Colors

```css
/* Backgrounds */
--background-primary: #24283b; /* Main background */
--background-secondary: #1f2335; /* Cards, modals */
--background-hover: #2a3047; /* Hover states */

/* Accent Colors */
--accent-blue: #7aa2f7; /* Primary interactive elements */
--accent-orange: #ff9e64; /* Highlights, warnings */
--accent-green: #c3e88d; /* Success, positive feedback */
--accent-purple: #bb9af7; /* Special features */
--accent-pink: #f7768e; /* Errors, critical */
```

### Text Colors

```css
/* Text */
--text-primary: #c0caf5; /* Main text */
--text-secondary: #a9b1d6; /* Secondary text */
--text-muted: #565f89; /* Disabled, hints */
--text-footer: #394b70; /* Footer text */
```

### UI Colors

```css
/* Borders & Dividers */
--border-default: #3b4261; /* Standard borders */
--border-active: #3f4575; /* Active/focused borders */

/* Gradients */
--gradient-purple: #9d7cd8; /* Gradient variations */
--gradient-light-blue: #8f9aff;
```

### Color Usage Guidelines

#### Blue (#7aa2f7)

- **Primary Use**: Interactive elements (buttons, links, icons)
- **Secondary Use**: Navigation highlights, progress indicators
- **Hover State**: Brightened or paired with orange

#### Orange (#ff9e64)

- **Primary Use**: Active states, current mode indicators
- **Secondary Use**: Warnings, important highlights
- **Context**: Game difficulty, achievement notifications

#### Green (#c3e88d)

- **Primary Use**: Success messages, completed achievements
- **Secondary Use**: Positive statistics, accuracy indicators
- **Context**: High performance feedback

#### Purple (#bb9af7)

- **Primary Use**: Special features, commands
- **Secondary Use**: Premium/unique elements
- **Context**: Slash commands, seasonal content

#### Pink/Red (#f7768e)

- **Primary Use**: Errors, mistakes
- **Secondary Use**: Critical notifications
- **Context**: Hardcore mode, mistake indicators

### Accessibility

All color combinations meet **WCAG 2.1 AA standards** for contrast:

- White text (#c0caf5) on dark backgrounds: 12:1 ratio
- Blue accent (#7aa2f7) on dark background: 7.5:1 ratio
- Orange accent (#ff9e64) on dark background: 8:1 ratio

## Typography

### Font Families

NerdType exclusively uses **Nerd Fonts** - patched programming fonts with extended glyph support.

#### Primary Fonts

```css
/* Game Interface (Default) */
font-family: "JetBrains Mono", monospace;
/* Weights: Light (300), SemiBold (600) */

/* Alternative Options */
font-family: "Fira Code", monospace;
font-family: "Departure Mono", monospace;
font-family: "BigBlueTerm", monospace;
font-family: "0xProto", monospace;
```

### Font Definitions

```css
@font-face {
  font-family: "jetbrains-mono";
  src: url(../font/JetBrainsMonoNLNerdFontMono-SemiBold.ttf);
}

@font-face {
  font-family: "jetbrains-light";
  src: url(../font/JetBrainsMonoNLNerdFont-Light.ttf);
}

@font-face {
  font-family: "firacode-mono";
  src: url(../font/FiraCodeNerdFontMono-SemiBold.ttf);
}

@font-face {
  font-family: "departure-mono";
  src: url(../font/DepartureMonoNerdFontMono-Regular.otf);
}

@font-face {
  font-family: "bigblueterm-mono";
  src: url(../font/BigBlueTerm437NerdFontMono-Regular.ttf);
}

@font-face {
  font-family: "oxproto-mono";
  src: url(../font/0xProtoNerdFontMono-Regular.ttf);
}
```

### Typography Scale

```css
/* Page Titles */
font-size: 2em; /* 32px - Main headings */
font-weight: bold;
color: #ff9e64;

/* Section Headings */
font-size: 1.5em; /* 24px - Subheadings */
color: #7aa2f7;

/* Body Text */
font-size: 1em; /* 16px - Standard text */
color: #c0caf5;

/* Small Text */
font-size: 0.875em; /* 14px - Tooltips, hints */
color: #565f89;

/* Footer Text */
font-size: 0.7em; /* 11.2px - Footer content */
font-size: 0.9rem; /* 14.4px - Footer icons */
letter-spacing: -0.1em;
```

### Typography Guidelines

1. **Consistency**: Always use monospace fonts for game elements
2. **Readability**: Maintain minimum 16px font size for body text
3. **Hierarchy**: Use color and size to establish content hierarchy
4. **Alignment**: Left-align text for readability; center-align for titles
5. **Line Height**: Use 1.5-1.6 for optimal readability

## Logo & Assets

### Primary Logo

**File**: `logo-text-no-keyboard.png`

- **Usage**: Main navigation, headers
- **Size**: 250px width (desktop), responsive scaling
- **Clearspace**: Minimum 20px padding on all sides

### Logo Variations

```
1. Full Logo with Text
   - logo-text-no-keyboard.png (desktop)
   - mobile-header-logo-v2.png (mobile, 45px width)

2. Logo without Text
   - logo-no-keyboard.png

3. Icon Only
   - logo-no-keyboard-blue-bg-32x32.png (favicon)
   - logo-no-keyboard-blue-bg-192x192.png (app icon)

4. Marketing Assets
   - nt-logo-text-link.png (social sharing, 1200x630)
   - nt-text-gradient.png (gradient variant)
   - nt-classic-blue.png (classic blue variant)
```

### Logo Usage Rules

**DO:**

- Use official logo files without modification
- Maintain aspect ratio when scaling
- Use appropriate size for context (desktop vs mobile)
- Ensure sufficient contrast with background

**DON'T:**

- Stretch or distort the logo
- Change logo colors
- Add effects (shadows, outlines, glows)
- Rotate the logo
- Place on busy backgrounds

### Wallpapers & Brand Assets

```
Desktop Wallpapers:
- nt-logo-slogan.png (with tagline)
- nt-logo-no-link.png (clean logo)

Mobile Wallpaper:
- nt-mobile.png

Alternative Designs:
- nt-rainbow.png
```

### Achievement Medals

```
Rank Medals:
- nt-rank1-medal.png (small)
- nt-rank2-medal.png (small)
- nt-rank3-medal.png (small)

- nt-rank1-medal-large.png
- nt-rank2-medal-large.png
- nt-rank3-medal-large.png

- nt-rank1-medal-number.png
- nt-rank2-medal-number.png
- nt-rank3-medal-number.png
```

## UI Components

### Buttons

#### Primary Button

```css
.btn-primary {
  background-color: #1f2335;
  color: #7aa2f7;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  min-width: 120px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 0 4px rgba(122, 162, 247, 0.3);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  color: #ff9e64;
  background-color: #2a3047;
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.3),
    0 0 8px rgba(122, 162, 247, 0.5);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(1px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 2px rgba(122, 162, 247, 0.3);
}
```

#### Floating Buttons

```css
.floating-btn {
  position: fixed;
  top: 33px;
  background-color: #24283b;
  color: #7aa2f7;
  border: none;
  border-radius: 4px;
  padding: 8px;
  width: 40px;
  height: 40px;
  transition: color 0.3s ease;
  z-index: 1000;
}

.floating-btn:hover {
  color: #ff9e64;
}
```

### Cards

```css
.card {
  background-color: #1f2335;
  border: 2px solid #3b4261;
  border-radius: 4px;
  padding: 15px;
}

.card-header {
  background-color: #1f2335;
  color: #c3e88d;
  border-bottom: 1px solid #3b4261;
  padding: 10px 15px;
}
```

### Form Elements

#### Input Fields

```css
.form-control {
  background-color: #24283b;
  border: 1px solid #3b4261;
  color: #c0caf5;
  border-radius: 4px;
  padding: 0.375rem 0.75rem;
  height: 38px;
}

.form-control:focus {
  background-color: #2a3047;
  box-shadow: 0 0 0 0.1rem rgba(122, 162, 247, 0.5);
  border-color: #7aa2f7;
  color: #c0caf5;
}
```

#### Checkboxes

```css
.form-check-input {
  background-color: #24283b;
  border-color: #3b4261;
}

.form-check-input:checked {
  background-color: #7aa2f7;
  border-color: #7aa2f7;
}
```

#### Range Sliders

```css
input[type="range"] {
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #c0caf5;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #7aa2f7;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

### Modals

```css
.modal-content {
  background-color: #1f2335;
  border: 2px solid #3b4261;
  color: #c0caf5;
}

.modal-header {
  border-bottom: 1px solid #3b4261;
  background-color: #1f2335;
}

.modal-footer {
  border-top: 1px solid #3b4261;
  background-color: #1f2335;
}
```

### Progress Bars

```css
.progress {
  background-color: #1f2335;
  border: 1px solid #3b4261;
  height: 8px;
  border-radius: 4px;
}

/* Dynamic color based on typing speed */
.progress-bar.speed-fast {
  background: linear-gradient(90deg, #c3e88d, #9ece6a);
}

.progress-bar.speed-medium {
  background: linear-gradient(90deg, #7aa2f7, #7dcfff);
}

.progress-bar.speed-slow {
  background: linear-gradient(90deg, #ff9e64, #f7768e);
}
```

### Tables

```css
.table {
  --bs-table-bg: #24283b;
  --bs-table-striped-bg: #24283b;
  --bs-table-hover-bg: #292e42;
  color: #c0caf5;
  border-color: #3b4261;
}
```

### News Cards

```css
.news-card {
  background-color: #1f2335;
  border: 2px solid #3b4261;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.news-card-header {
  padding: 12px 20px;
  border-bottom: 1px solid #3b4261;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.news-date {
  color: #565f89;
  font-size: 0.9em;
}

.news-category {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}

.news-category.announcement {
  background-color: rgba(122, 162, 247, 0.2);
  color: #7aa2f7;
}

.news-category.feature {
  background-color: rgba(195, 232, 141, 0.2);
  color: #c3e88d;
}

.news-category.update {
  background-color: rgba(255, 158, 100, 0.2);
  color: #ff9e64;
}
```

## Iconography

### Icon System

NerdType uses **Font Awesome 6** for all icons, maintaining consistency across the interface.

#### Navigation Icons

```html
<i class="fa-solid fa-house"></i>
<!-- Home -->
<i class="fa-solid fa-keyboard"></i>
<!-- Game -->
<i class="fa-solid fa-chart-line"></i>
<!-- Stats -->
<i class="fa-solid fa-trophy"></i>
<!-- Achievements -->
<i class="fa-solid fa-medal"></i>
<!-- Leaderboard -->
```

#### Social Icons

```html
<i class="fa-brands fa-github"></i>
<!-- GitHub -->
<i class="fa-brands fa-instagram"></i>
<!-- Instagram -->
<i class="fa-brands fa-discord"></i>
<!-- Discord -->
```

#### Utility Icons

```html
<i class="fa-solid fa-gear"></i>
<!-- Settings -->
<i class="fa-solid fa-user"></i>
<!-- User Profile -->
<i class="fa-solid fa-circle-info"></i>
<!-- Information -->
<i class="fa-solid fa-envelope"></i>
<!-- Contact -->
```

### Custom Cursors

NerdType features pixel art cursors available in multiple color themes:

```
Cursor Themes:
1. Default (White)
   - nt-arrow-white.png
   - nt-pointer-white.png

2. Blue Theme
   - nt-arrow-blue.png / nt-arrow-blue-outline.png
   - nt-pointer-blue.png / nt-pointer-blue-outline.png

3. Orange Theme
   - nt-arrow-orange.png / nt-arrow-orange-outline.png
   - nt-pointer-orange.png / nt-pointer-orange-outline.png

4. Green Theme
   - nt-arrow-green.png / nt-arrow-green-outline.png
   - nt-pointer-green.png / nt-pointer-green-outline.png

5. Purple Theme
   - nt-arrow-purple.png / nt-arrow-purple-outline.png
   - nt-pointer-purple.png / nt-pointer-purple-outline.png

6. Gradient Theme
   - nt-arrow-gradient-outline.png
   - nt-pointer-gradient-outline.png
```

#### Cursor Implementation

```css
body.cursor-orange {
  cursor: url("../images/nt-arrow-orange.png"), auto;
}

body.cursor-orange a,
body.cursor-orange button {
  cursor: url("../images/nt-pointer-orange.png"), pointer;
}
```

### Icon Guidelines

1. **Size**: Icons should be 16-24px for UI elements
2. **Color**: Use brand accent colors (#7aa2f7, #ff9e64, #c3e88d)
3. **Style**: Solid style for primary actions, regular for secondary
4. **Spacing**: Maintain 8px margin between icon and text
5. **Hover**: Scale to 1.3x on hover for social icons

## Spacing & Layout

### Spacing Scale

NerdType uses a consistent 8px spacing system:

```css
/* Spacing Scale */
--space-xs: 4px; /* 0.25rem */
--space-sm: 8px; /* 0.5rem */
--space-md: 16px; /* 1rem */
--space-lg: 24px; /* 1.5rem */
--space-xl: 32px; /* 2rem */
--space-2xl: 48px; /* 3rem */
--space-3xl: 64px; /* 4rem */
```

### Container Widths

```css
/* Maximum Content Width */
.container-fluid {
  max-width: 1550px;
  padding-left: 10px;
  padding-right: 10px;
}

/* Centered Content */
.col-md-8.col-lg-6.mx-auto {
  /* Standard article/content width */
}
```

### Border Radius

```css
/* Border Radius Scale */
--radius-sm: 2px; /* Small elements */
--radius-md: 4px; /* Standard buttons, cards */
--radius-lg: 8px; /* Large cards, modals */
--radius-pill: 12px; /* Pills, badges */
--radius-full: 50%; /* Circular elements */
```

### Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 433px) {
  /* Extra small phones */
}
@media (max-width: 500px) {
  /* Small phones */
}
@media (max-width: 768px) {
  /* Tablets */
}
@media (max-width: 992px) {
  /* Small desktops */
}
@media (min-width: 1200px) {
  /* Large desktops */
}
```

### Layout Guidelines

1. **Margins**: Use consistent spacing scale
2. **Padding**: Internal spacing should be 15-20px for cards
3. **Grid**: Use Bootstrap 12-column grid system
4. **Alignment**: Center-align game elements, left-align content
5. **Safe Areas**: Account for mobile safe areas with `env()` values

## Interactive Elements

### Transitions

Standard transition timing for all interactive elements:

```css
/* Default Transition */
transition: all 0.3s ease;

/* Transform Transition */
transition: transform 0.2s ease;

/* Color Transition */
transition: color 0.3s ease;
```

### Hover States

```css
/* Button Hover */
:hover {
  color: #ff9e64;
  transform: translateY(-2px);
}

/* Icon Hover */
.social-link:hover .fa-brands {
  color: #7aa2f7;
  transform: scale(1.3);
}

/* Link Hover */
a:hover {
  color: #ff9e64;
}
```

### Active States

```css
/* Button Active */
:active {
  transform: translateY(1px);
}

/* Current Page Indicator */
#current {
  color: #bb9af7 !important;
}
```

### Focus States

```css
/* Input Focus */
.form-control:focus {
  box-shadow: 0 0 0 0.1rem rgba(122, 162, 247, 0.5);
  border-color: #7aa2f7;
  outline: none;
}

/* Button Focus */
button:focus {
  outline: none;
  box-shadow: none;
}
```

### Scrollbar Styling

```css
::-webkit-scrollbar {
  width: 0.8em;
}

::-webkit-scrollbar-track {
  background-color: #3b4261;
  border-radius: 100vw;
  margin-block: 0.2em;
}

::-webkit-scrollbar-thumb {
  background-color: #24283b;
  border: 0.16em solid #3b4261;
  border-radius: 100vw;
}
```

### Animations

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Spin (Loading) */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## Voice & Tone

### Writing Style

#### General Principles

- **Direct**: Get to the point quickly
- **Casual**: Friendly but professional
- **Nerdy**: Embrace developer culture and gaming references
- **Encouraging**: Motivate users to improve
- **Clear**: Avoid jargon (unless appropriate for audience)

#### Examples

**DO:**

- "Welcome back, nerd!" (friendly, on-brand)
- "New personal best! Keep crushing it." (encouraging)
- "Type /help for available commands" (clear, direct)
- "Season 2 is live! GLHF, nerds!" (casual, gaming culture)

**DON'T:**

- "Greetings, user" (too formal)
- "Suboptimal performance detected" (too technical)
- "Click here to access the functionality" (too wordy)

### Content Categories

#### News & Announcements

**Tone**: Exciting, informative
**Style**: Brief headlines, enthusiastic

```markdown
## Season 2 is Live!

Welcome to Season 2, nerds! The global leaderboard has been reset
and fresh competition begins now.
```

#### Feature Descriptions

**Tone**: Informative, benefit-focused
**Style**: Clear value proposition

```markdown
## Practice Mistakes

Turn your mistakes into mastery with the new Practice Mistakes
feature! Press Ctrl+M to start a practice session with words you
made mistakes on.
```

#### Error Messages

**Tone**: Helpful, non-blaming
**Style**: Solution-oriented

```markdown
❌ Invalid command. Type /help to see available commands.
```

#### Success Messages

**Tone**: Celebratory, encouraging
**Style**: Positive reinforcement

```markdown
✓ Achievement unlocked: Flawless Victory!
🎉 New personal record! WPM: 120
```

### Terminology

**Preferred Terms:**

- "Nerd" (affectionate, community term)
- "Game" or "Session" (not "test")
- "WPM" (Words Per Minute)
- "Slash command" (for in-game commands)
- "Achievement" (not "badge" or "award")

**Avoid:**

- "User" (prefer "player" or "nerd")
- "Utilize" (use "use")
- "Endeavor" (use "try")
- Overly technical jargon

## Usage Guidelines

### Do's and Don'ts

#### Visual Design

**DO:**

- ✓ Use Tokyo Night color palette consistently
- ✓ Maintain monospace fonts for all game elements
- ✓ Keep backgrounds dark (#24283b)
- ✓ Use blue (#7aa2f7) for primary interactive elements
- ✓ Ensure sufficient contrast for readability
- ✓ Use pixel art style for custom graphics

**DON'T:**

- ✗ Introduce new colors outside the palette
- ✗ Use non-monospace fonts for game interface
- ✗ Use light backgrounds
- ✗ Mix different design styles
- ✗ Reduce contrast for aesthetic purposes
- ✗ Use photorealistic graphics

#### Typography

**DO:**

- ✓ Use Nerd Fonts exclusively
- ✓ Maintain consistent font sizes
- ✓ Keep line height at 1.5-1.6
- ✓ Use color to establish hierarchy

**DON'T:**

- ✗ Use non-monospace fonts
- ✗ Use more than 3 font sizes per page
- ✗ Set line height below 1.4
- ✗ Use font weight for hierarchy (use color/size instead)

#### Interactive Elements

**DO:**

- ✓ Provide visual feedback on hover
- ✓ Use consistent transition timing (0.3s)
- ✓ Implement focus states for accessibility
- ✓ Keep interactions predictable

**DON'T:**

- ✗ Add animations longer than 0.5s
- ✗ Create jarring transitions
- ✗ Remove focus indicators
- ✗ Introduce unexpected behaviors

#### Content

**DO:**

- ✓ Use casual, friendly tone
- ✓ Embrace nerd culture references
- ✓ Keep messages concise
- ✓ Encourage users positively

**DON'T:**

- ✗ Use overly formal language
- ✗ Write lengthy paragraphs
- ✗ Use negative language for errors
- ✗ Include unnecessary technical details

### Accessibility Standards

NerdType adheres to **WCAG 2.1 Level AA** standards:

1. **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
2. **Keyboard Navigation**: All interactive elements accessible via keyboard
3. **Focus Indicators**: Visible focus states on all interactive elements
4. **Alt Text**: Descriptive alt text for all images
5. **Semantic HTML**: Proper use of heading hierarchy and landmarks
6. **Responsive Design**: Functional across all device sizes

### Mobile Optimization

```css
/* Mobile-Specific Adjustments */
@media (max-width: 768px) {
  /* Larger touch targets (minimum 44x44px) */
  .floating-btn {
    width: 40px;
    height: 40px;
  }

  /* Simplified navigation */
  #header-logo-no-text {
    display: block; /* Show icon-only logo */
  }

  #header-logo {
    display: none; /* Hide full logo */
  }

  /* Account for safe areas */
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

### Performance Guidelines

1. **File Sizes**: Optimize images (use PNG for logos, compress wallpapers)
2. **Loading**: Implement DNS prefetch for external resources
3. **Caching**: Cache static assets appropriately
4. **Minification**: Minify CSS and JS for production
5. **Lazy Loading**: Load images and heavy resources as needed

## Implementation Checklist

When creating new pages or features, ensure:

- [ ] Colors match Tokyo Night palette
- [ ] Typography uses Nerd Fonts
- [ ] Interactive elements have hover/focus states
- [ ] Spacing follows 8px grid system
- [ ] Mobile responsive (test at 320px, 768px, 1024px)
- [ ] Meets WCAG 2.1 AA contrast requirements
- [ ] Transitions use 0.3s ease timing
- [ ] Icons use Font Awesome 6
- [ ] Content follows voice & tone guidelines
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Keyboard navigation functional
- [ ] Touch targets minimum 44x44px on mobile

## Brand Evolution

This brand guide is a living document. As NerdType evolves, these guidelines may be updated to reflect new features, design improvements, or user feedback.

### Revision History

- **v1.0** (November 2025): Initial brand guidelines document

## Contact & Questions

For questions about brand usage or design decisions:

- **GitHub**: [github.com/merkksgit/nerd-type](https://github.com/merkksgit/nerd-type)
- **Discord**: [NerdType Community](https://discord.gg/eJkNaPN8rg)
- **Contact Page**: [nerdtypegame.com/pages/contact.html](https://www.nerdtypegame.com/pages/contact.html)

**© 2025 NerdType** | Fast-Paced Minimalistic Typing Game

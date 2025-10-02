# NerdType CLI Scoreboard Endpoint

CLI-friendly endpoint for viewing the NerdType global scoreboard directly from your terminal.

## Overview

This Firebase Cloud Function provides a beautiful ASCII-formatted scoreboard when accessed from terminal clients like curl, while redirecting browsers to the web interface.

## Usage

### Terminal (curl, wget, etc.)

```bash
curl https://us-central1-nerdtype-leaderboard.cloudfunctions.net/scoreboard
```

### Example Output

```
                        NERD TYPE GAME - Global Scoreboard

┌──────┬──────────────────────┬─────────┬───────┬──────────┬───────────────┬──────────┐
│ Rank │ Player               │  Score  │  WPM  │ Accuracy │     Mode      │   List   │
├──────┼──────────────────────┼─────────┼───────┼──────────┼───────────────┼──────────┤
│    1 │ merkks               │    2149 │    97 │  100.0%  │ Custom Mode   │ finnish  │
│    2 │ user69               │    2007 │    91 │  100.0%  │ Custom Mode   │ finnish  │
│    3 │ qwerty               │    1831 │    83 │  100.0%  │ Custom Mode   │ finnish  │
│    4 │ qwerty               │    1809 │    82 │  100.0%  │ Custom Mode   │ finnish  │
└──────┴──────────────────────┴─────────┴───────┴──────────┴───────────────┴──────────┘

  Total Players: 3    Total Games: 11

  🌐 Visit: https://www.nerdtypegame.com
```

### Browser Access

When accessed from a web browser, the endpoint automatically redirects to:
`https://www.nerdtypegame.com/pages/globalscoreboard.html`

### JSON API

To get JSON data instead of redirection, add `?format=json`:

```bash
curl https://nerdtypegame.com/scoreboard?format=json
```

Response format:

```json
{
  "scores": [
    {
      "username": "hconly",
      "score": 2222,
      "wpm": 83,
      "accuracy": "100.0%",
      "mode": "Classic",
      "wordList": "english",
      "date": 1696118400000
    }
  ],
  "stats": {
    "uniquePlayers": 42,
    "totalGames": 1337
  },
  "timestamp": "2025-10-02T12:00:00.000Z"
}
```

## Features

- **ANSI Colors**: Beautiful colored output with color highlighting for top 3
- **Smart Detection**: Automatically detects terminal vs browser requests
- **Top 20 Scores**: Shows the top 20 authenticated scores only
- **Live Stats**: Displays total unique players and total games played
- **Color Highlighting**:
  - Gold highlight for 1st place
  - Bold text for top 3 players
  - Green for high WPM (80+ WPM)
  - Cyan borders for ASCII tables
- **Caching**: 5-minute cache for better performance

## Deployment

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Project configured (already done in this repo)

### Deploy the Function

```bash
# Install dependencies
cd functions
npm install

# Deploy to Firebase
cd ..
firebase deploy --only functions
```

### Set Up Custom Domain (Optional)

To use `nerdtypegame.com/scoreboard` instead of the Firebase Function URL:

1. In Firebase Console, go to Hosting
2. Add a rewrite rule (already configured in `firebase.json`):
   ```json
   {
     "source": "/scoreboard",
     "function": "scoreboard"
   }
   ```
3. Deploy hosting: `firebase deploy --only hosting`

## Technical Details

### User-Agent Detection

The function detects terminal requests by checking for these strings in the User-Agent header:

- curl
- wget
- httpie
- fetch
- powershell
- python-requests
- go-http-client
- rust-reqwest

### Firebase Query

The function fetches scores using:

```javascript
scoresRef.orderByChild("score").limitToLast(20).once("value");
```

Only scores with `authenticatedScore === true` are included in the leaderboard.

### Performance

- Response time: ~200-500ms (depends on Firebase latency)
- Cached for 5 minutes (`Cache-Control: public, max-age=300`)
- Scales automatically with Firebase Cloud Functions

## Development

### Local Testing

```bash
# Start Firebase emulator
firebase emulators:start --only functions

# Test with curl
curl http://localhost:5001/nerdtype-leaderboard/us-central1/scoreboard
```

### View Logs

```bash
firebase functions:log
```

## Files Created

- `functions/index.js` - Main Cloud Function code
- `functions/package.json` - Node.js dependencies
- `functions/.eslintrc.js` - ESLint configuration
- `firebase.json` - Firebase configuration with hosting rewrites
- `.firebaserc` - Firebase project configuration

## Cost

Firebase Cloud Functions pricing (Blaze plan required):

- First 2,000,000 invocations/month: Free
- First 400,000 GB-seconds/month: Free
- First 200,000 CPU-seconds/month: Free

With caching enabled, this endpoint should stay well within free tier limits.

## Troubleshooting

### CORS Issues

If you encounter CORS issues, the function can be updated to include CORS headers:

```javascript
res.set("Access-Control-Allow-Origin", "*");
```

### Function Not Found

Make sure you've deployed the function:

```bash
firebase deploy --only functions
```

### Database Permission Denied

Ensure your Firebase Realtime Database rules allow reading scores:

```json
{
  "rules": {
    "scores": {
      ".read": true
    }
  }
}
```

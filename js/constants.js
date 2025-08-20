// Game Constants
export const GAME_DEFAULTS = {
  TIME_LIMIT: 30,
  BONUS_TIME: 3,
  INITIAL_TIME: 10,
  GOAL_PERCENTAGE: 100,
  ZEN_WORD_GOAL: 30,
  WORDS_TO_SHOW: 30,
  CHARS_PER_WORD: 5,
  DEFAULT_LANGUAGE: "english",
  DEFAULT_FONT: "jetbrains-light",
  DEFAULT_USERNAME: "runner",
};

export const TIMERS = {
  DEBUG_UPDATE_INTERVAL: 100,
  COUNTDOWN_INTERVAL: 800,
  TOTAL_TIME_INTERVAL: 1000,
  ZEN_TIMER_INTERVAL: 1000,
  SETTINGS_NOTIFICATION_DELAY: 200,
  COMMAND_RELOAD_DELAY: 2000,
  LOGIN_RELOAD_DELAY: 2000,
  CHART_REFRESH_DELAY: 500,
  USERNAME_VALIDATION_DELAY: 500,
};

export const STORAGE_KEYS = {
  USERNAME: "nerdtype_username",
  GUEST_MODE: "nerdtype_guest_mode",
  ZEN_MODE: "nerdtype_zen_mode",
  FONT: "nerdtype_font",
  GAME_SETTINGS: "gameSettings",
  GAME_RESULTS: "gameResults",
  ACHIEVEMENTS: "nerdtype_achievements",
  GUEST_ACHIEVEMENTS_BACKUP: "nerdtype_guest_achievements_backup",
  GAME_RESULTS_GUEST_BACKUP: "gameResults_guest_backup",
  TOTAL_GAME_COUNT: "totalGameCount",
  DATA_COLLECTION_ENABLED: "data_collection_enabled",
  PENDING_SETTINGS_NOTIFICATION: "pending_settings_notification",
};

export const LIMITS = {
  MAX_SCOREBOARD_ENTRIES: 15,
  MAX_ALLOWED_LENGTH: 100,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MAX_CONTEXT_LINES: 10,
};

export const RESERVED_USERNAMES = [
  "runner",
  "guest",
  "admin",
  "moderator",
  "system",
  "nerdtype",
  "root",
  "user",
  "test",
  "demo",
  "null",
  "undefined",
];

export const GAME_MODES = {
  CLASSIC: "classic",
  HARD: "hard",
  PRACTICE: "practice",
  SPEEDRUNNER: "speedrunner",
  ZEN: "zen",
  CUSTOM: "custom",
};

export const WORD_LANGUAGES = {
  ENGLISH: "english",
  FINNISH: "finnish",
  SWEDISH: "swedish",
  PROGRAMMING: "programming",
  NIGHTMARE: "nightmare",
};

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

export const DIFFICULTY_LEVELS = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
  EXPERT: "expert",
};

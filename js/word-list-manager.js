// Define a list of available word lists
const availableWordLists = {
  finnish: {
    name: "Finnish",
    source: "./words-fin.js",
  },
  english: {
    name: "English",
    source: "./words-eng.js",
  },
  swedish: {
    name: "Swedish",
    source: "./words-sve.js",
  },
  programming: {
    name: "Programming",
    source: "./words-prog.js",
  },
  nightmare: {
    name: "Nightmare",
    source: "./words-nm.js",
  },
};

const wordListIcons = {
  english: "🇬🇧 ",
  finnish: "🇫🇮 ",
  swedish: "🇸🇪 ",
  programming: "🖥️ ",
  nightmare: "💀 ",
};

// Default language (you can set this based on the current page)
let currentLanguage = localStorage.getItem("nerdtype_wordlist") || "english";

// Function to dynamically import word lists
async function loadWordList(language) {
  try {
    // Store user preference
    localStorage.setItem("nerdtype_wordlist", language);
    currentLanguage = language;
    // Dynamically import the selected word list
    const module = await import(availableWordLists[language].source);
    return module.words;
  } catch (error) {
    console.error("Error loading word list:", error);
    // Fallback to Finnish if there's an error
    const fallback = await import("./words-fin.js");
    return fallback.words;
  }
}

// Export functions and variables
export { loadWordList, wordListIcons, availableWordLists, currentLanguage };

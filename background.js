// Load API config from gitignored config.js
importScripts("config.js");
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarize") {
    handleSummarize().then(sendResponse).catch((err) => {
      sendResponse({ error: err.message || "Failed to summarize." });
    });
    return true; // Keep the message channel open for async response
  }
});

// Main summarization handler
async function handleSummarize() {
  // 1. Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    return { error: "No active tab found." };
  }

  // Check if we can inject into this tab
  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://") || tab.url?.startsWith("about:")) {
    return { error: "Cannot summarize browser internal pages. Try a regular webpage." };
  }

  // 2. Extract page text using scripting API
  let pageText;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });
    pageText = results?.[0]?.result;
  } catch (err) {
    return { error: "Could not read the page content. Make sure you're on a regular webpage." };
  }

  if (!pageText || pageText.trim().length < 50) {
    return { error: "Not enough text content found on this page to summarize." };
  }

  // Limit text to ~6000 chars to stay within token limits
  const trimmedText = pageText.slice(0, 6000);

  // 3. Call Gemini API
  try {
    const summary = await callGeminiAPI(trimmedText);
    return { summary };
  } catch (err) {
    return { error: "AI service error: " + (err.message || "Could not get a summary.") };
  }
}

// Gemini API call
async function callGeminiAPI(text) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are a helpful summarizer. Summarize the following webpage content clearly and concisely in well-structured paragraphs. Use plain text only (no markdown or bullet formatting). Keep it under 200 words.\n\n${text}`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API returned status ${response.status}`);
  }

  const data = await response.json();
  const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!summary) {
    throw new Error("No summary was generated.");
  }

  return summary;
}

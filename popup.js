// DOM Elements
const summarizeBtn = document.getElementById("summarize-btn");
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const errorMessage = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");
const summaryState = document.getElementById("summary-state");
const summaryContent = document.getElementById("summary-content");
const copyBtn = document.getElementById("copy-btn");
const resummarizeBtn = document.getElementById("resummarize-btn");

// State management
function showState(state) {
    // Hide all states
    summarizeBtn.classList.add("hidden");
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    summaryState.classList.add("hidden");

    // Show the requested state
    switch (state) {
        case "idle":
            summarizeBtn.classList.remove("hidden");
            break;
        case "loading":
            loadingState.classList.remove("hidden");
            break;
        case "error":
            errorState.classList.remove("hidden");
            break;
        case "summary":
            summaryState.classList.remove("hidden");
            break;
    }
}

// Trigger summarization
async function triggerSummarize() {
    showState("loading");

    try {
        const response = await chrome.runtime.sendMessage({ action: "summarize" });

        if (response && response.error) {
            errorMessage.textContent = response.error;
            showState("error");
            return;
        }

        if (response && response.summary) {
            summaryContent.textContent = response.summary;
            showState("summary");
        } else {
            errorMessage.textContent = "Received an empty response. Try again.";
            showState("error");
        }
    } catch (err) {
        errorMessage.textContent = err.message || "Something went wrong.";
        showState("error");
    }
}

// Copy to clipboard
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(summaryContent.textContent);
        copyBtn.textContent = "✅";
        setTimeout(() => {
            copyBtn.textContent = "📋";
        }, 1500);
    } catch {
        // Fallback
        const range = document.createRange();
        range.selectNode(summaryContent);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
        copyBtn.textContent = "✅";
        setTimeout(() => {
            copyBtn.textContent = "📋";
        }, 1500);
    }
}

// Event listeners
summarizeBtn.addEventListener("click", triggerSummarize);
retryBtn.addEventListener("click", triggerSummarize);
resummarizeBtn.addEventListener("click", triggerSummarize);
copyBtn.addEventListener("click", copyToClipboard);

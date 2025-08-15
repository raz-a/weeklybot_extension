// Save settings
function saveOptions() {
    const settings = {
        debugLog: document.getElementById("debugLog").checked,
    };

    chrome.storage.sync.set(settings, () => {
        // Show status message
        const status = document.getElementById("status");
        status.textContent = "Settings saved successfully!";
        status.className = "show success";

        setTimeout(() => {
            status.className = "";
        }, 2000);
    });
}

// Load saved settings
function loadOptions() {
    const defaults = {
        debugLog: false,
    };

    chrome.storage.sync.get(defaults, (items) => {
        document.getElementById("debugLog").checked = items.debugLog;
    });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", loadOptions);

// Save when checkbox changes
document.getElementById("debugLog").addEventListener("change", saveOptions);

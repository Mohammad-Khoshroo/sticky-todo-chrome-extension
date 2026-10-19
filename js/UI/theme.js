// ----------------------
//       THEME TOGGLE
// ----------------------

function getSavedTheme() {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);

    localStorage.setItem("theme", theme);
    if (typeof isExtension !== "undefined" && isExtension) {
        chrome.storage.local.set({ theme });
    }

    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
        toggleBtn.title = isDark ? "تغییر به حالت روز (روشن)" : "تغییر به حالت شب (تاریک)";
        toggleBtn.setAttribute("aria-label", toggleBtn.title);
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
        toggleBtn.classList.add("rotate");
        setTimeout(() => toggleBtn.classList.remove("rotate"), 500);
    }

    applyTheme(newTheme);
}

// Attach event and initialize
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleTheme);
    }

    if (typeof isExtension !== "undefined" && isExtension) {
        chrome.storage.local.get(["theme"], (result) => {
            if (result.theme) {
                applyTheme(result.theme);
            } else {
                applyTheme(getSavedTheme());
            }
        });
    } else {
        applyTheme(getSavedTheme());
    }
});

//////////////////////////////////////////////////////////////////
// ----------------------
//   LANGUAGE UI CONTROLS
// ----------------------

(function () {
    const langToggleBtn = document.getElementById("lang-toggle-btn");
    const langDropdown = document.getElementById("lang-dropdown");
    const langWrapper = document.getElementById("lang-selector-wrapper");

    function updateActiveOption() {
        if (!langDropdown) return;
        langDropdown.querySelectorAll(".lang-option").forEach((opt) => {
            const lang = opt.dataset.lang;
            if (lang === currentLanguage) {
                opt.classList.add("active");
            } else {
                opt.classList.remove("active");
            }
            const flagEl = opt.querySelector(".lang-flag");
            if (flagEl && typeof FLAG_SVGS !== "undefined" && FLAG_SVGS[lang]) {
                flagEl.innerHTML = FLAG_SVGS[lang];
            }
        });

        const curFlag = document.getElementById("lang-current-flag");
        if (curFlag && typeof FLAG_SVGS !== "undefined" && FLAG_SVGS[currentLanguage]) {
            curFlag.innerHTML = FLAG_SVGS[currentLanguage];
        } else if (curFlag && typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[currentLanguage]) {
            curFlag.textContent = TRANSLATIONS[currentLanguage].flag;
        }
    }

    if (langToggleBtn && langDropdown) {
        langToggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle("hidden");
            updateActiveOption();
        });

        langDropdown.addEventListener("click", (e) => {
            const opt = e.target.closest(".lang-option");
            if (!opt) return;
            e.stopPropagation();

            const targetLang = opt.dataset.lang;
            if (targetLang && typeof setLanguage === "function") {
                setLanguage(targetLang);
                updateActiveOption();
            }
            langDropdown.classList.add("hidden");
        });

        document.addEventListener("click", (e) => {
            if (langWrapper && !langWrapper.contains(e.target)) {
                langDropdown.classList.add("hidden");
            }
        });
    }

    // Initialize UI on load
    if (typeof applyI18nToUI === "function") {
        applyI18nToUI();
    }
    updateActiveOption();

    if (typeof isExtension !== "undefined" && isExtension) {
        chrome.storage.local.get(["appLanguage"], (result) => {
            if (result.appLanguage && result.appLanguage !== currentLanguage) {
                if (typeof setLanguage === "function") {
                    setLanguage(result.appLanguage, false);
                    updateActiveOption();
                }
            }
        });
    }
})();

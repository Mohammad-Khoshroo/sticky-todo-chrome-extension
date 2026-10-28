// ----------------------
//     WINDOW CHECK
// ----------------------
function checkWindowMaximized() {
    if (window.outerWidth >= window.screen.availWidth * 0.99) {
        document.body.classList.add('is-maximized-window');
    } else {
        document.body.classList.remove('is-maximized-window');
    }
}

let resizeDebounceTimer = null;
window.addEventListener('resize', () => {
    checkWindowMaximized();
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
        if (typeof msnry !== 'undefined' && msnry && typeof msnry.layout === 'function') {
            msnry.layout();
        }
    }, 150);
});
checkWindowMaximized();

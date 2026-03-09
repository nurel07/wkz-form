/* ============================================
   Book-a-Demo Popup Trigger
   ============================================
   Listens for clicks on any element with
   [click="book-a-demo"] and opens/closes the
   .s_book-popup modal overlay.

   Animations:
   - Open:  backdrop fades in (0.24s), modal
            scales up with spring overshoot (0.32s)
   - Close: opacity transition reverses naturally;
            display:none set after opacity clears

   Drop this script on any page that has the
   popup component embedded.
   ============================================ */
(function () {
    'use strict';

    var POPUP_SEL = '.s_book-popup';
    var CLOSE_SEL = '.section_bokademo-popup-cls-wrp';
    var TRIGGER_VAL = 'book-a-demo';
    var TRIGGER_SEL = '[click="' + TRIGGER_VAL + '"], [data-action="' + TRIGGER_VAL + '"]';
    var CLOSE_DURATION = 250; // ms — matches opacity transition (0.24s)

    /* ---------- Inject animation styles ---------- */
    var style = document.createElement('style');
    style.textContent = [
        /* Backdrop */
        '.s_book-popup {',
        '  opacity: 0;',
        '  pointer-events: none;',
        '  transition: opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1);',
        '}',
        '.s_book-popup.is-open {',
        '  opacity: 1;',
        '  pointer-events: auto;',
        '}',

        /* Modal panel — desktop: spring scale on open */
        '.s_book-popup-mod {',
        '  opacity: 0;',
        '  transform: scale(0.88);',
        '  transition:',
        '    transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1),',
        '    opacity   0.24s cubic-bezier(0.22, 1, 0.36, 1);',
        '}',
        '.s_book-popup.is-open .s_book-popup-mod {',
        '  opacity: 1;',
        '  transform: scale(1);',
        '}',

        /* Mobile — slide up from bottom (bottom-sheet pattern) */
        '@media screen and (max-width: 767px) {',
        '  .s_book-popup-mod {',
        '    transform: translateY(100%);',
        '    opacity: 1;',
        '    transition:',
        '      transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);',
        '  }',
        '  .s_book-popup.is-open .s_book-popup-mod {',
        '    transform: translateY(0);',
        '  }',
        '}',

        /* Reduced motion — opacity only, no transform */
        '@media (prefers-reduced-motion: reduce) {',
        '  .s_book-popup {',
        '    transition: opacity 0.15s ease;',
        '  }',
        '  .s_book-popup-mod {',
        '    transform: none;',
        '    transition: opacity 0.15s ease;',
        '  }',
        '}'
    ].join('\n');
    document.head.appendChild(style);

    /* ---------- Open / Close ---------- */
    var closeTimer = null;

    function openPopup() {
        var popup = document.querySelector(POPUP_SEL);
        if (!popup) return;

        // Cancel any in-progress close
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

        popup.style.display = 'flex';

        // Double rAF — ensures display:flex is painted before transition fires
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                popup.classList.add('is-open');
            });
        });

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    function closePopup() {
        var popup = document.querySelector(POPUP_SEL);
        if (!popup || !popup.classList.contains('is-open')) return;

        popup.classList.remove('is-open'); // triggers reverse transition

        closeTimer = setTimeout(function () {
            popup.style.display = 'none';
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }, CLOSE_DURATION);
    }

    /* ---------- Wire up events ---------- */
    function init() {
        // Open triggers
        document.querySelectorAll(TRIGGER_SEL).forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                openPopup();
            });
        });

        // Close — dedicated close button
        var closeBtn = document.querySelector(CLOSE_SEL);
        if (closeBtn) {
            closeBtn.addEventListener('click', closePopup);
        }

        // Close — click on backdrop (outside modal panel)
        var popup = document.querySelector(POPUP_SEL);
        if (popup) {
            popup.addEventListener('click', function (e) {
                if (e.target === popup) closePopup();
            });
        }

        // Close — ESC key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closePopup();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

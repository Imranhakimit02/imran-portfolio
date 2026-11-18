'use strict';

const page = document.documentElement;
const themeStorageKey = 'portfolio-theme';

initializeNavigation();
initializeTheme();
initializeProjectFilters();
initializeCaseStudies();
initializeEmailCopy();
initializeResume();

/** Enable the mobile menu once its controls are available. */
function initializeNavigation() {
  const menuButton = document.querySelector('#menu');
  const navigation = document.querySelector('#links');
  if (!menuButton || !navigation) return;

  // Keep navigation accessible on small screens when JavaScript is unavailable.
  page.classList.add('js');

  function setMenuOpen(open) {
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  }

  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || menuButton.getAttribute('aria-expanded') !== 'true') return;
    setMenuOpen(false);
    if (menuButton.getClientRects().length) menuButton.focus();
  });
}

/** Apply the saved theme and wire the toggle, with a fallback for blocked storage. */
function initializeTheme() {
  const themeButton = document.querySelector('#theme-toggle');
  if (!themeButton) return;

  let theme = 'light';
  try {
    if (localStorage.getItem(themeStorageKey) === 'dark') theme = 'dark';
  } catch {
    // The light default is still usable when storage access is blocked.
  }

  function applyTheme(selectedTheme) {
    const isDark = selectedTheme === 'dark';
    page.dataset.theme = selectedTheme;
    themeButton.textContent = isDark ? 'Light mode' : 'Dark mode';
    themeButton.setAttribute('aria-pressed', String(isDark));
  }

  applyTheme(theme);
  themeButton.addEventListener('click', () => {
    const nextTheme = page.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);

    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // The current page still reflects the selected theme.
    }
  });
}

/** Filter project cards by the selected category. */
function initializeProjectFilters() {
  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('[data-category]');

  for (const filterButton of filterButtons) {
    filterButton.addEventListener('click', () => {
      const category = filterButton.dataset.filter;

      for (const button of filterButtons) {
        button.setAttribute('aria-pressed', String(button === filterButton));
      }

      for (const card of projectCards) {
        card.hidden = category !== 'all' && card.dataset.category !== category;
      }
    });
  }
}

/** Open case studies as native modals and return focus to their launch buttons. */
function initializeCaseStudies() {
  for (const button of document.querySelectorAll('[data-project]')) {
    const dialog = document.getElementById('case-' + button.dataset.project);
    if (!dialog || typeof dialog.showModal !== 'function') continue;

    button.addEventListener('click', () => dialog.showModal());
    dialog.querySelector('.close-case')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      // Pause playback so audio stops when the case study is dismissed.
      dialog.querySelector('video')?.pause();
      button.focus();
    });

    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;

      // Dialog padding and the backdrop both report the dialog as the click target.
      const bounds = dialog.getBoundingClientRect();
      const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom;

      if (clickedOutside) dialog.close();
    });
  }
}

/** Copy the address from the contact link and announce the result. */
function initializeEmailCopy() {
  const copyButton = document.querySelector('#copy');
  const status = document.querySelector('#status');
  const emailLink = document.querySelector('.email[href^="mailto:"]');
  if (!copyButton || !status || !emailLink) return;

  const emailAddress = emailLink.getAttribute('href').slice('mailto:'.length);
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      status.textContent = 'Email copied.';
    } catch {
      status.textContent = 'Please copy: ' + emailAddress;
    }
  });
}

/** Switch between resume formats and toggle the interactive resume's detail level. */
function initializeResume() {
  const formatButtons = document.querySelectorAll('[data-resume-view]');
  const webResume = document.querySelector('.resume-layout');
  const pdfResume = document.querySelector('#resume-pdf');
  const pdfFrame = pdfResume?.querySelector('iframe[data-src]');
  const densityButton = document.querySelector('.resume-density');
  const resumeSheet = document.querySelector('.resume-sheet');
  if (!webResume || !pdfResume || !densityButton || !resumeSheet) return;

  for (const formatButton of formatButtons) {
    formatButton.addEventListener('click', () => {
      const showPdf = formatButton.dataset.resumeView === 'pdf';

      for (const button of formatButtons) {
        button.setAttribute('aria-pressed', String(button === formatButton));
      }

      webResume.hidden = showPdf;
      pdfResume.hidden = !showPdf;
      densityButton.hidden = showPdf;

      // Download the embedded PDF only when the visitor first opens that view.
      if (showPdf && pdfFrame && !pdfFrame.hasAttribute('src')) {
        pdfFrame.src = pdfFrame.dataset.src;
      }
    });
  }

  densityButton.addEventListener('click', () => {
    const compact = resumeSheet.classList.toggle('is-compact');
    densityButton.setAttribute('aria-pressed', String(compact));
    densityButton.textContent = compact ? 'Show full details' : 'Show highlights';
  });
}

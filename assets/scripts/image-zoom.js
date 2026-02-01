// Fix: changed selector to be more inclusive and correct for the theme structure
const selector = '.md-typeset img';
const MIN_WIDTH = 120;

const isDecorative = (img) => {
  if (!img) return true;
  if (img.closest('a.md-logo')) return true;
  if (img.classList.contains('tl9-bg')) return true;
  if (img.closest('figure')?.classList.contains('tl9-cover')) return false;
  return false;
};

const overlay = document.createElement('div');
overlay.className = 'tl9-img-zoom';
overlay.innerHTML = `
    <button class="tl9-img-zoom__close" type="button" aria-label="Close image">&times;</button>
    <img class="tl9-img-zoom__img" alt="" />
  `;
const overlayImg = overlay.querySelector('.tl9-img-zoom__img');
const closeBtn = overlay.querySelector('.tl9-img-zoom__close');

// State for zoom and pan
const zoomState = { scale: 2, x: 0, y: 0 };

const close = () => {
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // Clear image after transition (optional) or immediately
  setTimeout(() => {
    if (!overlay.classList.contains('is-open')) overlayImg.src = '';
  }, 200);

  // Reset state
  zoomState.x = 0;
  zoomState.y = 0;
  zoomState.scale = 2; // Reset to default
};

const open = (img) => {
  overlayImg.src = img.currentSrc || img.src;
  overlayImg.alt = img.alt || '';
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Default zoom level (2x) and reset position
  zoomState.scale = 2;
  zoomState.x = 0;
  zoomState.y = 0;
  overlayImg.style.transform = `translate(0px, 0px) scale(2)`;
};

const onClick = (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.naturalWidth < MIN_WIDTH) return;
  if (isDecorative(img)) return;
  event.preventDefault();
  event.stopPropagation();
  open(img);
};

const bindImages = () => {
  document.querySelectorAll(selector).forEach((img) => {
    if (img.dataset.tl9ZoomBound) return;
    img.dataset.tl9ZoomBound = 'true';
    img.classList.add('tl9-img-zoomable');
    img.addEventListener('click', onClick);
  });
};

// Drag-to-pan & Click-to-close Logic
let isDragging = false;
let hasMoved = false; // Distinguish click from drag
let startX = 0;
let startY = 0;
let originX = 0;
let originY = 0;

const onPointerDown = (e) => {
  if (!overlay.classList.contains('is-open')) return;
  if (e.target !== overlayImg) return;

  isDragging = true;
  hasMoved = false; // Reset move flag

  overlayImg.setPointerCapture?.(e.pointerId);
  overlayImg.style.cursor = 'grabbing';

  startX = e.clientX;
  startY = e.clientY;
  originX = zoomState.x;
  originY = zoomState.y;

  // We do NOT preventDefault here to allow click generation later if no move
};

const onPointerMove = (e) => {
  if (!isDragging) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  // Threshold to consider it a drag (pan)
  if (Math.hypot(dx, dy) > 5) {
    hasMoved = true;
  }

  zoomState.x = originX + dx;
  zoomState.y = originY + dy;

  // Apply transform (translate + scale)
  overlayImg.style.transform = `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;
};

const onPointerUp = (e) => {
  if (!isDragging) return;
  isDragging = false;
  overlayImg.releasePointerCapture?.(e.pointerId);
  overlayImg.style.cursor = 'grab';
};

// Attach pointer events to the image
overlayImg.addEventListener('pointerdown', onPointerDown);
overlayImg.addEventListener('pointermove', onPointerMove);
overlayImg.addEventListener('pointerup', onPointerUp);
overlayImg.addEventListener('pointercancel', onPointerUp);

// Unified click handler for the overlay
overlay.addEventListener('click', (e) => {
  // 1. Click on Close Button
  if (e.target.closest('.tl9-img-zoom__close')) {
    close();
    return;
  }

  // 2. Click on Background -> Always Close
  if (e.target === overlay) {
    close();
    return;
  }

  // 3. Click on Image -> Close ONLY if not dragged (panned)
  if (e.target === overlayImg) {
    if (!hasMoved) {
      close();
    }
  }
});

// Handle Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') close();
});

const init = () => {
  if (!document.body) return;
  if (!document.body.contains(overlay)) {
    document.body.appendChild(overlay);
  }
  bindImages();
};

// Delegate clicks: resilient to late-rendered content.
document.addEventListener('click', (event) => {
  const img = event.target instanceof Element ? event.target.closest('img') : null;
  if (!img) return;
  if (!img.matches(selector)) return;
  if (img.naturalWidth < MIN_WIDTH) return;
  if (isDecorative(img)) return;
  event.preventDefault();
  event.stopPropagation();
  open(img);
}, true);

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('navigation.instant', init);
window.addEventListener('pageshow', init);
if (document.readyState !== 'loading') {
  init();
}

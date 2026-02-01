/**
 * Simple Horizontal Slider
 * Handles next/prev buttons for .post-slider containers
 */
document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.post-slider');

  sliders.forEach(slider => {
    const container = slider.querySelector('.post-grid--slider');
    const prevBtn = slider.querySelector('[data-post-slider-prev]');
    const nextBtn = slider.querySelector('[data-post-slider-next]');

    if (!container || !prevBtn || !nextBtn) return;

    // Scroll amount: usually the width of one card + gap
    // We can approximate or measure dynamically.
    // Let's scroll by ~300px (card width) for smoothness.
    const scrollAmount = 320;

    const updateButtons = () => {
      const tolerance = 10;
      // Start
      if (container.scrollLeft <= tolerance) {
        prevBtn.disabled = true;
      } else {
        prevBtn.disabled = false;
      }

      // End
      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - tolerance) {
        nextBtn.disabled = true;
      } else {
        nextBtn.disabled = false;
      }
    };

    // Initial check
    updateButtons();

    // Event Listeners
    prevBtn.addEventListener('click', () => {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    container.addEventListener('scroll', () => {
      // Debounce slightly if needed, but for button state simple rAF or direct call is fine
      // for modern browsers.
      window.requestAnimationFrame(updateButtons);
    });

    // Resize observer to handle responsiveness changes
    new ResizeObserver(updateButtons).observe(container);
  });
});

/* Keyboard activation for legacy label-based photo close controls.
   Native buttons and anchors keep their own default behavior. */
(() => {
  'use strict';
  document.addEventListener('keydown', event => {
    const target = event.target;
    if (!(target instanceof Element) ||
        !target.matches('label.sc-close[role="button"]')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) target.click();
  });
})();

/**
 * FAQ Accordion Management
 * Ensures only one FAQ item can be open at a time
 */

document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    item.addEventListener('toggle', function(e) {
      // If this item is being opened
      if (this.open) {
        // Close all other FAQ items
        faqItems.forEach(otherItem => {
          if (otherItem !== this) {
            otherItem.open = false;
          }
        });
      }
    });
  });
});

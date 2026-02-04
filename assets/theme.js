/* ========================================
   Mini DigiCam Theme - JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  initQuantitySelectors();
  initProductGallery();
  initAddToCart();
  initCartDrawer();
  initVariantSelectors();
});

/* Quantity Selectors */
function initQuantitySelectors() {
  const selectors = document.querySelectorAll('.quantity-input');

  selectors.forEach(selector => {
    const minusBtn = selector.querySelector('[data-action="minus"]');
    const plusBtn = selector.querySelector('[data-action="plus"]');
    const input = selector.querySelector('.quantity-value');

    if (!minusBtn || !plusBtn || !input) return;

    minusBtn.addEventListener('click', () => {
      const currentValue = parseInt(input.value) || 1;
      if (currentValue > 1) {
        input.value = currentValue - 1;
        input.dispatchEvent(new Event('change'));
      }
    });

    plusBtn.addEventListener('click', () => {
      const currentValue = parseInt(input.value) || 1;
      const max = parseInt(input.getAttribute('max')) || 99;
      if (currentValue < max) {
        input.value = currentValue + 1;
        input.dispatchEvent(new Event('change'));
      }
    });
  });
}

/* Product Gallery */
function initProductGallery() {
  const gallery = document.querySelector('.product-gallery');
  if (!gallery) return;

  const mainImage = gallery.querySelector('.product-main-image img');
  const thumbnails = gallery.querySelectorAll('.product-thumbnail');

  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
      // Update active state
      thumbnails.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      // Update main image
      const newSrc = thumb.getAttribute('data-full-src') || thumb.querySelector('img').src;
      mainImage.src = newSrc;
    });
  });
}

/* Add to Cart */
function initAddToCart() {
  const forms = document.querySelectorAll('[data-product-form], form[action*="/cart/add"]');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('[type="submit"]');
      const variantInput = form.querySelector('[name="id"], [data-variant-id]');
      const quantityInput = form.querySelector('[name="quantity"]');
      
      if (!variantInput || !variantInput.value) {
        console.error('No variant ID found');
        return;
      }

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Adding...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: parseInt(variantInput.value),
            quantity: parseInt(quantityInput?.value || 1)
          })
        });

        if (response.ok) {
          submitBtn.textContent = 'Added!';
          updateCartCount();

          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }, 2000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.description || 'Failed to add to cart');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        submitBtn.textContent = 'Error - Try again';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 2000);
      }
    });
  });
}

/* Update Cart Count */
async function updateCartCount() {
  try {
    const response = await fetch('/cart.js');
    const cart = await response.json();
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
      el.textContent = cart.item_count;
      el.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });
  } catch (error) {
    console.error('Failed to update cart count:', error);
  }
}

/* Cart Drawer (placeholder for future enhancement) */
function initCartDrawer() {
}

/* Variant Selectors */
function initVariantSelectors() {
  const variantDataEl = document.querySelector('[data-product-variants]');
  if (!variantDataEl) return;

  let variants;
  try {
    variants = JSON.parse(variantDataEl.textContent);
  } catch (e) {
    console.error('Failed to parse variant data:', e);
    return;
  }

  const form = variantDataEl.closest('form') || document.querySelector('[data-product-form]');
  if (!form) return;

  const selects = form.querySelectorAll('.variant-select');
  const variantIdInput = form.querySelector('[data-variant-id]');
  const priceDisplay = document.querySelector('[data-product-price]');
  const addToCartBtn = form.querySelector('.add-to-cart-btn');
  const mainImage = document.querySelector('#product-main-img');
  const thumbnails = document.querySelectorAll('.product-thumbnail');

  function getSelectedOptions() {
    const options = [];
    selects.forEach(select => {
      options.push(select.value);
    });
    return options;
  }

  function findVariant(options) {
    return variants.find(variant => {
      return options.every((option, index) => {
        return variant.options[index] === option;
      });
    });
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function updateVariant() {
    const selectedOptions = getSelectedOptions();
    const variant = findVariant(selectedOptions);

    if (variant) {
      if (variantIdInput) {
        variantIdInput.value = variant.id;
      }

      if (priceDisplay) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          priceDisplay.innerHTML = `
            <span class="product-price__sale">${formatMoney(variant.price)}</span>
            <span class="product-price__compare" style="text-decoration: line-through; color: var(--color-text-light); margin-left: 0.5rem; font-size: 1rem;">
              ${formatMoney(variant.compare_at_price)}
            </span>
            <span class="product-price__badge" style="display: inline-block; background: var(--color-accent); color: white; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.75rem; margin-left: 0.5rem;">
              Sale
            </span>
          `;
        } else {
          priceDisplay.textContent = formatMoney(variant.price);
        }
      }

      if (addToCartBtn) {
        if (variant.available) {
          addToCartBtn.disabled = false;
          addToCartBtn.textContent = 'Add to cart — ' + formatMoney(variant.price);
        } else {
          addToCartBtn.disabled = true;
          addToCartBtn.textContent = 'Sold out';
        }
      }

      if (mainImage && variant.featured_image && variant.featured_image.src) {
        mainImage.src = variant.featured_image.src;
        
        thumbnails.forEach(thumb => {
          thumb.classList.remove('active');
        });
        
        const variantImageName = variant.featured_image.src.split('/').pop().split('?')[0];
        thumbnails.forEach(thumb => {
          const thumbSrc = thumb.getAttribute('data-full-src') || '';
          const thumbImageName = thumbSrc.split('/').pop().split('?')[0];
          if (thumbImageName === variantImageName) {
            thumb.classList.add('active');
          }
        });
        
        if (!document.querySelector('.product-thumbnail.active') && thumbnails.length > 0) {
          thumbnails[0].classList.add('active');
        }
      }

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    }
  }

  selects.forEach(select => {
    select.addEventListener('change', updateVariant);
  });
}

/* Cart Page - Update Quantity */
window.updateCartQuantity = async function(key, quantity) {
  try {
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: key,
        quantity: quantity
      })
    });

    if (response.ok) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to update cart:', error);
  }
};

/* Cart Page - Remove Item */
window.removeCartItem = function(key) {
  updateCartQuantity(key, 0);
};

/* Smooth scroll for anchor links */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

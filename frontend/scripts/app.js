/* KLYVANTA website interactions — frontend only. */
(() => {
  'use strict';

  const COMPANY = {
    name: 'KLYVANTA SOLUTION PRIVATE LIMITED',
    whatsappNumbers: ['918076477680', '919990965184', '919560404881']
  };

  const byId = (id) => document.getElementById(id);
  const year = byId('year');
  if (year) year.textContent = new Date().getFullYear();

  // Responsive navigation: closed on mobile until the menu button is pressed.
  const menuButton = byId('menu');
  const navigation = byId('navlinks');

  function closeNavigation() {
    if (!menuButton || !navigation) return;
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.textContent = '☰';
  }

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      menuButton.textContent = isOpen ? '×' : '☰';
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNavigation);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 850) closeNavigation();
    });
  }

  // Service gallery modal.
  const galleryModal = byId('gallery-modal');
  const galleryGrid = byId('gallery-grid');
  const galleryData = window.KLYVANTA_SERVICE_GALLERIES || {};
  const serviceCards = document.querySelectorAll('.service');

  function openGallery(serviceName) {
    if (!galleryModal || !galleryGrid) return;
    const photos = galleryData[serviceName] || [];
    byId('gallery-title').textContent = serviceName;
    byId('gallery-subtitle').textContent =
      `${photos.length} illustrative reference photos for ${serviceName}.`;

    galleryGrid.replaceChildren();

    photos.forEach(([imageUrl, caption, credit, sourceUrl]) => {
      const article = document.createElement('article');
      article.className = 'gallery-item';

      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = caption;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', () => {
        article.classList.add('image-error');
        image.alt = 'Image unavailable';
      });

      const description = document.createElement('span');
      description.append(document.createTextNode(caption));

      const creditLine = document.createElement('small');
      creditLine.className = 'image-credit';
      creditLine.append(document.createTextNode('Reference image · Source: '));

      const sourceLink = document.createElement('a');
      sourceLink.href = sourceUrl;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.textContent = credit;
      creditLine.append(sourceLink);
      description.append(creditLine);
      article.append(image, description);
      galleryGrid.append(article);
    });

    galleryModal.classList.add('open');
    galleryModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeGallery() {
    if (!galleryModal) return;
    galleryModal.classList.remove('open');
    galleryModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  serviceCards.forEach((card) => {
    card.addEventListener('click', () => openGallery(card.dataset.service));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openGallery(card.dataset.service);
      }
    });
  });

  byId('gallery-close')?.addEventListener('click', closeGallery);
  galleryModal?.addEventListener('click', (event) => {
    if (event.target === galleryModal) closeGallery();
  });

  // WhatsApp choice dialog. The visitor must press Send in WhatsApp; the browser
  // cannot silently send a WhatsApp message to either number.
  const whatsappDialog = byId('whatsapp-choice');
  const enquiryForm = byId('enquiry-form');

  function closeWhatsAppDialog() {
    whatsappDialog?.classList.remove('open');
    whatsappDialog?.setAttribute('aria-hidden', 'true');
  }

  function showWhatsAppDialog(message) {
    const encodedMessage = encodeURIComponent(message);
    byId('whatsapp-primary').href =
      `https://wa.me/${COMPANY.whatsappNumbers[0]}?text=${encodedMessage}`;
    byId('whatsapp-secondary').href =
      `https://wa.me/${COMPANY.whatsappNumbers[1]}?text=${encodedMessage}`;
    byId('whatsapp-tertiary').href =
      `https://wa.me/${COMPANY.whatsappNumbers[2]}?text=${encodedMessage}`;
    whatsappDialog.classList.add('open');
    whatsappDialog.setAttribute('aria-hidden', 'false');
  }

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!enquiryForm.reportValidity()) return;

      const formData = new FormData(enquiryForm);
      const enquiry = {
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        service: String(formData.get('service') || '').trim(),
        message: String(formData.get('message') || '').trim()
      };

      const enquiryMessage = [
        `New Website Enquiry - ${COMPANY.name}`,
        `Name: ${enquiry.name}`,
        `Phone: ${enquiry.phone}`,
        `Email: ${enquiry.email || 'Not provided'}`,
        `Service: ${enquiry.service}`,
        `Project details: ${enquiry.message}`
      ].join('\n');

      const submitButton = enquiryForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting…';

      let savedOnServer = false;
      try {
        // The project can be previewed with Live Server (5500–5599) or served
        // directly by Express (5000). Always send API requests to the backend.
        const isLocalLiveServer =
          ['localhost', '127.0.0.1'].includes(window.location.hostname) &&
          /^55\d{2}$/.test(window.location.port);
        const apiBase = isLocalLiveServer
          ? 'http://127.0.0.1:5000/api'
          : '/api';
        const response = await fetch(`${apiBase}/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enquiry)
        });
        const responseText = await response.text();
        let result = {};
        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch (_parseError) {
          throw new Error('The enquiry server returned an invalid response.');
        }
        if (!response.ok) {
          throw new Error(result.message || 'Unable to save your enquiry.');
        }
        savedOnServer = true;
      } catch (error) {
        // Do not block a customer from contacting the company if the local
        // backend is not running. WhatsApp remains the primary enquiry route.
        console.warn('Enquiry API unavailable; opening WhatsApp instead:', error.message);
      }

      const dialogDescription = byId('whatsapp-choice-description');
      if (dialogDescription) {
        dialogDescription.textContent = savedOnServer
          ? 'Your enquiry has been recorded. Choose the company WhatsApp contact to send it as well.'
          : 'Your enquiry is ready. Choose a company WhatsApp contact and press Send in WhatsApp.';
      }
      showWhatsAppDialog(enquiryMessage);
      enquiryForm.reset();
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    });
  }

  byId('whatsapp-float')?.addEventListener('click', (event) => {
    event.preventDefault();
    showWhatsAppDialog(
      `Hello ${COMPANY.name}, I would like to enquire about your services.`
    );
  });

  byId('choice-close')?.addEventListener('click', closeWhatsAppDialog);
  whatsappDialog?.addEventListener('click', (event) => {
    if (event.target === whatsappDialog) closeWhatsAppDialog();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeGallery();
      closeWhatsAppDialog();
      closeNavigation();
    }
  });
})();

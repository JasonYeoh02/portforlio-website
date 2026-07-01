// Navigation and mobile menu
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.menu-toggle');
    const navLinks = [...document.querySelectorAll('.nav-link')];
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    }));
    addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
    const backToTop = document.querySelector('.back-to-top');
    addEventListener('scroll', () => backToTop.classList.toggle('visible', scrollY > innerHeight * .75), { passive: true });
    backToTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

    // Smooth desktop wheel interpolation; touch and accessibility controls stay native
    const canSmoothWheel = matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canSmoothWheel) {
      let scrollTarget = scrollY;
      let scrollCurrent = scrollY;
      let scrollFrame = null;

      const animateScroll = () => {
        scrollCurrent += (scrollTarget - scrollCurrent) * .13;
        if (Math.abs(scrollTarget - scrollCurrent) < .5) {
          scrollCurrent = scrollTarget;
          scrollTo(0, scrollCurrent);
          scrollFrame = null;
          return;
        }
        scrollTo(0, scrollCurrent);
        scrollFrame = requestAnimationFrame(animateScroll);
      };

      addEventListener('wheel', event => {
        if (event.ctrlKey || event.target.closest('input, textarea, select')) return;
        event.preventDefault();
        const maxScroll = document.documentElement.scrollHeight - innerHeight;
        scrollTarget = Math.max(0, Math.min(maxScroll, scrollTarget + event.deltaY));
        scrollCurrent = scrollY;
        if (!scrollFrame) scrollFrame = requestAnimationFrame(animateScroll);
      }, { passive: false });

      addEventListener('scroll', () => {
        if (!scrollFrame) scrollTarget = scrollCurrent = scrollY;
      }, { passive: true });
    }

    // Soft cursor-following ambient light
    if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      addEventListener('pointermove', event => {
        document.documentElement.style.setProperty('--mouse-x', `${event.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${event.clientY}px`);
      }, { passive: true });
    }

    // Global gothic ash, ember, and gold-dust particle field
    const ambientCanvas = document.getElementById('ambient-particles');
    const ambientCtx = ambientCanvas.getContext('2d');
    let ambientParticles = [];
    let ambientFrame;

    function createAmbientParticle(fromBottom = false) {
      const depth = Math.random();
      return {
        x: Math.random() * innerWidth,
        y: fromBottom ? innerHeight + 12 : Math.random() * innerHeight,
        radius: .45 + depth * 1.35,
        speed: .08 + depth * .22,
        drift: (Math.random() - .5) * .16,
        sway: Math.random() * Math.PI * 2,
        alpha: .12 + depth * .32,
        tone: Math.random() > .7 ? 'gold' : Math.random() > .72 ? 'ash' : 'ember',
        flicker: Math.random() * Math.PI * 2
      };
    }

    function sizeAmbientParticles() {
      const dpr = Math.min(devicePixelRatio, 2);
      ambientCanvas.width = innerWidth * dpr;
      ambientCanvas.height = innerHeight * dpr;
      ambientCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(68, Math.max(32, Math.floor(innerWidth / 24)));
      ambientParticles = Array.from({ length: count }, () => createAmbientParticle());
    }

    function drawAmbientParticles(time = 0) {
      ambientCtx.clearRect(0, 0, innerWidth, innerHeight);
      ambientParticles.forEach((particle, index) => {
        particle.y -= particle.speed;
        particle.x += particle.drift + Math.sin(time * .0003 + particle.sway) * .035;
        particle.flicker += .015;
        if (particle.y < -15 || particle.x < -20 || particle.x > innerWidth + 20) ambientParticles[index] = createAmbientParticle(true);

        const pulse = .72 + Math.sin(particle.flicker) * .28;
        const color = particle.tone === 'gold' ? '182,148,98' : particle.tone === 'ash' ? '210,194,178' : '212,71,42';
        ambientCtx.beginPath();
        ambientCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ambientCtx.fillStyle = `rgba(${color},${particle.alpha * pulse})`;
        ambientCtx.shadowColor = `rgba(${color},${particle.alpha})`;
        ambientCtx.shadowBlur = particle.tone === 'ash' ? 2 : 7;
        ambientCtx.fill();
      });
      ambientCtx.shadowBlur = 0;
      ambientFrame = requestAnimationFrame(drawAmbientParticles);
    }

    sizeAmbientParticles();
    addEventListener('resize', sizeAmbientParticles, { passive: true });
    ambientFrame = requestAnimationFrame(drawAmbientParticles);

    // Dependency-free canvas light rays inspired by the supplied React/WebGL effect
    const raysCanvas = document.getElementById('light-rays');
    const raysCtx = raysCanvas.getContext('2d');
    const rayMouse = { x: .5, targetX: .5 };
    let raysFrame;
    const raySeeds = Array.from({ length: 9 }, (_, index) => ({
      offset: (index - 4) * .075,
      width: .035 + Math.random() * .055,
      alpha: .018 + Math.random() * .032,
      speed: .18 + Math.random() * .3,
      phase: Math.random() * Math.PI * 2
    }));

    function sizeRays() {
      const dpr = Math.min(devicePixelRatio, 2);
      raysCanvas.width = innerWidth * dpr;
      raysCanvas.height = innerHeight * dpr;
      raysCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawRays(time = 0) {
      const w = innerWidth, h = innerHeight;
      raysCtx.clearRect(0, 0, w, h);
      rayMouse.x += (rayMouse.targetX - rayMouse.x) * .025;
      const originX = w * .5;
      const influence = (rayMouse.x - .5) * .18;

      raySeeds.forEach(ray => {
        const wave = Math.sin(time * .00035 * ray.speed + ray.phase) * .025;
        const center = ray.offset + influence + wave;
        const endX = originX + (center * w * 2.1);
        const halfWidth = ray.width * w;
        const pulse = .78 + Math.sin(time * .0007 + ray.phase) * .22;
        const gradient = raysCtx.createLinearGradient(originX, -40, endX, h * .92);
        gradient.addColorStop(0, `rgba(238,108,66,${ray.alpha * 2.2 * pulse})`);
        gradient.addColorStop(.42, `rgba(192,57,43,${ray.alpha * pulse})`);
        gradient.addColorStop(1, 'rgba(192,57,43,0)');
        raysCtx.beginPath();
        raysCtx.moveTo(originX - 5, -30);
        raysCtx.lineTo(originX + 5, -30);
        raysCtx.lineTo(endX + halfWidth, h * .95);
        raysCtx.lineTo(endX - halfWidth, h * .95);
        raysCtx.closePath();
        raysCtx.fillStyle = gradient;
        raysCtx.fill();
      });
      raysFrame = requestAnimationFrame(drawRays);
    }

    addEventListener('pointermove', event => { rayMouse.targetX = event.clientX / innerWidth; }, { passive: true });
    addEventListener('resize', sizeRays, { passive: true });
    sizeRays();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) raysFrame = requestAnimationFrame(drawRays);

    // Scroll reveal and active navigation
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }), { rootMargin: '-35% 0px -55%', threshold: 0 });
    document.querySelectorAll('[data-section]').forEach(section => sectionObserver.observe(section));


    // Custom music preview controls. One shared player prevents songs from overlapping.
    const songButtons = [...document.querySelectorAll('.song-play')];
    const musicPlayer = new Audio();
    musicPlayer.volume = 0.1;
    let activeSongButton = null;

    const formatSongTime = seconds => {
      if (!Number.isFinite(seconds)) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${minutes}:${remaining}`;
    };

    const resetSongButton = button => {
      if (!button) return;
      button.classList.remove('is-playing');
      button.querySelector('.song-icon').textContent = 'Play';
    };

    songButtons.forEach(button => {
      button.addEventListener('click', () => {
        const source = button.dataset.src;
        if (!source) return;

        if (activeSongButton === button && !musicPlayer.paused) {
          musicPlayer.pause();
          resetSongButton(button);
          return;
        }

        resetSongButton(activeSongButton);
        activeSongButton = button;

        if (musicPlayer.src !== new URL(source, location.href).href) {
          musicPlayer.src = source;
        }

        button.classList.add('is-playing');
        button.querySelector('.song-icon').textContent = 'Pause';
        musicPlayer.play().catch(() => resetSongButton(button));
      });
    });

    musicPlayer.addEventListener('timeupdate', () => {
      if (!activeSongButton) return;
      const progress = musicPlayer.duration ? (musicPlayer.currentTime / musicPlayer.duration) * 100 : 0;
      activeSongButton.querySelector('.song-progress span').style.width = `${progress}%`;
      activeSongButton.querySelector('.song-time').textContent = formatSongTime(musicPlayer.currentTime);
    });

    musicPlayer.addEventListener('ended', () => {
      if (!activeSongButton) return;
      activeSongButton.querySelector('.song-progress span').style.width = '0%';
      activeSongButton.querySelector('.song-time').textContent = '0:00';
      resetSongButton(activeSongButton);
      activeSongButton = null;
    });

    // FYP screenshot modal
    const fypModal = document.getElementById('fyp-modal');
    const fypOpen = document.querySelector('.fyp-open');
    const fypImage = document.getElementById('fyp-modal-image');
    const fypTitle = document.getElementById('fyp-modal-title');
    const fypBrowser = document.getElementById('fyp-modal-browser');
    const fypDescription = document.getElementById('fyp-modal-description');
    const fypImageButton = document.querySelector('.fyp-image-button');
    const fypShots = [...document.querySelectorAll('.fyp-shot')];
    const fypPrev = document.querySelector('.fyp-prev');
    const fypNext = document.querySelector('.fyp-next');
    const fypSlideCount = document.getElementById('fyp-slide-count');
    const fypImageStage = document.querySelector('.fyp-modal-image');
    const fypDetail = document.querySelector('.fyp-detail');
    const fypGroups = {
      home: {
        title: 'Home Page',
        description: 'Landing page introducing the skincare platform and guiding users toward products, analysis, and appointments.',
        images: ['Images/fyp-project/home1.png', 'Images/fyp-project/home2.png']
      },
      login: {
        title: 'Login Page',
        description: 'Authentication screen for users and admins to access their respective platform functions.',
        images: ['Images/fyp-project/login1.png']
      },
      analysis: {
        title: 'Skin Analysis',
        description: 'Skin analysis flow where users can review skin-related inputs and receive recommendation-oriented results.',
        images: ['Images/fyp-project/skin-analysis1.png', 'Images/fyp-project/skin-analysis2.png']
      },
      appointment: {
        title: 'Appointment Booking',
        description: 'Customer appointment page for selecting service details and arranging a skincare consultation.',
        images: ['Images/fyp-project/appointment1.png']
      },
      products: {
        title: 'Product Listing',
        description: 'Product browsing page where users can explore skincare items and view available options.',
        images: ['Images/fyp-project/product1.png']
      },
      dashboard: {
        title: 'Admin Dashboard',
        description: 'Admin overview dashboard for monitoring platform activity and accessing management modules.',
        images: ['Images/fyp-project/admin-dashboard1.png']
      },
      manageProducts: {
        title: 'Manage Products',
        description: 'Admin product management flow for reviewing, editing, and maintaining skincare product records.',
        images: ['Images/fyp-project/manage-product1.png', 'Images/fyp-project/manage-product2.png']
      },
      manageAppointments: {
        title: 'Manage Appointments',
        description: 'Admin appointment management flow for reviewing user bookings and detailed consultation information.',
        images: ['Images/fyp-project/manage-appointment1.png', 'Images/fyp-project/manage-appointment2.png']
      },
      orders: {
        title: 'Manage Orders',
        description: 'Order list management page for tracking customer orders and purchase-related records.',
        images: ['Images/fyp-project/manage-orderlist1.png']
      },
      users: {
        title: 'Manage Users',
        description: 'User management page for viewing registered accounts and maintaining user records.',
        images: ['Images/fyp-project/manage-user1.png']
      }
    };
    let activeFypGroup = 'home';
    let activeFypIndex = 0;

    function renderFypSlide(animate = true) {
      const group = fypGroups[activeFypGroup];
      if (!group || !fypImage) return;
      const image = group.images[activeFypIndex] || group.images[0];
      const applySlide = () => {
        fypImage.src = image;
        fypImage.alt = `${group.title} screenshot ${activeFypIndex + 1}`;
        if (fypTitle) fypTitle.textContent = group.title;
        if (fypBrowser) fypBrowser.textContent = group.title;
        if (fypDescription) fypDescription.textContent = group.description;
        const hasMultiple = group.images.length > 1;
        fypPrev?.classList.toggle('is-hidden', !hasMultiple);
        fypNext?.classList.toggle('is-hidden', !hasMultiple);
        fypSlideCount?.classList.toggle('is-hidden', !hasMultiple);
        if (fypSlideCount) fypSlideCount.textContent = `${activeFypIndex + 1} / ${group.images.length}`;
        fypShots.forEach(item => item.classList.toggle('active', item.dataset.group === activeFypGroup));
      };

      if (!animate) {
        applySlide();
        return;
      }

      fypImageStage?.classList.add('is-changing');
      fypDetail?.classList.add('is-changing');
      setTimeout(() => {
        applySlide();
        requestAnimationFrame(() => {
          fypImageStage?.classList.remove('is-changing');
          fypDetail?.classList.remove('is-changing');
        });
      }, 220);
    }

    function moveFypSlide(direction) {
      const group = fypGroups[activeFypGroup];
      if (!group || group.images.length < 2) return;
      activeFypIndex = (activeFypIndex + direction + group.images.length) % group.images.length;
      renderFypSlide();
    }

    function openFypModal() {
      if (!fypModal) return;
      fypModal.classList.add('open');
      fypModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      renderFypSlide(false);
    }

    function closeFypModal() {
      if (!fypModal) return;
      if (fypModal.classList.contains('image-expanded')) {
        fypModal.classList.remove('image-expanded');
        return;
      }
      fypModal.classList.remove('open', 'image-expanded');
      fypModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    fypOpen?.addEventListener('click', openFypModal);
    document.querySelectorAll('[data-fyp-close]').forEach(closeTarget => closeTarget.addEventListener('click', closeFypModal));
    fypImageButton?.addEventListener('click', () => fypModal?.classList.toggle('image-expanded'));
    fypPrev?.addEventListener('click', event => { event.stopPropagation(); moveFypSlide(-1); });
    fypNext?.addEventListener('click', event => { event.stopPropagation(); moveFypSlide(1); });
    fypShots.forEach(shot => {
      shot.addEventListener('click', () => {
        activeFypGroup = shot.dataset.group || 'home';
        activeFypIndex = 0;
        fypModal?.classList.remove('image-expanded');
        renderFypSlide();
      });
    });
    addEventListener('keydown', event => {
      if (!fypModal?.classList.contains('open')) return;
      if (event.key === 'Escape') closeFypModal();
      if (event.key === 'ArrowLeft') moveFypSlide(-1);
      if (event.key === 'ArrowRight') moveFypSlide(1);
    });

    // Typewriter loop
    const phrases = ['IT Support Specialist', 'Infrastructure Enthusiast', 'Problem Solver', 'Fresh IT Graduate'];
    const typeTarget = document.getElementById('typewriter');
    let phraseIndex = 0, charIndex = 0, deleting = false;
    function typeLoop() {
      const phrase = phrases[phraseIndex];
      charIndex += deleting ? -1 : 1;
      typeTarget.textContent = phrase.slice(0, charIndex);
      let delay = deleting ? 42 : 78;
      if (!deleting && charIndex === phrase.length) { deleting = true; delay = 1600; }
      else if (deleting && charIndex === 0) { deleting = false; phraseIndex = (phraseIndex + 1) % phrases.length; delay = 400; }
      setTimeout(typeLoop, delay);
    }
    typeLoop();

    // Warm, slow-moving ember particles
    const canvas = document.getElementById('embers');
    const ctx = canvas.getContext('2d');
    let particles = [], animationId;
    function sizeCanvas() { canvas.width = innerWidth * devicePixelRatio; canvas.height = canvas.offsetHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
    function makeParticle(reset = false) { return { x: Math.random() * innerWidth, y: reset ? canvas.offsetHeight + 10 : Math.random() * canvas.offsetHeight, r: Math.random() * 1.4 + .35, vx: (Math.random() - .5) * .16, vy: -(Math.random() * .22 + .08), alpha: Math.random() * .32 + .08, gold: Math.random() > .65 }; }
    function initParticles() { particles = Array.from({ length: Math.min(70, Math.floor(innerWidth / 18)) }, () => makeParticle()); }
    function drawParticles() {
      ctx.clearRect(0, 0, innerWidth, canvas.offsetHeight);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10 || p.x < -10 || p.x > innerWidth + 10) particles[i] = makeParticle(true);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold ? `rgba(182,148,98,${p.alpha})` : `rgba(192,57,43,${p.alpha})`; ctx.fill();
      });
      animationId = requestAnimationFrame(drawParticles);
    }
    sizeCanvas(); initParticles();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) drawParticles();
    addEventListener('resize', () => { cancelAnimationFrame(animationId); sizeCanvas(); initParticles(); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) drawParticles(); });

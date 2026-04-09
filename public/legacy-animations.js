
    /* CURRICULUM LOGIN LOGIC */
    function openCurriculumLogin(e) {
      if (e) e.preventDefault();
      const modal = document.getElementById('login-modal');
      if (!modal) return;
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.style.pointerEvents = 'auto';
      const inner = modal.querySelector('div');
      if (inner) inner.style.transform = 'translateY(0)';
    }

    function closeCurriculumLogin() {
      const modal = document.getElementById('login-modal');
      if (!modal) return;
      modal.style.opacity = '0';
      modal.style.pointerEvents = 'none';
      const inner = modal.querySelector('div');
      if (inner) inner.style.transform = 'translateY(20px)';
      setTimeout(() => { modal.style.visibility = 'hidden'; }, 400);
      const error = document.getElementById('login-error');
      if (error) error.style.display = 'none';
    }

    function verifyCurriculumLogin() {
      const user = document.getElementById('modal-user').value.trim();
      const pass = document.getElementById('modal-pass').value.trim();
      const error = document.getElementById('login-error');

      // Credentials: admin / radix99
      if (user === 'DPSKhanapara' && pass === 'radixrobotics-DPSK') {
        window.location.href = 'main.html';
      } else {
        if (error) error.style.display = 'block';
        const modalBox = document.querySelector('#login-modal > div');
        if (typeof gsap !== 'undefined' && modalBox) {
          gsap.fromTo(modalBox, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true, onComplete: () => gsap.set(modalBox, { x: 0 }) });
        } else {
          alert('Incorrect username or password');
        }
      }

      if (user === 'DPSJorhat' && pass === 'radixrobotics-DPSJ') {
        window.location.href = 'main2.html';
      } else {
        if (error) error.style.display = 'block';
        const modalBox = document.querySelector('#login-modal > div');
        if (typeof gsap !== 'undefined' && modalBox) {
          gsap.fromTo(modalBox, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true, onComplete: () => gsap.set(modalBox, { x: 0 }) });
        } else {
          alert('Incorrect username or password');
        }
      }
    }

    // Attach listener after DOM loads
    document.addEventListener('DOMContentLoaded', () => {
      const link = document.getElementById('curriculum-link');
      if (link) link.addEventListener('click', openCurriculumLogin);

      // Mobile Menu Toggle
      const toggle = document.getElementById('mobile-toggle');
      const close = document.getElementById('mobile-close');
      const overlay = document.getElementById('nav-mobile-overlay');

      window.toggleMobileMenu = () => {
        overlay.classList.toggle('active');
        document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
      };

      if (toggle) toggle.addEventListener('click', toggleMobileMenu);
      if (close) close.addEventListener('click', toggleMobileMenu);
    });


    gsap.registerPlugin(ScrollTrigger);

    (function initHero3D() {
      const canvas = document.getElementById('hero-3d-element');
      if (!canvas) return;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, canvas.parentElement.clientWidth / canvas.parentElement.clientHeight, 0.1, 1000);
      camera.position.z = 20;

      function resize() {
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      resize(); window.addEventListener('resize', resize);

      // Lighting optimized for Light Theme
      const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(10, 15, 10);
      scene.add(dirLight);

      const cyanLight = new THREE.PointLight(0x0ea5e9, 2.5, 30);
      cyanLight.position.set(-5, 5, 5);
      scene.add(cyanLight);

      const indigoLight = new THREE.PointLight(0x4f46e5, 3, 30);
      indigoLight.position.set(5, -5, 5);
      scene.add(indigoLight);

      const group = new THREE.Group();
      scene.add(group);

      // 1. Central Ceramic Tech Gem
      const gemGeo = new THREE.IcosahedronGeometry(2.5, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        flatShading: true
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      group.add(gem);

      // 2. Outer Wireframe Shell
      const wireGeo = new THREE.IcosahedronGeometry(2.8, 1);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x4f46e5, // Indigo
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(wire);

      // 3. Gyroscopic Rings
      const ringMatDark = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.2 });
      const ringMatCyan = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.8 });

      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.06, 16, 100), ringMatDark);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.03, 16, 100), ringMatCyan);
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(6.0, 0.1, 16, 100), ringMatDark);

      ring1.rotation.x = Math.PI / 2;
      ring2.rotation.y = Math.PI / 3;
      ring3.rotation.x = Math.PI / 4;
      ring3.rotation.y = Math.PI / 4;

      group.add(ring1); group.add(ring2); group.add(ring3);

      // 4. Floating Data Cubes
      const particleCount = 45;
      const particles = new THREE.Group();
      const pGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const pMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, metalness: 0.3, roughness: 0.2 });

      for (let i = 0; i < particleCount; i++) {
        const p = new THREE.Mesh(pGeo, pMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 7 + Math.random() * 4;
        p.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        p.userData = {
          rx: (Math.random() - 0.5) * 0.05,
          ry: (Math.random() - 0.5) * 0.05,
          rz: (Math.random() - 0.5) * 0.05
        };
        particles.add(p);
      }
      group.add(particles);

      // Mouse Interaction
      let targetRotX = 0, targetRotY = 0;
      document.addEventListener('mousemove', (e) => {
        targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.6;
        targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.6;
      });

      let t = 0;
      function animate() {
        requestAnimationFrame(animate);
        t += 0.01;

        // Smooth group rotation to mouse
        group.rotation.y += (targetRotY - group.rotation.y) * 0.05;
        group.rotation.x += (targetRotX - group.rotation.x) * 0.05;

        // Gentle floating effect
        group.position.y = Math.sin(t * 2) * 0.4;

        // Internal component rotation
        gem.rotation.y += 0.003;
        gem.rotation.x += 0.002;
        wire.rotation.y -= 0.002;
        wire.rotation.z += 0.001;

        ring1.rotation.x += 0.008;
        ring2.rotation.y -= 0.012;
        ring3.rotation.z += 0.005;

        particles.rotation.y += 0.003;
        particles.rotation.z -= 0.001;

        // Individual cube rotations
        particles.children.forEach(p => {
          p.rotation.x += p.userData.rx;
          p.rotation.y += p.userData.ry;
          p.rotation.z += p.userData.rz;
        });

        renderer.render(scene, camera);
      }
      animate();
    })();


    /* NAV SCROLL */
    window.addEventListener('scroll', () => document.getElementById('nav').classList.toggle('scrolled', scrollY > 40));

    /* HERO ENTRANCE */
    const htl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    htl.to('.hero-badge', { opacity: 1, y: 0, duration: .9, delay: .2 })
      .to('.hero-title', { opacity: 1, y: 0, duration: 1 }, '-=.5')
      .to('.hero-sub', { opacity: 1, y: 0, duration: .8 }, '-=.55')
      .to('.hero-actions', { opacity: 1, y: 0, duration: .7 }, '-=.5')
      .to('.hero-stats', { opacity: 1, y: 0, duration: .7 }, '-=.4')
      .to('.hero-canvas-wrap', { opacity: 1, x: 0, duration: .9 }, '-=.7');

    /* COUNTERS */
    ScrollTrigger.create({
      trigger: '.hero-stats', start: 'top 90%', once: true, onEnter: () => {
        document.querySelectorAll('.stat-num').forEach(el => {
          const t = parseInt(el.dataset.target), s = t === 98 ? '%' : '+';
          gsap.to({ v: 0 }, { v: t, duration: 2.5, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(this.targets()[0].v).toLocaleString() + s; } });
        });
      }
    });

    /* REVEALS */
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 89%', once: true } });
    });

    /* PROG CARD STAGGER */
    gsap.utils.toArray('.prog-card').forEach((c, i) => {
      ScrollTrigger.create({ trigger: c, start: 'top 90%', once: true, onEnter: () => gsap.fromTo(c, { opacity: 0, y: 50, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .7, delay: (i % 3) * .1, ease: 'power3.out' }) });
    });

    /* ── THREE.JS HERO BACKGROUND (particle + wireframe robot) ── */
    (function () {
      const cv = document.getElementById('hero-canvas');
      const rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1, .1, 1000);
      cam.position.z = 28;
      function rsz() { rdr.setSize(cv.clientWidth, cv.clientHeight); cam.aspect = cv.clientWidth / cv.clientHeight; cam.updateProjectionMatrix(); }
      rsz(); window.addEventListener('resize', rsz);
      const N = 260, pos = new Float32Array(N * 3), vel = [];
      for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 80; pos[i * 3 + 1] = (Math.random() - .5) * 50; pos[i * 3 + 2] = (Math.random() - .5) * 28; vel.push({ x: (Math.random() - .5) * .014, y: (Math.random() - .5) * .014 }); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      sc.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x2563eb, size: .2, transparent: true, opacity: .5 })));
      const lm = new THREE.LineBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: .05 });
      for (let i = -12; i <= 12; i += 3) {
        sc.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-40, i, -8), new THREE.Vector3(40, i, -8)]), lm));
        sc.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 3, -25, -8), new THREE.Vector3(i * 3, 25, -8)]), lm));
      }
      const wm = new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: .1 });
      const rg = new THREE.Group();
      rg.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(4, 5, 2), wm), { position: { x: 0, y: .5, z: 0 } }));
      const hd = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2), wm); hd.position.y = 4.2; rg.add(hd);
      const aL = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), wm); aL.position.set(-2.8, .5, 0); rg.add(aL);
      const aR = aL.clone(); aR.position.x = 2.8; rg.add(aR);
      const lL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 1.5), wm); lL.position.set(-1.2, -4.5, 0); rg.add(lL);
      const lR = lL.clone(); lR.position.x = 1.2; rg.add(lR);
      const em = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: .85 });
      const eL = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 8), em); eL.position.set(-.55, 4.2, 1.1); rg.add(eL);
      const eR = eL.clone(); eR.position.x = .55; rg.add(eR);
      rg.position.set(14, -1, 0); sc.add(rg);
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(7, .04, 8, 80), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: .18 }));
      r1.rotation.x = Math.PI / 2; r1.position.set(14, -1, 0); sc.add(r1);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(9.5, .03, 8, 80), new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: .1 }));
      r2.rotation.x = Math.PI / 3; r2.rotation.z = Math.PI / 4; r2.position.set(14, -1, 0); sc.add(r2);
      let mRX = 0, mRY = 0;
      document.addEventListener('mousemove', e => { mRX = (e.clientY / innerHeight - .5) * .25; mRY = (e.clientX / innerWidth - .5) * .4; });
      let t = 0; (function an() {
        requestAnimationFrame(an); t += .005;
        const a = pg.attributes.position.array;
        for (let i = 0; i < N; i++) { a[i * 3] += vel[i].x; a[i * 3 + 1] += vel[i].y; if (Math.abs(a[i * 3]) > 40) vel[i].x *= -1; if (Math.abs(a[i * 3 + 1]) > 25) vel[i].y *= -1; }
        pg.attributes.position.needsUpdate = true;
        rg.rotation.y = Math.sin(t * .5) * .3 + mRY; rg.rotation.x = mRX; rg.position.y = -1 + Math.sin(t) * .5;
        r1.rotation.z += .003; r2.rotation.y += .004;
        rdr.render(sc, cam);
      })();
    })();

    /* ── THREE.JS HERO 3D GEM (right panel) ── */
    (function () {
      const canvas = document.getElementById('hero-3d-element');
      if (!canvas) return;
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, canvas.parentElement.clientWidth / canvas.parentElement.clientHeight, .1, 1000);
      camera.position.z = 20;
      function resize() { const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
      resize(); window.addEventListener('resize', resize);
      scene.add(new THREE.AmbientLight(0xffffff, .9));
      const dir = new THREE.DirectionalLight(0xffffff, .6); dir.position.set(10, 15, 10); scene.add(dir);
      const cyan = new THREE.PointLight(0x0ea5e9, 2.5, 30); cyan.position.set(-5, 5, 5); scene.add(cyan);
      const ind = new THREE.PointLight(0x4f46e5, 3, 30); ind.position.set(5, -5, 5); scene.add(ind);
      const group = new THREE.Group(); scene.add(group);
      const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: .1, roughness: .2, clearcoat: 1, clearcoatRoughness: .1, flatShading: true }));
      group.add(gem);
      const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 1), new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true, transparent: true, opacity: .15 }));
      group.add(wire);
      const rDark = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: .7, roughness: .2 });
      const rCyan = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: .8 });
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(4.5, .06, 16, 100), rDark); ring1.rotation.x = Math.PI / 2; group.add(ring1);
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.2, .03, 16, 100), rCyan); ring2.rotation.y = Math.PI / 3; group.add(ring2);
      const ring3 = new THREE.Mesh(new THREE.TorusGeometry(6, .1, 16, 100), rDark); ring3.rotation.x = Math.PI / 4; ring3.rotation.y = Math.PI / 4; group.add(ring3);
      const particles = new THREE.Group();
      const pGeo = new THREE.BoxGeometry(.25, .25, .25);
      const pMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, metalness: .3, roughness: .2 });
      for (let i = 0; i < 45; i++) {
        const p = new THREE.Mesh(pGeo, pMat);
        const theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 2 - 1), r = 7 + Math.random() * 4;
        p.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
        p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        p.userData = { rx: (Math.random() - .5) * .05, ry: (Math.random() - .5) * .05, rz: (Math.random() - .5) * .05 };
        particles.add(p);
      }
      group.add(particles);
      let tRX = 0, tRY = 0;
      document.addEventListener('mousemove', e => { tRY = (e.clientX / innerWidth - .5) * .6; tRX = (e.clientY / innerHeight - .5) * .6; });
      let t = 0; (function an() {
        requestAnimationFrame(an); t += .01;
        group.rotation.y += (tRY - group.rotation.y) * .05; group.rotation.x += (tRX - group.rotation.x) * .05;
        group.position.y = Math.sin(t * 2) * .4;
        gem.rotation.y += .003; gem.rotation.x += .002;
        wire.rotation.y -= .002; wire.rotation.z += .001;
        ring1.rotation.x += .008; ring2.rotation.y -= .012; ring3.rotation.z += .005;
        particles.rotation.y += .003; particles.rotation.z -= .001;
        particles.children.forEach(p => { p.rotation.x += p.userData.rx; p.rotation.y += p.userData.ry; p.rotation.z += p.userData.rz; });
        renderer.render(scene, camera);
      })();
    })();

    /* ── THREE.JS LAB CANVAS ── */
    (function () {
      const cv = document.getElementById('lab-canvas');
      if (!cv) return;
      const rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, .1, 100);
      cam.position.set(0, 0, 10);
      function rsz() { const w = cv.clientWidth; rdr.setSize(w, w); }
      rsz(); window.addEventListener('resize', rsz);
      const g = new THREE.Group(); sc.add(g);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(7, 7, .15), new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: .95 })));
      const tm = new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: .3 });
      [[[-3, 3, .1], [3, 3, .1]], [[-3, 1, .1], [3, 1, .1]], [[-3, -1, .1], [3, -1, .1]], [[-3, -3, .1], [3, -3, .1]], [[-3, 3, .1], [-3, -3, .1]], [[0, 3, .1], [0, -3, .1]], [[3, 3, .1], [3, -3, .1]], [[1.5, 3, .1], [1.5, -3, .1]]].forEach(pts => {
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), tm));
      });
      const chipColors = [0xfbcfe8, 0xbfdbfe, 0xbbf7d0, 0xfef08a, 0xa5f3fc];
      [[0, 0, .1], [1.5, 1.5, .1], [-1.5, -1.5, .1], [1.5, -1.5, .1], [-1.5, 1.5, .1]].forEach(([x, y, z], i) => {
        const cm = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .08), new THREE.MeshBasicMaterial({ color: chipColors[i] })); cm.position.set(x, y, z); g.add(cm);
        const co = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .08), new THREE.MeshBasicMaterial({ color: 0x2563eb, wireframe: true, transparent: true, opacity: .5 })); co.position.set(x, y, z + .05); g.add(co);
      });
      const sm = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
      for (let i = 0; i < 22; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.055, 6, 6), sm); s.position.set((Math.random() - .5) * 6, (Math.random() - .5) * 6, .18); g.add(s); }
      const h = new THREE.Mesh(new THREE.TorusGeometry(4, .04, 8, 60), new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: .22 })); h.position.z = .1; g.add(h);
      let t = 0; (function an() { requestAnimationFrame(an); t += .007; g.rotation.y = Math.sin(t * .5) * .7; g.rotation.x = Math.sin(t * .3) * .3; h.rotation.z += .008; rdr.render(sc, cam); })();
    })();

    /* ── THREE.JS MINI BENTO CHART ── */
    (function () {
      const cv = document.getElementById('mini-canvas');
      if (!cv) return;
      function getH() { return cv.parentElement.clientHeight || 340; }
      const rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, 1, .1, 100);
      cam.position.set(0, 0, 6);
      function rsz() { const w = cv.clientWidth, h = getH(); rdr.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      rsz(); window.addEventListener('resize', rsz);
      const colors = [0xfbcfe8, 0xbfdbfe, 0xbbf7d0, 0xfef08a, 0xe9d5ff, 0xfed7aa, 0x1e3a8a, 0xa5f3fc];
      [.35, .6, .48, .82, .6, .78, .95, .68].forEach((h, i) => {
        const mat = new THREE.MeshBasicMaterial({ color: colors[i] });
        const b = new THREE.Mesh(new THREE.BoxGeometry(.28, h * 2.8, .1), mat); b.position.set(-1.8 + i * .52, h * 1.4 - 1.4, 0); sc.add(b);
      });
      sc.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(5, .02, .1), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })), { position: { x: 0, y: -1.4, z: 0 } }));
      (function an() { requestAnimationFrame(an); rdr.render(sc, cam); })();
    })();

    /* ── THREE.JS CTA SPIRAL ── */
    (function () {
      const cv = document.getElementById('cta-canvas');
      const rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(70, cv.clientWidth / cv.clientHeight, .1, 1000);
      cam.position.z = 22;
      function rsz() { rdr.setSize(cv.clientWidth, cv.clientHeight); cam.aspect = cv.clientWidth / cv.clientHeight; cam.updateProjectionMatrix(); }
      rsz(); window.addEventListener('resize', rsz);
      const N = 600, p = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 22, r = (i / N) * 16; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = Math.sin(a) * r; p[i * 3 + 2] = (Math.random() - .5) * 3; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const sp = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x60a5fa, size: .14, transparent: true, opacity: .4 })); sc.add(sp);
      const N2 = 200, p2 = new Float32Array(N2 * 3);
      for (let i = 0; i < N2; i++) { const a = (i / N2) * Math.PI * 8, r = 5 + (i / N2) * 4; p2[i * 3] = Math.cos(a) * r; p2[i * 3 + 1] = Math.sin(a) * r; p2[i * 3 + 2] = (Math.random() - .5) * 1.5; }
      const sg2 = new THREE.BufferGeometry(); sg2.setAttribute('position', new THREE.BufferAttribute(p2, 3));
      sc.add(new THREE.Points(sg2, new THREE.PointsMaterial({ color: 0x93c5fd, size: .1, transparent: true, opacity: .28 })));
      let t = 0; (function an() { requestAnimationFrame(an); t += .003; sp.rotation.z += .004; sp.rotation.x = Math.sin(t) * .15; rdr.render(sc, cam); })();
    })();



  
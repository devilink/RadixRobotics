    gsap.registerPlugin(ScrollTrigger);

    /* NAV SCROLL */
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    });

    /* REVEALS */
    gsap.utils.toArray('.reveal').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 89%', once: true } });
    });

    /* PROG CARD STAGGER */
    gsap.utils.toArray('.prog-card').forEach((c, i) => {
      ScrollTrigger.create({ trigger: c, start: 'top 90%', once: true, onEnter: () => gsap.fromTo(c, { opacity: 0, y: 50, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: 1, delay: (i % 3) * .1, ease: 'expo.out' }) });
    });

    /* BENTO MULTI-SPEED PARALLAX */
    gsap.utils.toArray('.bi-cell').forEach((c, i) => {
      gsap.to(c, {
         y: (i % 3 === 0 ? '-45px' : i % 2 === 0 ? '25px' : '-20px'),
         ease: "none",
         scrollTrigger: { trigger: ".bento-impact", start: "top bottom", end: "bottom top", scrub: 1.2 }
      });
    });

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
      g.add(new THREE.Mesh(new THREE.BoxGeometry(7, 7, .15), new THREE.MeshBasicMaterial({ color: 0x0b1226, transparent: true, opacity: .95 })));
      const tm = new THREE.LineBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: .5 });
      [[[-3, 3, .1], [3, 3, .1]], [[-3, 1, .1], [3, 1, .1]], [[-3, -1, .1], [3, -1, .1]], [[-3, -3, .1], [3, -3, .1]], [[-3, 3, .1], [-3, -3, .1]], [[0, 3, .1], [0, -3, .1]], [[3, 3, .1], [3, -3, .1]], [[1.5, 3, .1], [1.5, -3, .1]]].forEach(pts => {
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), tm));
      });
      const chipColors = [0xFF0055, 0x00E5FF, 0x00FF80, 0xFACC15, 0x7000FF];
      [[0, 0, .1], [1.5, 1.5, .1], [-1.5, -1.5, .1], [1.5, -1.5, .1], [-1.5, 1.5, .1]].forEach(([x, y, z], i) => {
        const cm = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .08), new THREE.MeshBasicMaterial({ color: chipColors[i] })); cm.position.set(x, y, z); g.add(cm);
        const co = new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .08), new THREE.MeshBasicMaterial({ color: 0x00E5FF, wireframe: true, transparent: true, opacity: .8 })); co.position.set(x, y, z + .05); g.add(co);
      });
      const sm = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      for (let i = 0; i < 22; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.055, 6, 6), sm); s.position.set((Math.random() - .5) * 6, (Math.random() - .5) * 6, .18); g.add(s); }
      const h = new THREE.Mesh(new THREE.TorusGeometry(4, .04, 8, 60), new THREE.MeshBasicMaterial({ color: 0xFF0055, transparent: true, opacity: .5 })); h.position.z = .1; g.add(h);
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
      const colors = [0xFF0055, 0x00E5FF, 0x00FF80, 0xFACC15, 0x7000FF, 0xFF5900, 0x00E5FF, 0xFF0055];
      [.35, .6, .48, .82, .6, .78, .95, .68].forEach((h, i) => {
        const mat = new THREE.MeshBasicMaterial({ color: colors[i] });
        const b = new THREE.Mesh(new THREE.BoxGeometry(.28, h * 2.8, .1), mat); b.position.set(-1.8 + i * .52, h * 1.4 - 1.4, 0); sc.add(b);
      });
      const baseline = new THREE.Mesh(new THREE.BoxGeometry(5, .02, .1), new THREE.MeshBasicMaterial({ color: 0x00E5FF })); baseline.position.set(0, -1.4, 0); sc.add(baseline);
      (function an() { requestAnimationFrame(an); rdr.render(sc, cam); })();
    })();

    /* ── THREE.JS CTA SPIRAL ── */
    (function () {
      const cv = document.getElementById('cta-canvas');
      if(!cv) return;
      const rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(70, cv.clientWidth / cv.clientHeight, .1, 1000);
      cam.position.z = 22;
      function rsz() { rdr.setSize(cv.clientWidth, cv.clientHeight); cam.aspect = cv.clientWidth / cv.clientHeight; cam.updateProjectionMatrix(); }
      rsz(); window.addEventListener('resize', rsz);
      const N = 600, p = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 22, r = (i / N) * 16; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = Math.sin(a) * r; p[i * 3 + 2] = (Math.random() - .5) * 3; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const sp = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x00E5FF, size: .14, transparent: true, opacity: .7 })); sc.add(sp);
      const N2 = 200, p2 = new Float32Array(N2 * 3);
      for (let i = 0; i < N2; i++) { const a = (i / N2) * Math.PI * 8, r = 5 + (i / N2) * 4; p2[i * 3] = Math.cos(a) * r; p2[i * 3 + 1] = Math.sin(a) * r; p2[i * 3 + 2] = (Math.random() - .5) * 1.5; }
      const sg2 = new THREE.BufferGeometry(); sg2.setAttribute('position', new THREE.BufferAttribute(p2, 3));
      sc.add(new THREE.Points(sg2, new THREE.PointsMaterial({ color: 0xFF0055, size: .12, transparent: true, opacity: .5 })));
      let t = 0; (function an() { requestAnimationFrame(an); t += .003; sp.rotation.z += .004; sp.rotation.x = Math.sin(t) * .15; rdr.render(sc, cam); })();
    })();

    /* ── THREE.JS ENERGY BACKGROUND ── */
    (function () {
      const cv = document.getElementById('energy-canvas');
      if (!cv) return;
      
      // Wait for GLTFLoader to be defined globally
      if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
          let tries = 0;
          const waitInit = setInterval(() => {
              if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
                  clearInterval(waitInit);
                  initEnergyModel();
              }
              if (tries++ > 50) clearInterval(waitInit);
          }, 100);
          return;
      } else {
          initEnergyModel();
      }

      function initEnergyModel() {
          const rdr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
          const sc = new THREE.Scene();
          
          const am = new THREE.AmbientLight(0xffffff, 1.2);
          sc.add(am);
          const dl = new THREE.DirectionalLight(0x00E5FF, 3);
          dl.position.set(5, 5, 5);
          sc.add(dl);
          const pl = new THREE.PointLight(0xFF0055, 4);
          pl.position.set(-5, -5, 2);
          sc.add(pl);

          const cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
          cam.position.set(0, 0, 10);

          function rsz() { rdr.setSize(window.innerWidth, window.innerHeight); cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); }
          rsz(); window.addEventListener('resize', rsz);

          const energyGroup = new THREE.Group();
          sc.add(energyGroup);

          let energyModel;
          const loader = new THREE.GLTFLoader();
          loader.load('/energy.glb', function (gltf) {
            energyModel = gltf.scene;

            energyModel.traverse((child) => {
              if (child.isMesh) {
                 if (child.material) {
                     child.material.emissiveIntensity = 0.5;
                     child.material.transparent = true;
                     child.material.opacity = 0.8;
                 }
              }
            });

            energyGroup.add(energyModel);
            
            // Base positioning
            energyGroup.position.set(1.5, 0, 0);
            energyGroup.rotation.set(0.1, -0.2, 0);
            energyGroup.scale.set(0.8, 0.8, 0.8);

            const wrapper = document.getElementById('energy-wrapper');
            if(wrapper) {
                gsap.to(energyGroup.position, {
                  y: -2,
                  x: -1.5,
                  z: 1,
                  ease: "none",
                  scrollTrigger: {
                    trigger: wrapper,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1
                  }
                });
                gsap.to(energyGroup.rotation, {
                  x: Math.PI * 0.1,
                  y: "+=" + (Math.PI * 8), // Multiple visible spins across the page
                  z: 0,
                  ease: "none",
                  scrollTrigger: {
                     trigger: wrapper,
                     start: "top bottom",
                     end: "bottom top",
                     scrub: 1
                  }
                });
            }
          });

          let t = 0;
          (function an() { 
              requestAnimationFrame(an); 
              t += 0.02;
              if(energyModel) {
                 // Idle floating without jitter
                 energyModel.position.y = Math.sin(t) * 0.15;
                 // Add continuous spin to model
                 energyModel.rotation.y += 0.005;
              }
              rdr.render(sc, cam); 
          })();
      }
    })();
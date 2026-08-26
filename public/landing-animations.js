(() => {
// --- SMOOTH SCROLL INIT ---
        const lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        })

        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }
        requestAnimationFrame(raf)

        gsap.registerPlugin(ScrollTrigger);
        lenis.on('scroll', ScrollTrigger.update);

        // --- CUSTOM 3D MODEL CONFIG ---
        const GLB_MODEL_URL = '/stylized_planet.glb'; 

        // --- THEME STATE ---
        let currentTheme = 'dark';

        // --- THREE.JS SETUP ---
        const container = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const isMobile = window.innerWidth < 768;
        const renderer = new THREE.WebGLRenderer({ 
            antialias: !isMobile, 
            alpha: true, 
            preserveDrawingBuffer: false 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0); 
        container.appendChild(renderer.domElement);

        // --- ENHANCED LIGHTING FOR GLASSMORPHISM VISIBILITY ---
        const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambLight);
        
        // Specular Point Light (Creates bright glints on the frosted surface)
        const pointLight = new THREE.PointLight(0x3b82f6, 4, 100);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);
        
        // Rim Light (Positioned behind to catch edges and silhouettes)
        const rimLight = new THREE.PointLight(0xffffff, 6, 50);
        rimLight.position.set(-10, -5, -15);
        scene.add(rimLight);

        // Directional Highlight (Adds a white sharp highlight on top)
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(0, 10, 5);
        scene.add(dirLight);

        // --- REFINED FROSTED GLASS MATERIAL (GLASSMORPHISM STYLE) ---
        const glassMat = new THREE.MeshPhysicalMaterial({
            thickness: 8.0,          // Depth of the glass effect
            roughness: 0.25,         // The "Frosted" texture blur
            transmission: 1.0,       // Full glass logic
            ior: 1.55,               // High index of refraction for distortion
            color: 0xffffff,
            attenuationColor: 0x3b82f6, // Deep blue tinted edges
            attenuationDistance: 0.8,   // Density of the blue tint
            transparent: true,
            opacity: 1,
            envMapIntensity: 5,      // Reflection strength
            reflectivity: 1,
            clearcoat: 1.0,          // Shiny outer coating
            clearcoatRoughness: 0.1,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.08
        });

        // Subtle Silhouette Wireframe (Ensures visibility)
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            wireframe: true,
            transparent: true,
            opacity: 0.05
        });

        const scrollGroup = new THREE.Group();
        const floatGroup = new THREE.Group();
        const meshGroup = new THREE.Group(); 
        
        scene.add(scrollGroup);
        scrollGroup.add(floatGroup);
        floatGroup.add(meshGroup);

        // Core Assembly (Larger Scale)
        const sphereGeo = new THREE.IcosahedronGeometry(3.5, 64);
        const dayMesh = new THREE.Mesh(sphereGeo, glassMat);
        const dayWire = new THREE.Mesh(sphereGeo, wireMat); // Reinforce silhouette
        dayMesh.visible = false;
        dayWire.visible = false;
        meshGroup.add(dayMesh);
        meshGroup.add(dayWire);

        // Orbiting Glass Rings
        const ringGeo1 = new THREE.TorusGeometry(5.8, 0.05, 16, 100);
        const ringGeo2 = new THREE.TorusGeometry(6.8, 0.03, 16, 100);
        const ring1 = new THREE.Mesh(ringGeo1, glassMat);
        const ring2 = new THREE.Mesh(ringGeo2, glassMat);
        ring1.rotation.x = Math.PI / 2;
        ring2.rotation.y = Math.PI / 4;
        ring1.visible = false;
        ring2.visible = false;
        meshGroup.add(ring1);
        meshGroup.add(ring2);

        // --- ORBITING STAR PARTICLES ---
        // Custom 4-point star shape
        function createStarShape(outerRadius, innerRadius) {
            const shape = new THREE.Shape();
            const points = 4;
            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
                if (i === 0) {
                    shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                } else {
                    shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                }
            }
            shape.closePath();
            return shape;
        }

        // Star materials — warm glowing colors
        const starColors = [0xffffff, 0xfff4cc, 0xcce5ff, 0xffe0b2, 0xd4e0ff];
        const starMaterials = starColors.map(color => new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        }));

        const orbitStarCount = isMobile ? 20 : 60;
        const orbitStarGroup = new THREE.Group();
        orbitStarGroup.visible = true;
        meshGroup.add(orbitStarGroup);

        for (let i = 0; i < orbitStarCount; i++) {
            const starSize = Math.random() * 0.15 + 0.05;
            const starShape = createStarShape(starSize, starSize * 0.35);
            const starGeo = new THREE.ShapeGeometry(starShape);
            const mat = starMaterials[Math.floor(Math.random() * starMaterials.length)];
            const star = new THREE.Mesh(starGeo, mat.clone());

            const r = Math.random() * 5 + 5.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            star.position.set(
                r * Math.sin(theta) * Math.cos(phi),
                r * Math.sin(theta) * Math.sin(phi),
                r * Math.cos(theta)
            );

            // Always face camera
            star.userData.speed = Math.random() * 0.006 + 0.002;
            star.userData.axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
            star.userData.twinkleOffset = Math.random() * Math.PI * 2;
            star.userData.twinkleSpeed = Math.random() * 2 + 1;
            star.userData.baseScale = 0.7 + Math.random() * 0.6;
            star.userData.baseOpacity = 0.5 + Math.random() * 0.5;

            orbitStarGroup.add(star);
        }

        // --- STAR CONSTELLATION RING (replaces asteroid ring) ---
        const constellationGroup = new THREE.Group();
        const constellationCount = isMobile ? 50 : 150;

        for (let i = 0; i < constellationCount; i++) {
            const size = Math.random() * 0.08 + 0.02;
            const starShape = createStarShape(size, size * 0.3);
            const starGeo = new THREE.ShapeGeometry(starShape);
            const colorIdx = Math.floor(Math.random() * starColors.length);
            const mat = new THREE.MeshBasicMaterial({
                color: starColors[colorIdx],
                transparent: true,
                opacity: Math.random() * 0.6 + 0.3,
                side: THREE.DoubleSide
            });
            const star = new THREE.Mesh(starGeo, mat);

            // Ring formation with some spread
            const radius = Math.random() * 2.5 + 6.5;
            const angle = Math.random() * Math.PI * 2;
            star.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 2.0,
                Math.sin(angle) * radius
            );

            star.userData.rotSpeed = (Math.random() - 0.5) * 0.03;
            star.userData.orbitSpeed = (Math.random() * 0.001) + 0.0005;
            star.userData.twinkleOffset = Math.random() * Math.PI * 2;
            star.userData.twinkleSpeed = Math.random() * 3 + 1;
            star.userData.baseOpacity = mat.opacity;
            constellationGroup.add(star);
        }
        constellationGroup.rotation.x = 0.5;
        constellationGroup.visible = true;
        meshGroup.add(constellationGroup);

        let nightModel = null;
        const loader = new THREE.GLTFLoader();
        loader.load(GLB_MODEL_URL, (gltf) => {
            nightModel = gltf.scene;
            nightModel.scale.set(3.8, 3.8, 3.8); 
            const box = new THREE.Box3().setFromObject(nightModel);
            const center = box.getCenter(new THREE.Vector3());
            nightModel.position.sub(center);
            nightModel.visible = currentTheme === 'dark'; 
            meshGroup.add(nightModel);
            ScrollTrigger.refresh();
        });

        camera.position.z = 14; 

        // Background Stars (larger, brighter, varied sizes)
        const bgStarCount = isMobile ? 300 : 1000;
        const bgPosArray = new Float32Array(bgStarCount * 3);
        const bgSizeArray = new Float32Array(bgStarCount);
        for (let i = 0; i < bgStarCount; i++) {
            bgPosArray[i * 3] = (Math.random() - 0.5) * 80;
            bgPosArray[i * 3 + 1] = (Math.random() - 0.5) * 80;
            bgPosArray[i * 3 + 2] = (Math.random() - 0.5) * 80;
            bgSizeArray[i] = Math.random() * 0.06 + 0.01;
        }
        const particlesGeo = new THREE.BufferGeometry();
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(bgPosArray, 3));
        particlesGeo.setAttribute('size', new THREE.BufferAttribute(bgSizeArray, 1));
        const particlesMat = new THREE.PointsMaterial({
            size: 0.04,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        const particleMesh = new THREE.Points(particlesGeo, particlesMat);
        scene.add(particleMesh);

        // --- MASTER TIMELINE ---
        const masterTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 2.5,
                invalidateOnRefresh: true
            }
        });

        masterTimeline
            .to(scrollGroup.rotation, { y: Math.PI * 8, ease: "none", duration: 1 }, 0)
            .to(scrollGroup.position, { x: 8, z: -6, ease: "sine.inOut", duration: 0.2 }, 0.05)
            .to(scrollGroup.position, { x: -8, z: -7, ease: "sine.inOut", duration: 0.25 }, 0.25)
            .to(scrollGroup.position, { x: 0, z: -10, y: 2.5, ease: "sine.inOut", duration: 0.25 }, 0.5)
            .to(scrollGroup.position, { x: 7, z: -6, y: -2.5, ease: "sine.inOut", duration: 0.2 }, 0.75)
            .to(scrollGroup.position, { x: 0, z: -4, y: 0, ease: "sine.inOut", duration: 0.05 }, 0.95);



        gsap.to(".stagger-in", { opacity: 1, y: 0, duration: 1.2, ease: "power4.out", delay: 0.4 });
        gsap.to(".action-card", { 
            opacity: 1, x: 0, duration: 1.5, stagger: 0.2, ease: "power3.out",
            scrollTrigger: { trigger: ".right-actions", start: "top 80%" } 
        });

        gsap.utils.toArray('.reveal').forEach(elem => {
            gsap.from(elem, {
                y: 50, opacity: 0, duration: 1.2, ease: "power2.out",
                scrollTrigger: { trigger: elem, start: "top 90%", toggleActions: "play none none none" }
            });
        });

        gsap.ticker.add((time, deltaTime, frame) => {
            dayMesh.rotation.y += 0.005;
            ring1.rotation.y += 0.008;
            ring1.rotation.z += 0.003;
            ring2.rotation.x += 0.01;
            
            // Animate orbiting stars — orbit + twinkle + face camera
            orbitStarGroup.children.forEach((star) => {
                // Orbit around the planet
                star.position.applyAxisAngle(star.userData.axis, star.userData.speed);

                // Face the camera (billboard)
                star.lookAt(camera.position);

                // Twinkle: pulsate scale and opacity
                const twinkle = Math.sin(time * star.userData.twinkleSpeed + star.userData.twinkleOffset);
                const scaleFactor = star.userData.baseScale * (0.6 + 0.4 * (twinkle * 0.5 + 0.5));
                star.scale.setScalar(scaleFactor);
                star.material.opacity = star.userData.baseOpacity * (0.5 + 0.5 * (twinkle * 0.5 + 0.5));
            });

            // Animate constellation ring — orbit + twinkle
            constellationGroup.children.forEach((star, i) => {
                // Slow orbit
                const t = Date.now() * star.userData.orbitSpeed;
                const r = star.position.length();
                const y = star.position.y; // preserve vertical position
                star.position.x = Math.cos(t + i) * r;
                star.position.z = Math.sin(t + i) * r;

                // Face camera
                star.lookAt(camera.position);

                // Twinkle
                const twinkle = Math.sin(time * star.userData.twinkleSpeed + star.userData.twinkleOffset);
                star.material.opacity = star.userData.baseOpacity * (0.3 + 0.7 * (twinkle * 0.5 + 0.5));
            });
            constellationGroup.rotation.y += 0.0008;

            floatGroup.rotation.x += 0.002;
            floatGroup.rotation.z += 0.001;
            
            if(currentTheme === 'dark') {
                particleMesh.rotation.y += 0.0003;
            } else {
                floatGroup.position.y = Math.sin(time * 0.5) * 0.35;
            }
            renderer.render(scene, camera);
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
})();
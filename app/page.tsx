"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import './landing.css';

export default function Page() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Initial user check
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleWinScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleWinScroll);
    return () => {
      window.removeEventListener('scroll', handleWinScroll);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('radix-theme');
    if (saved === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('radix-theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('radix-theme', 'light');
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Derive school portal URL from user's email if they are a school admin
  const getSchoolPortalUrl = () => {
    if (!user) return '/login';
    const email = user.email || '';
    if (email === 'princedas000555@gmail.com') {
      return '/super-admin';
    }
    if (email.endsWith('@radix.school')) {
      const schoolId = email.replace('@radix.school', '').toUpperCase();
      return `/curriculum/${schoolId}`;
    }
    return '/login';
  };

  // Load animation scripts safely after mounting
  useEffect(() => {
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });
    };

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
    ]).then(() => {
      return loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js");
    }).then(() => {
      return loadScript("/landing-animations.js");
    }).catch(err => console.error("Script load error", err));
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : '';
  };

  return (
    <div className="landing-page">
      {/* CURSOR */}
      <div className="cursor" id="cursor"></div>
      <div className="cursor-ring" id="cr"></div>

      {/* NAV */}
      <nav id="nav" className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="landing-logo">
          <img src="logo.jpeg" alt="RADIX Robotics Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
        </a>
        <ul className="nav-links-list">
          <li><a href="#programs">Programs</a></li>
          <li><a href="#how">Labs</a></li>
          <li><a href="#features">Impact</a></li>
          <li>
            <Link href={getSchoolPortalUrl()}>School Portal</Link>
          </li>
          {!user ? (
            <li><a href="/login" className="nav-cta-btn">Log In</a></li>
          ) : (
            <>
              <li><button onClick={handleLogout} className="nav-cta-btn" style={{ background: '#dc2626', cursor: 'pointer' }}>Log Out</button></li>
              {user?.email === 'princedas000555@gmail.com' && (
                <li><Link href="/super-admin" className="nav-cta-btn">Admin</Link></li>
              )}
            </>
          )}
          <li>
            <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="nav-cta-btn">Partner With Us</a>
          </li>
          <li>
            <button onClick={toggleTheme} aria-label="Toggle Theme" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', display: 'flex', alignItems: 'center' }}>
              {isDarkMode ? '🌞' : '🌙'}
            </button>
          </li>
        </ul>
        <button className="mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* MOBILE OVERLAY */}
      <div className={`nav-mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <button className="mobile-close-btn" onClick={toggleMobileMenu}>&times;</button>
        <ul className="nav-mobile-links">
          <li><a href="#programs" onClick={toggleMobileMenu}>Programs</a></li>
          <li><a href="#how" onClick={toggleMobileMenu}>Labs</a></li>
          <li><a href="#features" onClick={toggleMobileMenu}>Impact</a></li>
          <li><Link href={getSchoolPortalUrl()} onClick={toggleMobileMenu}>School Portal</Link></li>
          {!user ? (
            <li><a href="/login" onClick={toggleMobileMenu}>Log In</a></li>
          ) : (
            <>
              <li><a href="#" onClick={() => { toggleMobileMenu(); handleLogout(); }} style={{ color: '#f87171' }}>Log Out</a></li>
              {user?.email === 'princedas000555@gmail.com' && (
                <li><Link href="/super-admin" onClick={toggleMobileMenu} style={{ color: 'var(--blue-l)' }}>Admin Panel</Link></li>
              )}
            </>
          )}
          <li><a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" style={{ color: 'var(--blue-l)' }}>Partner With Us</a></li>
          <li>
            <button onClick={toggleTheme} aria-label="Toggle Theme" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', marginTop: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem auto 0 auto' }}>
              {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
            </button>
          </li>
        </ul>
      </div>

      {/* PAGE WRAPPER */}
      <div className="page-wrapper">

        {/* ============================== HERO ============================== */}
        <section id="hero" className="landing-hero">
          <canvas id="hero-canvas" className="hero-canvas-bg"></canvas>
          <div className="hero-arc arc-1"></div>
          <div className="hero-arc arc-2"></div>
          <div className="hero-arc arc-3"></div>
          <div className="hero-dots"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Composite Skill Labs for Schools Across India</span>
            </div>
            <h1 className="hero-title">
              <span className="line">Building</span>
              <span className="line g">Tomorrow&apos;s</span>
              <span className="line sk">Innovators</span>
            </h1>
            <p className="hero-sub">RADIX Robotics installs world-class composite skill laboratories inside schools — empowering students with robotics, AI, and advanced tech education from day one.</p>
            <div className="hero-actions">
              <a href="#programs" className="btn-primary">Explore Programs</a>
              <a href="#how" className="btn-ghost">▶ See Our Labs</a>
            </div>
          </div>
          <div className="hero-canvas-wrap">
            <canvas id="hero-3d-element" className="hero-3d-canvas"></canvas>
          </div>
        </section>

        {/* ============================== MARQUEE ============================== */}
        <div className="mq-section">
          <div className="mq-track">
            {['Arduino & Raspberry Pi', 'AI & Machine Learning', 'Drone Technology', '3D Printing & CAD', 'IoT Systems', 'Python & C++ Programming', 'Sensor Integration', 'Autonomous Vehicles', 'Circuit Design', 'Competitive Robotics',
              'Arduino & Raspberry Pi', 'AI & Machine Learning', 'Drone Technology', '3D Printing & CAD', 'IoT Systems', 'Python & C++ Programming', 'Sensor Integration', 'Autonomous Vehicles', 'Circuit Design', 'Competitive Robotics'
            ].map((t, i) => (
              <div key={i} className="mq-item">
                <span className="mq-dot"></span>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ============================== PROGRAMS ============================== */}
        <section id="programs" className="programs-section">
          <div className="container">
            <div className="programs-header">
              <div>
                <div className="section-tag reveal">What We Offer</div>
                <h2 className="section-title reveal">Curriculum Built<br/>for the Future</h2>
              </div>
              <p className="section-desc reveal">Multi-tiered programs scale from elementary exploration to advanced engineering pipelines — structured around real-world industry standards.</p>
            </div>
            <div className="bento-programs">
              <div className="prog-card p1 reveal">
                <span className="card-num">01 / FOUNDATION</span>
                <span className="card-icon">🤖</span>
                <div className="card-title">Intro to Robotics & Coding</div>
                <div className="card-desc">Block-based and Python programming with hands-on robot assembly. Perfect entry point for grades 4–7.</div>
                <div className="prog-tags"><span className="prog-tag">Scratch</span><span className="prog-tag">Python</span><span className="prog-tag">Lego NXT</span></div>
              </div>
              <div className="prog-card p2 reveal">
                <span className="card-num">02 / INTERMEDIATE</span>
                <span className="card-icon">⚙️</span>
                <div className="card-title">Advanced Mechatronics</div>
                <div className="card-desc">Servo systems, sensor integration, and autonomous navigation. Deep-dive for grades 8–10.</div>
                <div className="prog-tags"><span className="prog-tag">Arduino</span><span className="prog-tag">C++</span><span className="prog-tag">Sensors</span></div>
              </div>
              <div className="prog-card p3 reveal">
                <span className="card-num">03 / ELITE</span>
                <span className="card-icon">🧠</span>
                <div className="card-title">AI & Machine Learning</div>
                <div className="card-desc">Computer vision, neural networks, and TensorFlow Lite on embedded systems for grades 10–12.</div>
                <div className="prog-tags"><span className="prog-tag">TensorFlow</span><span className="prog-tag">OpenCV</span><span className="prog-tag">RPi</span></div>
              </div>
              <div className="prog-card p4 reveal">
                <span className="card-num">04 / FABRICATION</span>
                <span className="card-icon">🖨️</span>
                <div className="card-title">3D Design & Prototyping</div>
                <div className="card-desc">CAD modeling with Fusion 360 and FDM printing to bring robot chassis concepts to life.</div>
                <div className="prog-tags"><span className="prog-tag">Fusion 360</span><span className="prog-tag">FDM</span><span className="prog-tag">CAD</span></div>
              </div>
              <div className="prog-card p5 reveal">
                <span className="card-num">05 / CONNECTED</span>
                <span className="card-icon">📡</span>
                <div className="card-title">IoT & Smart Systems</div>
                <div className="card-desc">Build networked sensor arrays and real-time monitoring dashboards using MQTT and cloud APIs.</div>
                <div className="prog-tags"><span className="prog-tag">ESP32</span><span className="prog-tag">MQTT</span><span className="prog-tag">Cloud</span></div>
              </div>
              <div className="prog-card p6 reveal">
                <span className="card-num">06 / COMPETITIVE</span>
                <span className="card-icon">🏆</span>
                <div className="card-title">Robotics Olympiad Prep</div>
                <div className="card-desc">Structured training for WRO, FRC, and national robotics competitions with mentored sprints.</div>
                <div className="prog-tags"><span className="prog-tag">WRO</span><span className="prog-tag">FRC</span><span className="prog-tag">Strategy</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== HOW IT WORKS ============================== */}
        <section id="how" className="how-section">
          <div className="container">
            <div className="how-inner">
              <div className="canvas-wrapper reveal">
                <img className="lab-image" src="robotics_lab.png" alt="Composite Robotics Lab" />
                <div className="canvas-badge">
                  <div className="canvas-badge-title">Lab Uptime</div>
                  <div className="canvas-badge-val">99.7%</div>
                </div>
              </div>
              <div>
                <div className="section-tag reveal">How It Works</div>
                <h2 className="section-title reveal">From Empty Room<br/>to Composite Skill Lab</h2>
                <p className="section-desc reveal">We handle everything. RADIX assesses, designs, installs, and trains — turning any unused classroom into a world-class robotics facility.</p>
                <div className="steps">
                  <div className="step reveal">
                    <div className="step-num">01</div>
                    <div>
                      <div className="step-title">Site Assessment & Design</div>
                      <div className="step-desc">Our engineers survey available space and design a custom lab layout optimized for learning flow and safety compliance.</div>
                    </div>
                  </div>
                  <div className="step reveal">
                    <div className="step-num">02</div>
                    <div>
                      <div className="step-title">Equipment Installation</div>
                      <div className="step-desc">We supply and install all hardware — workstations, robotics kits, 3D printers, soldering stations, and network infrastructure.</div>
                    </div>
                  </div>
                  <div className="step reveal">
                    <div className="step-num">03</div>
                    <div>
                      <div className="step-title">Teacher Certification</div>
                      <div className="step-desc">School staff undergo a 40-hour RADIX certification program covering curriculum delivery and lab management protocols.</div>
                    </div>
                  </div>
                  <div className="step reveal">
                    <div className="step-num">04</div>
                    <div>
                      <div className="step-title">Live Program Delivery</div>
                      <div className="step-desc">Ongoing weekly sessions with RADIX-certified educators, supplemented by our digital learning platform and progress tracking.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== IMPACT BENTO ============================== */}
        <section id="features" className="features-section">
          <div className="container">
            <div className="features-header">
              <div className="section-tag reveal">Why RADIX</div>
              <h2 className="section-title reveal">Measurable Impact<br/>at Every Level</h2>
              <p className="section-desc reveal">Data-driven, mentorship-heavy, and built to produce engineers — not just students who&apos;ve seen a robot.</p>
            </div>
            <div className="bento-impact">
              <div className="bi-cell bi-c1 reveal">
                <canvas id="mini-canvas" className="abs-canvas"></canvas>
                <div className="cell-content" style={{ marginTop: 'auto', position: 'absolute', bottom: '2.5rem', left: '2.5rem', right: '2.5rem' }}>
                  <div className="bento-num">340%</div>
                  <div className="bento-title">Increase in STEM Enrollment</div>
                  <div className="bento-desc">Schools with RADIX labs see a dramatic rise in students choosing STEM paths within 2 years.</div>
                </div>
              </div>
              <div className="bi-cell bi-c2 reveal">
                <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🛡️</div>
                <div className="bento-title">Safety-First Lab Design</div>
                <div className="bento-desc">Every lab meets OSHA and IS standards with built-in emergency stops and grounded workstations.</div>
              </div>
              <div className="bi-cell bi-c3 reveal">
                <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>📊</div>
                <div className="bento-title">Real-Time Analytics</div>
                <div className="bento-desc">Track every student&apos;s progress through our cloud dashboard with skill maps and milestones.</div>
              </div>
              <div className="bi-cell bi-c4 reveal">
                <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🎓</div>
                <div className="bento-title">Certified Curriculum</div>
                <div className="bento-desc">Aligned with NEP 2020 and internationally benchmarked STEM education frameworks.</div>
              </div>
              <div className="bi-cell bi-c5 reveal">
                <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🔄</div>
                <div className="bento-title">Annual Hardware Refresh</div>
                <div className="bento-desc">Equipment upgrades included in every partnership — always cutting-edge, always current.</div>
              </div>
              <div className="bi-cell bi-c6 reveal">
                <div style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>🌐</div>
                <div className="bento-title">National Robotics Network</div>
                <div className="bento-desc">RADIX schools form an interconnected network — sharing discoveries, competing in inter-school challenges, and collaborating on projects that span cities.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== CTA — DARK ============================== */}
        <section id="cta" className="cta-section-dark">
          <canvas id="cta-canvas" className="cta-canvas-bg"></canvas>
          <div className="container cta-content">
            <div className="cta-eyebrow reveal">● Applications Open — 2026 Cohort</div>
            <h2 className="cta-title reveal">Let&apos;s Build the<br/><span>Lab of Tomorrow</span></h2>
            <p className="cta-desc reveal">Join 120+ schools across India that have already partnered with RADIX Robotics. Next cohort spots are filling fast.</p>
          </div>
        </section>

        {/* ============================== PLAYFUL MARQUEE ============================== */}
        <div className="marquee-wrap">
          <div className="marquee">
            <div className="mq-track">
              {['Tinkering', 'Creativity', 'Problem Solving', 'Coding', 'Innovation', 'Tinkering', 'Creativity', 'Problem Solving', 'Coding', 'Innovation'].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ============================== ULTIMATE PLAYGROUND ============================== */}
        <section id="labs" className="labs-section">
          <div className="section-header reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 4vw, 3.4rem)', fontWeight: 800, color: 'var(--ink)', marginBottom: '1rem' }}>The Ultimate Playground</h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>We turn boring classrooms into vibrant composite labs equipped with the best tools for young inventors.</p>
          </div>

          <div className="labs-wrapper reveal">
            <div className="labs-content">
              <div className="labs-step">
                <div className="labs-step-num sn-1">1</div>
                <div>
                  <h3>Design & Setup</h3>
                  <p>We craft a bright, safe, and collaborative space and pack it with awesome hardware and 3D printers.</p>
                </div>
              </div>
              <div className="labs-step">
                <div className="labs-step-num sn-2">2</div>
                <div>
                  <h3>Empower Teachers</h3>
                  <p>Our fun, hands-on bootcamps turn your teachers into confident tech-wizards ready to guide the kids.</p>
                </div>
              </div>
              <div className="labs-step">
                <div className="labs-step-num sn-3">3</div>
                <div>
                  <h3>Continuous Fun</h3>
                  <p>With ongoing mentorship and fresh equipment every year, the excitement never stops!</p>
                </div>
              </div>
            </div>
            <div className="labs-canvas-wrap">
              <img src="Firefly.png" alt="RADIX Ultimate Playground" />
            </div>
          </div>
        </section>

        {/* ============================== PURPLE CTA ============================== */}
        <section className="cta-purple reveal">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="cta-inner">
            <h2>Ready to ignite their Imagination?</h2>
            <p>Join the coolest network of 120+ schools making learning an absolute blast. Let&apos;s set up a RADIX lab at your campus!</p>
            <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="cta-btn">Apply for Lab</a>
          </div>
        </section>

        {/* ============================== FOOTER ============================== */}
        <footer className="landing-footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <a href="#" className="landing-logo" style={{ marginBottom: '1.5rem' }}>
                  RADIX
                </a>
                <p className="f-desc">Making robotics and coding the most fun part of the school day.</p>
              </div>
              <div>
                <h4 className="f-title">Quick Links</h4>
                <ul className="f-links">
                  <li><a href="#how">Our Awesome Labs</a></li>
                  <li><Link href={getSchoolPortalUrl()}>The Curriculum</Link></li>
                  <li><a href="#how">Teacher Training</a></li>
                </ul>
              </div>
              <div>
                <h4 className="f-title">Say Hello!</h4>
                <ul className="f-links">
                  <li><a href="/about">About RADIX</a></li>
                  <li><a href="/contact">Join the Team</a></li>
                  <li><a href="https://wa.me/916001979712" target="_blank" rel="noreferrer">Contact Us</a></li>
                </ul>
              </div>
            </div>
            <div className="f-bottom">
              <p>RADIX Robotics Pvt. Ltd. © 2026</p>
              <p>Built with ❤️ for Future Innovators</p>
            </div>
          </div>
        </footer>

      </div>{/* end .page-wrapper */}
    </div>
  );
}

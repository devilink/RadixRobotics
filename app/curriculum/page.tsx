
"use client";
import { useEffect } from 'react';
import Script from 'next/script';


export default function Page() {
  
  useEffect(() => {
    // Add any necessary client side initializations here
  }, []);

  return (
    <>
      
      
      

<div className="curriculum-page">
<div className="ambient-bg">
  <div className="orb"></div>
  <div className="orb"></div>
  <div className="orb"></div>
</div>
<div className="grid-overlay"></div>

<nav className="navbar">
  <div className="navbar-inner">
    <a href="index.html" className="navbar-brand">
      <img src="logo1.jpeg" alt="Radix Logo" />
      <span>Curriculum</span>
    </a>
  </div>
</nav>

<div className="main-container">
  
  <section className="hero">
    <div className="hero-badge">
      <span className="dot"></span>
      NEP 2020 Aligned Curriculum
    </div>
    <h1>
      <span className="text-white">Delhi Public School, Khanapara</span><br />
      <span className="gradient-text">Composite Skill Lab</span>
    </h1>
    <p className="subtitle">
      A comprehensive K-10 learning path with <strong>250 hands-on sessions</strong> — from basic machines to competition-ready autonomous robots and AI systems.
    </p>
  </section>

  
  <div className="stats-bar">
    <div className="stat-chip">
      <span className="value">250</span>
      <span className="label">Total Sessions</span>
    </div>
    <div className="stat-chip">
      <span className="value">10</span>
      <span className="label">Classes</span>
    </div>
    <div className="stat-chip">
      <span className="value">150</span>
      <span className="label">Primary (1–5)</span>
    </div>
    <div className="stat-chip">
      <span className="value">100</span>
      <span className="label">Secondary (6–10)</span>
    </div>
  </div>

  
  <div className="filters" id="filters">
    <span className="pill active" data-f="all">All Classes</span>
    <span className="pill" data-f="p">Class 1–5 · Primary</span>
    <span className="pill" data-f="i">Class 6–9 · Intermediate</span>
    <span className="pill" data-f="a">Class 10 · Advanced</span>
  </div>

  
  <div className="search-wrap">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
    </svg>
    <input type="text" className="search-input" id="searchInput" placeholder="Search topics... e.g. 'sensor', 'Arduino', 'AI'" />
    <div className="search-count" id="searchCount"></div>
  </div>

  
  <div id="content"></div>

  
  <footer className="footer">
    <p>Built with ❤️ for <span className="footer-brand">Robotics Education</span></p>
  </footer>
</div>


<button className="scroll-top" id="scrollTop" title="Scroll to top">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
  </svg>
</button>
</div>

    </>
  );
}

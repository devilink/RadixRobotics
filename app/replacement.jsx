  {/* PROGRAMS */}
  <section id="programs" className="relative py-32 px-6 lg:px-16 overflow-hidden">
    {/* Ambient Background Auras */}
    <div className="absolute top-0 -left-[10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
    <div className="absolute bottom-[-10%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
    
    <div className="relative z-10 max-w-7xl mx-auto">
      <div className="mb-24 text-center md:text-left reveal">
        <h2 className="text-5xl md:text-7xl tracking-tighter font-extrabold text-white mb-6">
          Curriculum Built<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">for the Future</span>
        </h2>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed mx-auto md:mx-0">
          Multi-tiered programs scale from elementary exploration to advanced engineering pipelines — structured around real-world industry standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
        {[
          { num: '01', title: 'Intro to Robotics & Coding', label: 'FOUNDATION', desc: 'Block-based and Python programming with hands-on robot assembly. Perfect entry point for grades 4–7.', tags: ['Scratch', 'Python', 'Lego NXT'], color: 'from-emerald-400 to-emerald-600', hue: 'emerald' },
          { num: '02', title: 'Advanced Mechatronics', label: 'INTERMEDIATE', desc: 'Servo systems, sensor integration, and autonomous navigation. Deep-dive for grades 8–10.', tags: ['Arduino', 'C++', 'Sensors'], color: 'from-blue-400 to-blue-600', hue: 'blue' },
          { num: '03', title: 'AI & Machine Learning', label: 'ELITE', desc: 'Computer vision, neural networks, and TensorFlow Lite on embedded systems for grades 10–12.', tags: ['TensorFlow', 'OpenCV', 'RPi'], color: 'from-purple-400 to-purple-600', hue: 'purple' },
          { num: '04', title: '3D Design & Prototyping', label: 'FABRICATION', desc: 'CAD modeling with Fusion 360 and FDM printing to bring robot chassis concepts to life.', tags: ['Fusion 360', 'FDM', 'CAD'], color: 'from-orange-400 to-orange-600', hue: 'orange' },
          { num: '05', title: 'IoT & Smart Systems', label: 'CONNECTED', desc: 'Build networked sensor arrays and real-time monitoring dashboards using MQTT and cloud APIs.', tags: ['ESP32', 'MQTT', 'Cloud'], color: 'from-pink-400 to-pink-600', hue: 'pink' },
          { num: '06', title: 'Robotics Olympiad Prep', label: 'COMPETITIVE', desc: 'Structured training for WRO, FRC, and national robotics competitions with mentored sprints.', tags: ['WRO', 'FRC', 'Strategy'], color: 'from-yellow-400 to-yellow-600', hue: 'yellow' }
        ].map((prog, idx) => (
          <div key={idx} className="group relative bg-[#111113]/60 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 hover:bg-[#1A1A1E]/80 transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className={`absolute -top-16 -right-16 w-32 h-32 bg-${prog.hue}-500/20 blur-[50px] rounded-full group-hover:bg-${prog.hue}-500/40 transition-all duration-500`} />
            <span className="absolute top-4 right-6 text-[5rem] font-black tracking-tighter text-white/[0.02] group-hover:text-white/[0.05] transition-colors">{prog.num}</span>
            
            <div className="relative z-10 flex flex-col h-full">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${prog.color} text-sm font-black tracking-widest mb-6 block`}>{prog.label}</span>
              <h3 className="text-2xl font-bold tracking-tight text-slate-100 mb-4">{prog.title}</h3>
              <p className="text-slate-400/90 mb-8 flex-grow leading-relaxed">{prog.desc}</p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {prog.tags.map(t => (
                  <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-300">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* MEASURABLE IMPACT */}
  <section id="features" className="relative py-32 px-6 lg:px-16 overflow-hidden bg-black/40 border-y border-white/5">
    <div className="absolute top-1/2 left-1/2 -transform-x-1/2 -transform-y-1/2 w-full h-full max-w-4xl bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none" />
    
    <div className="relative z-10 max-w-7xl mx-auto">
      <div className="mb-24 text-center reveal">
        <h2 className="text-5xl md:text-7xl tracking-tighter font-extrabold text-white mb-6">
          Measurable Impact<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">at Every Level</span>
        </h2>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Data-driven, mentorship-heavy, and built to produce engineers — not just students who&apos;ve seen a robot.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 reveal">
        {[
          { val: '340%', label: 'Increase in STEM Enrollment', g: 'from-emerald-400 to-cyan-400' },
          { val: '🛡️', label: 'Safety-First Lab Design', g: 'from-orange-400 to-amber-300' },
          { val: '📊', label: 'Real-Time Analytics', g: 'from-blue-400 to-indigo-400' },
          { val: '🎓', label: 'Certified Curriculum', g: 'from-purple-400 to-pink-400' },
          { val: '🔄', label: 'Annual Hardware Refresh', g: 'from-rose-400 to-red-400' },
          { val: '🌐', label: 'National Robotics Network', g: 'from-cyan-400 to-blue-500' },
        ].map((m, i) => (
          <div key={i} className="group flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm hover:bg-white/[0.04] transition-all hover:-translate-y-1">
            <span className={`text-6xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r ${m.g} drop-shadow-lg`}>
              {m.val}
            </span>
            <span className="text-slate-300 font-medium text-lg leading-tight">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* LABS */}
  <section id="labs" className="relative py-32 px-6 lg:px-16">
    <div className="relative z-10 max-w-7xl mx-auto">
      <div className="mb-24 text-center md:text-left reveal">
        <h2 className="text-5xl md:text-7xl tracking-tighter font-extrabold text-white mb-6">
          From Empty Room<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300">to Composite Skill Lab</span>
        </h2>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          We handle everything. RADIX assesses, designs, installs, and trains — turning any unused classroom into a world-class robotics facility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center reveal">
        <div className="flex flex-col gap-8">
          {[
            { n: '01', t: 'Site Assessment & Design', d: 'Our engineers survey available space and design a custom lab layout optimized for learning flow and safety compliance.' },
            { n: '02', t: 'Equipment Installation', d: 'We supply and install all hardware — workstations, robotics kits, 3D printers, soldering stations, and network infrastructure.' },
            { n: '03', t: 'Teacher Certification', d: 'School staff undergo a 40-hour certification program covering curriculum delivery and lab management.' },
            { n: '04', t: 'Live Program Delivery', d: 'Weekly sessions with certified educators, supplemented by our digital platform and progress tracking.' }
          ].map((s, i) => (
            <div key={i} className="flex gap-6 group">
              <span className="text-4xl md:text-5xl font-black text-white/10 group-hover:text-emerald-400 transition-colors duration-300">{s.n}</span>
              <div>
                <h3 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-white transition-colors">{s.t}</h3>
                <p className="text-slate-400 leading-relaxed">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative h-full min-h-[500px] rounded-[3rem] overflow-hidden p-2 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <img src="robotics_lab.png" alt="Composite Robotics Lab" className="relative z-10 w-full h-full object-cover rounded-[2.5rem] shadow-2xl transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>
    </div>
  </section>

  {/* MARQUEE */}
  <div className="py-12 border-y border-white/5 bg-black/60 overflow-hidden">
    <div className="marquee">
      <div className="mq-track flex gap-12 whitespace-nowrap">
        {['Tinkering', 'Creativity', 'Problem Solving', 'Coding', 'Innovation', 'Tinkering', 'Creativity', 'Problem Solving', 'Coding', 'Innovation'].map((t, i) => (
          <span key={i} className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white/20 to-white/40">{t}</span>
        ))}
      </div>
    </div>
  </div>

  {/* CTA */}
  <section id="cta" className="relative py-48 px-6 lg:px-16 overflow-hidden text-center flex flex-col items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/20 pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/20 blur-[150px] rounded-full pointer-events-none" />
    
    <div className="relative z-10 reveal">
      <h2 className="text-6xl md:text-8xl tracking-tighter font-extrabold mb-8 text-white">
        Let&apos;s Build the<br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Lab of Tomorrow</span>
      </h2>
      <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12 flex flex-col items-center gap-2">
        <span>Join 120+ schools across India that have already partnered with RADIX Robotics.</span>
        <span className="text-emerald-400">Next cohort spots are filling fast.</span>
      </p>
      <a href="https://wa.me/916001979712" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-10 py-5 rounded-full bg-emerald-400 text-black font-bold text-xl tracking-wide hover:scale-105 hover:bg-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.4)] transition-all duration-300">
        Apply for Lab
      </a>
    </div>
  </section>

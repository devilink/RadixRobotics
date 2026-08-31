"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface ReadinessMetric {
  target: number;
  suffix: string;
  label: string;
  sublabel: string;
}

const readinessMetrics: ReadinessMetric[] = [
  { target: 10, suffix: " Schools", label: "Founding Partner Cohort", sublabel: "Accepting Applications for 2025–26" },
  { target: 300, suffix: "+", label: "NEP Mapped Lesson Plans", sublabel: "Structured for Grades 3 to 12" },
  { target: 100, suffix: "+", label: "Hardware & Sensor Kits", sublabel: "Modular Prototyping Inventory" },
  { target: 100, suffix: "%", label: "NITI Aayog Compliant", sublabel: "Turnkey Packages 1, 2, 3 & 4" },
  { target: 14, suffix: " Days", label: "Rapid Lab Commissioning", sublabel: "From Blueprint to Live Teaching" },
  { target: 1, suffix: ":1", label: "Resident Engineer Support", sublabel: "Dedicated Mentor On Campus" },
];

export default function TrustMetricsBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState<number[]>(readinessMetrics.map(() => 0));

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    let ctx = gsap.context(() => {
      if (pinRef.current) {
        ScrollTrigger.create({
          trigger: containerRef.current, // trigger off the container
          pin: pinRef.current, // but pin the inner element to avoid React DOM crashes
          start: "bottom bottom",
          pinSpacing: false, // Ensures next section smoothly stacks over this
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            readinessMetrics.forEach((metric, index) => {
              const obj = { val: 0 };
              gsap.to(obj, {
                val: metric.target,
                duration: 2.5,
                ease: "power3.out",
                delay: index * 0.15,
                onUpdate: () => {
                  setCounts((prev) => {
                    const updated = [...prev];
                    updated[index] = Math.round(obj.val);
                    return updated;
                  });
                },
              });
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={containerRef} className="relative z-0">
      <div ref={pinRef} className="w-full py-12 lg:py-20 bg-[#f8f7ef] text-[#1c1820] overflow-hidden min-h-screen flex flex-col justify-center">
        <div className="w-full 2xl:px-24 mx-auto px-6 lg:px-12">
        
        <div className="text-center mb-10 lg:mb-16">
           <h2 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight">Readiness at a Glance</h2>
           <p className="text-[#555] font-sans mt-3 text-sm lg:text-base">What we bring to the table.</p>
        </div>

        {/* Bento Grid Container */}
        <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.25fr_1.3fr_0.95fr] gap-5 lg:gap-6 lg:grid-rows-[250px_270px_250px] auto-rows-[300px] font-serif">
          
          {/* Card 1: Customization -> Founding Partner */}
          <div className="relative overflow-hidden rounded-[32px] p-0 lg:p-0 bg-black lg:col-[1] lg:row-[1_/_span_2] isolate hover:-translate-y-2 transition-transform duration-500 shadow-md">
            <video 
              src="/robo.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          </div>

          {/* Card 2: Scheduling -> NEP Mapped */}
          <div className="relative overflow-hidden rounded-[32px] p-8 lg:p-10 bg-[#e85b8b] lg:col-[2_/_span_2] lg:row-[1] isolate hover:-translate-y-2 transition-transform duration-500 shadow-md text-black">
            <h2 className="relative z-20 m-0 mb-3 text-2xl lg:text-3xl font-bold tracking-tight leading-[1.05] max-w-[65%]">{counts[1]}{readinessMetrics[1].suffix} {readinessMetrics[1].label}</h2>
            <p className="relative z-20 m-0 text-sm lg:text-[15px] font-sans leading-relaxed tracking-tight max-w-[60%]">{readinessMetrics[1].sublabel}</p>
            
            <div className="absolute right-[20%] top-[10%] lg:top-[20%] scale-[1.3] lg:scale-[1.6] xl:scale-[1.8] origin-top-right pointer-events-none">
              <div className="absolute right-[40px] -top-[10px] w-[105px] h-[110px] bg-[#78cbb4] border-[7px] border-white -rotate-[21deg] shadow-[0_7px_16px_rgba(70,35,50,0.12)]">
                 <div className="absolute left-[8px] right-[8px] top-[9px] h-[70px] rounded-[8px]" style={{ background: 'repeating-linear-gradient(90deg,#f28e51 0 10px,#f7d66b 10px 20px)' }}></div>
              </div>
              <div className="absolute right-[-20px] top-[20px] w-[116px] h-[91px] bg-white rounded-[7px] p-[12px_10px] rotate-[8deg] shadow-[0_9px_18px_rgba(40,25,40,0.16)] font-sans text-[#4a4750]">
                 <div className="text-[6px] font-bold mb-[10px] leading-tight">AI Curriculum Ready</div>
                 <div className="text-[7px] flex justify-between my-[3px]"><span>Grade 6</span><span>Module A</span></div>
                 <div className="text-[7px] flex justify-between my-[3px]"><span>Grade 8</span><span>Module B</span></div>
                 <div className="text-[7px] flex justify-between my-[3px]"><span>Grade 10</span><span>Module C</span></div>
                 <div className="absolute bottom-[8px] left-[10px] right-[10px] rounded-[12px] bg-[#111] text-white text-center p-[5px] text-[6px]">View Syllabus</div>
              </div>
            </div>
          </div>

          {/* Card 3: Wallet -> Hardware & Sensors */}
          <div className="relative overflow-hidden rounded-[32px] p-8 lg:p-10 bg-[#a9d965] lg:col-[2] lg:row-[2] isolate hover:-translate-y-2 transition-transform duration-500 shadow-md">
            <h2 className="relative z-20 m-0 mb-3 text-2xl lg:text-3xl font-bold tracking-tight leading-[1.05]">{counts[2]}{readinessMetrics[2].suffix}<br/>{readinessMetrics[2].label}</h2>
            <p className="relative z-20 m-0 text-sm lg:text-[15px] font-sans leading-relaxed tracking-tight max-w-[80%]">{readinessMetrics[2].sublabel}</p>
            
            <div className="absolute right-[10%] lg:right-[5%] bottom-[15%] scale-[1.3] lg:scale-[1.6] xl:scale-[1.8] origin-bottom-right pointer-events-none">
              <div className="relative w-[115px] h-[63px] rounded-[13px] bg-gradient-to-br from-[#2d382c] to-[#111] shadow-[0_8px_14px_rgba(35,50,25,0.2)] text-white p-[12px_12px] font-sans">
                <div className="text-[6px] opacity-80">Inventory Status</div>
                <div className="text-[15px] mt-[8px] font-bold">{counts[2]} Kits</div>
                <div className="absolute right-[10px] bottom-[8px] tracking-[2px] text-[10px]">•••</div>
              </div>
            </div>
          </div>

          {/* Card 4: Inbox -> NITI Aayog Compliant */}
          <div className="relative overflow-hidden rounded-[32px] p-8 lg:p-10 bg-[#f4df66] lg:col-[3] lg:row-[2] isolate hover:-translate-y-2 transition-transform duration-500 shadow-md">
            <h2 className="relative z-20 m-0 mb-3 text-2xl lg:text-3xl font-bold tracking-tight leading-[1.05]">{counts[3]}{readinessMetrics[3].suffix}<br/>{readinessMetrics[3].label}</h2>
            <p className="relative z-20 m-0 text-sm lg:text-[15px] font-sans leading-relaxed tracking-tight max-w-[80%]">{readinessMetrics[3].sublabel}</p>
            
            <div className="absolute right-[10%] lg:right-[15%] bottom-[10%] lg:bottom-[15%] scale-[1.3] lg:scale-[1.6] xl:scale-[1.8] origin-bottom-right pointer-events-none">
              <div className="relative w-[112px] h-[104px] bg-white rounded-[12px] p-[10px] font-sans shadow-[0_7px_15px_rgba(60,55,20,0.12)]">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-[22px] flex items-center gap-[5px] border-b border-[#eee]">
                    <span className="w-[13px] h-[13px] rounded-full bg-[#d2c27b]"></span>
                    <div className="flex-1">
                      <div className="h-[4px] w-[42px] bg-[#333] rounded-[2px]"></div>
                      <div className="h-[3px] w-[28px] bg-[#ddd] rounded-[2px] mt-[3px]"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Send Gifts -> Rapid Lab Commissioning */}
          <div className="relative overflow-hidden rounded-[32px] p-8 lg:p-10 bg-[#f6a066] lg:col-[1_/_span_2] lg:row-[3] isolate hover:-translate-y-2 transition-transform duration-500 shadow-md">
            <h2 className="relative z-20 m-0 mb-3 text-2xl lg:text-3xl font-bold tracking-tight leading-[1.05] max-w-[65%]">{counts[4]}{readinessMetrics[4].suffix} {readinessMetrics[4].label}</h2>
            <p className="relative z-20 m-0 text-sm lg:text-[15px] font-sans leading-relaxed tracking-tight max-w-[60%]">{readinessMetrics[4].sublabel}</p>
            
            <div className="absolute right-[15%] lg:right-[20%] xl:right-[25%] top-[25%] scale-[1.1] lg:scale-[1.4] xl:scale-[1.6] origin-top-right pointer-events-none">
              <div className="relative w-[250px] h-[120px]">
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-[#151515] text-white" style={{left: '5px', top: '38px', transform: 'rotate(-12deg)'}}>IoT</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-white text-[#222]" style={{left: '65px', top: '18px', transform: 'rotate(6deg)'}}>Drones</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-[#e7a4d0] text-[#111]" style={{left: '117px', top: '2px', transform: 'rotate(-8deg)'}}>AI</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-[#111] text-white" style={{left: '151px', top: '45px', transform: 'rotate(13deg)'}}>3D Printing</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-[#1b65a9] text-white leading-tight text-center" style={{left: '52px', top: '70px', transform: 'rotate(4deg)'}}>Sensors</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-[#e8d34d] text-[#111]" style={{left: '135px', top: '72px', transform: 'rotate(-3deg)'}}>Robotics</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-[#f15c57] text-white" style={{left: '194px', top: '20px', transform: 'rotate(8deg)'}}>Turnkey</div>
                <div className="absolute w-[88px] h-[46px] rounded-[5px] shadow-[0_6px_12px_rgba(80,45,30,0.16)] flex items-center justify-center font-sans font-[800] text-[12px] bg-white text-[#222]" style={{left: '195px', top: '75px', transform: 'rotate(-10deg)'}}>Kits</div>
              </div>
            </div>
          </div>

          {/* Card 6: Reminders -> Resident Engineer */}
          <div className="relative overflow-hidden rounded-[32px] p-8 lg:p-10 bg-[#9bc8d3] lg:col-[3] lg:row-[3] isolate hover:-translate-y-2 transition-transform duration-500 shadow-md">
            <h2 className="relative z-20 m-0 mb-3 text-2xl lg:text-3xl font-bold tracking-tight leading-[1.05] max-w-[90%]">{counts[5]}{readinessMetrics[5].suffix}<br/>{readinessMetrics[5].label}</h2>
            <p className="relative z-20 m-0 text-sm lg:text-[15px] font-sans leading-relaxed tracking-tight max-w-[85%]">{readinessMetrics[5].sublabel}</p>
            
            <div className="absolute right-[-10%] lg:right-[-5%] bottom-0 scale-[1.3] lg:scale-[1.6] xl:scale-[1.8] origin-bottom-right pointer-events-none">
              <div className="relative w-[132px] h-[112px] bg-[#101010] rounded-[20px_20px_0_0] p-[12px_8px] shadow-[0_7px_16px_rgba(20,35,40,0.2)]">
                <div className="absolute top-[5px] left-[47px] w-[37px] h-[7px] rounded-[8px] bg-[#111]"></div>
                <div className="h-full bg-[#f3f3f3] rounded-[13px_13px_0_0] p-[12px_8px] font-sans">
                  <div className="mt-[12px] bg-white rounded-[8px] p-[8px] text-[6px] shadow-[0_2px_7px_#ddd]">
                    <b className="text-[7px]">Engineer Dispatch</b><br/>
                    Mentor arriving on campus today for weekly class!
                  </div>
                </div>
              </div>
            </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}

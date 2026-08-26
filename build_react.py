import re

with open('scratch_body.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace class= with className=
jsx = html.replace('class=', 'className=')
jsx = jsx.replace('class=\"', 'className=\"')

# Replace unclosed tags
jsx = re.sub(r'(<img[^>]*?)(?<!/)>', r'\1 />', jsx)
jsx = re.sub(r'(<br[^>]*?)(?<!/)>', r'\1 />', jsx)
jsx = re.sub(r'(<hr[^>]*?)(?<!/)>', r'\1 />', jsx)
jsx = re.sub(r'(<input[^>]*?)(?<!/)>', r'\1 />', jsx)

# Fix problematic SVGs and style attributes
jsx = jsx.replace('style=\"background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 24px 24px;\"', 'style={{ backgroundImage: \'radial-gradient(circle at 1px 1px, white 1px, transparent 0)\', backgroundSize: \'24px 24px\' }}')
jsx = jsx.replace('fill-rule=', 'fillRule=').replace('clip-rule=', 'clipRule=').replace('stop-color=', 'stopColor=').replace('stop-opacity=', 'stopOpacity=')

# Replace the nav bar
old_nav = '''<nav className=\"fixed top-8 left-1/2 -translate-x-1/2 z-[90] w-fit px-8 py-4 glass-card flex gap-10 items-center\">
        <a href=\"#\" className=\"nav-link font-bold text-sm uppercase tracking-tighter\">Radix</a>
        <a href=\"#about\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">About</a>
        <a href=\"#programs\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">Programs</a>
        <a href=\"#gallery\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">Gallery</a>
        <a href=\"#impact\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">Impact</a>
    </nav>'''

new_nav = '''<nav className=\"fixed top-8 left-1/2 -translate-x-1/2 z-[90] w-max px-8 py-4 glass-card flex gap-6 items-center\">
        <Link href=\"#\" className=\"nav-link font-bold text-sm uppercase tracking-tighter mr-4\">Radix</Link>
        <Link href=\"#about\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">About</Link>
        <Link href=\"#programs\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">Programs</Link>
        <Link href=\"#gallery\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">Gallery</Link>
        <Link href=\"#how\" className=\"nav-link text-[10px] uppercase tracking-widest opacity-70\">Lifecycle</Link>
        
        <div className=\"w-px h-6 bg-white/20 mx-2\"></div>

        {!user ? (
            <Link href=\"/login\" className=\"nav-link text-[10px] uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all\">Log In</Link>
        ) : (
            <div className=\"flex items-center gap-4\">
                <Link href={getSchoolPortalUrl()} className=\"nav-link text-[10px] uppercase tracking-widest bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full hover:bg-blue-600/40 transition-all\">School Portal</Link>
                {user?.email === 'princedas000555@gmail.com' && (
                    <Link href=\"/super-admin\" className=\"nav-link text-[10px] uppercase tracking-widest bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full hover:bg-purple-600/40 transition-all\">Admin</Link>
                )}
                <button onClick={handleLogout} className=\"nav-link text-[10px] uppercase tracking-widest bg-red-500/20 text-red-500 px-4 py-2 rounded-full hover:bg-red-500/40 transition-all\" style={{ cursor: 'pointer' }}>Log Out</button>
            </div>
        )}
    </nav>'''

jsx = jsx.replace(old_nav, new_nav)

# Fix any stray class instances inside strings, but mostly it's html.
# Nextjs template:
page_tsx = f'''\"use client\";
import {{ useEffect, useState }} from 'react';
import Link from 'next/link';
import {{ createClient }} from '@/utils/supabase/client';
import './radix-landing.css';

export default function Page() {{
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {{
    // Initial user check
    supabase.auth.getUser().then(({{ data }}) => {{
      setUser(data.user);
    }});

    // Listen for auth changes
    const {{ data: {{ subscription }} }} = supabase.auth.onAuthStateChange((_event, session) => {{
      setUser(session?.user ?? null);
    }});

    return () => {{
      subscription.unsubscribe();
    }};
  }}, []);

  const handleLogout = async () => {{
    await supabase.auth.signOut();
    window.location.reload();
  }};

  // Derive school portal URL from user's email if they are a school admin
  const getSchoolPortalUrl = () => {{
    if (!user) return '/login';
    const email = user.email || '';
    if (email === 'princedas000555@gmail.com') {{
      return '/super-admin';
    }}
    if (email.endsWith('@radix.school')) {{
      const schoolId = email.replace('@radix.school', '').toUpperCase();
      return `/curriculum/${{schoolId}}`;
    }}
    return '/login';
  }};

  // Load animation scripts safely after mounting
  useEffect(() => {{
    // Force set data-theme on html so our CSS works immediately
    document.documentElement.setAttribute('data-theme', 'dark');

    const loadScript = (src: string) => {{
      return new Promise((resolve, reject) => {{
        if (document.querySelector(`script[src="${{src}}"]`)) return resolve(true);
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      }});
    }};

    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js")
    ]).then(() => {{
      return loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js");
    }}).then(() => {{
      return loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js");
    }}).then(() => {{
      return loadScript("/landing-animations.js");
    }}).catch(err => console.error("Script load error", err));
  }}, []);

  return (
    <div className="radix-modern-landing">
{jsx}
    </div>
  );
}}
'''

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_tsx)

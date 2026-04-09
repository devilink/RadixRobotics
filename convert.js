const fs = require('fs');
const path = require('path');

function convertHtmlToJsx(htmlContent) {
    let bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let headMatch = htmlContent.match(/<head>([\s\S]*?)<\/head>/i);
    if (!bodyMatch) return { body: '', style: '', scripts: [] };
    
    let body = bodyMatch[1];
    let styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    let style = styleMatch ? styleMatch[1] : '';
    
    // Extract head scripts
    let scripts = [];
    if (headMatch) {
       let scriptRegex = /<script\s+src="([^"]+)"><\/script>/gi;
       let match;
       while ((match = scriptRegex.exec(headMatch[1])) !== null) {
           scripts.push(match[1]);
       }
    }

    // remove script tags from body
    body = body.replace(/<script[\s\S]*?<\/script>/gi, '');

    // Convert HTML to JSX
    body = body.replace(/class=/g, 'className=');
    body = body.replace(/for=/g, 'htmlFor=');
    body = body.replace(/<!--[\s\S]*?-->/g, ''); // remove comments
    
    // Self close tags
    ['img', 'br', 'hr', 'input', 'meta', 'link'].forEach(tag => {
        const regex = new RegExp(`<${tag}([^>]*?[^/])>`, 'gi');
        body = body.replace(regex, `<${tag}$1 />`);
    });

    // Fix inline styles - quick and dirty fix for numeric and standard styles
    body = body.replace(/style="([^"]*)"/g, (match, p1) => {
        let styles = p1.split(';').filter(s => s.trim() !== '');
        let obj = {};
        styles.forEach(s => {
            let [key, val] = s.split(':');
            if (key && val) {
                // to camelCase
                key = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                obj[key] = val.trim();
            }
        });
        return `style={${JSON.stringify(obj)}}`;
    });

    body = body.replace(/<a([^>]+)href="([^"]+)"/g, (match, p1, p2) => {
       if (p2.startsWith('#') || p2.startsWith('http')) return match; 
       return `<a${p1}href="${p2}"`;
    });

    const camelCasedAttributes = ['viewBox', 'fillRule', 'clipRule', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin'];
    camelCasedAttributes.forEach(attr => {
        const lowerAttr = attr.toLowerCase();
        const regex = new RegExp(`(\\s)${lowerAttr}=`, 'gi');
        body = body.replace(regex, `$1${attr}=`);
    });
    
    body = body.replace(/stroke-width/g, 'strokeWidth');
    body = body.replace(/stroke-linecap/g, 'strokeLinecap');
    body = body.replace(/stroke-linejoin/g, 'strokeLinejoin');

    return { body, style, scripts };
}

function processFile(inputFile, outputFile, isPage = true) {
    if (!fs.existsSync(inputFile)) return;
    const html = fs.readFileSync(inputFile, 'utf-8');
    const { body, style, scripts } = convertHtmlToJsx(html);
    
    if (isPage && style) {
        fs.appendFileSync('app/globals.css', '\n' + style);
    }

    let pBody = body;
    // Replace login-modal with LoginModal Component in page.tsx
    if (!isPage) {
        // Remove the login-modal HTML block completely for root page
        pBody = pBody.replace(/<div id="login-modal"[\s\S]*?<\/div>\s*<\/div>/, '');
        pBody = pBody.replace(/onclick="closeCurriculumLogin\(\)"/g, '');
        pBody = pBody.replace(/onclick="verifyCurriculumLogin\(\)"/g, '');
        pBody = pBody.replace(/onclick="toggleMobileMenu\(\); openCurriculumLogin\(event\)"/g, 'onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}');
        pBody = pBody.replace(/onclick="toggleMobileMenu\(\)"/g, 'onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); }}');
        pBody = pBody.replace(/id="curriculum-link"/g, 'onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}');

        pBody = pBody.replace(/<button className="mobile-toggle" [^>]*>/, '<button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">');
        pBody = pBody.replace(/className="nav-mobile-overlay"/, 'className={`nav-mobile-overlay ${isMobileMenuOpen ? "active" : ""}`}');
        pBody = pBody.replace(/<button className="mobile-close"[^>]*>&times;<\/button>/, '<button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>&times;</button>');
    }

    let scriptImports = scripts.map(src => `<Script src="${src}" strategy="beforeInteractive" />`).join('\n      ');

    const imports = !isPage ? `import { useState } from 'react';\nimport LoginModal from './components/LoginModal';\n` : '';
    const states = !isPage ? `const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n` : '';
    const modalTag = !isPage ? `<LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />` : '';

    const componentContent = `
"use client";
import { useEffect } from 'react';
import Script from 'next/script';
${imports}

export default function Page() {
  ${states}
  useEffect(() => {
    // Add any necessary client side initializations here
  }, []);

  return (
    <>
      ${scriptImports}
      ${modalTag}
      ${pBody}
    </>
  );
}
`;
    const dirname = path.dirname(outputFile);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(outputFile, componentContent);
}

// Reset global css
fs.writeFileSync('app/globals.css', `
@tailwind base;
@tailwind components;
@tailwind utilities;
`);

// The boolean is flipped because isPage for the curriculum means true (no modal) and root means false
processFile('legacy_html/index.html', 'app/page.tsx', false);
processFile('legacy_html/main.html', 'app/curriculum/page.tsx', true);

// Fix typos
function fixFile(file) {
  if(!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/<br>/g, '<br />');
  c = c.replace(/<hr>/g, '<hr />');
  c = c.replace(/ Tomorrow's /g, ' Tomorrow&apos;s ');
  c = c.replace(/>Tomorrow's</g, '>Tomorrow&apos;s<');
  c = c.replace(/ who've /g, ' who&apos;ve ');
  c = c.replace(/ Let's /g, ' Let&apos;s ');
  c = c.replace(/ student's /g, ' student&apos;s ');
  c = c.replace(/ students' /g, ' students&apos; ');
  fs.writeFileSync(file, c);
}
fixFile('app/page.tsx');
fixFile('app/curriculum/page.tsx');

console.log('Conversion completed.');

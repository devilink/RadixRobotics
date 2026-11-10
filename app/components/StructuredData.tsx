

export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'RADIX Robotics',
    image: 'https://www.radixrobotics.in/og-image.png',
    '@id': 'https://www.radixrobotics.in',
    url: 'https://www.radixrobotics.in',
    telephone: '+91-6001979712', // From the WhatsApp link
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Headquarters',
      addressLocality: 'India',
      addressRegion: 'IN',
      addressCountry: 'IN',
    },
    description: 'Turnkey robotics, AI, and drone labs for Indian schools. NEP 2020 compliant composite skill labs.',
    sameAs: [
      'https://www.radixrobotics.in'
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}



export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'RADIX Robotics',
    image: 'https://radixrobotics.com/og-image.png',
    '@id': 'https://radixrobotics.com',
    url: 'https://radixrobotics.com',
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
      'https://radixrobotics.com'
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

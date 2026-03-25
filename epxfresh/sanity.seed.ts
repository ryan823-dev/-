/**
 * Seed script to populate Sanity CMS with initial data
 * Run with: npx sanity dataset import sanity.seed.tar.gz production
 * 
 * This script creates sample data for EPXFresh website
 */

const seedData = {
  categories: [
    {
      _id: 'cat-household',
      _type: 'category',
      name: 'Household Series',
      slug: { current: 'household' },
      description: 'Fresh-keeping bags for everyday home use',
    },
    {
      _id: 'cat-professional',
      _type: 'category',
      name: 'Professional Series',
      slug: { current: 'professional' },
      description: 'Heavy-duty bags for commercial and industrial use',
    },
    {
      _id: 'cat-film',
      _type: 'category',
      name: 'Fresh-keeping Film',
      slug: { current: 'film' },
      description: 'Stretch film and wrapping solutions',
    },
  ],

  products: [
    {
      _id: 'household-fresh-keeping-bags',
      _type: 'product',
      name: 'Household Fresh-Keeping Bags',
      slug: { current: 'household-fresh-keeping-bags' },
      description: 'Perfect for everyday storage of fruits, vegetables, and leftovers',
      longDescription: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'Our Household Fresh-Keeping Bags are designed for daily use, featuring advanced moisture control technology that extends the freshness of your produce by up to 200%. Made from FDA-certified materials, these bags are safe for direct food contact.',
            },
          ],
        },
      ],
      price: 12.99,
      category: { _type: 'reference', _ref: 'cat-household' },
      features: [
        'Advanced moisture control',
        'Reusable and washable',
        'Transparent design for easy identification',
        'Available in multiple sizes',
        'BPA-free and food-safe',
      ],
      specifications: [
        { label: 'Material', value: 'Food-grade PE' },
        { label: 'Size Options', value: 'S, M, L, XL' },
        { label: 'Package Quantity', value: '50 bags' },
        { label: 'Certification', value: 'FDA 21 CFR, EU 10/2011' },
      ],
      rating: 4.8,
      reviewCount: 127,
      badge: 'Best Seller',
      featured: true,
      inStock: true,
    },
    {
      _id: 'multi-size-pack',
      _type: 'product',
      name: 'Multi-Size Pack (Value Bundle)',
      slug: { current: 'multi-size-pack' },
      description: 'Complete set with 4 different sizes for all your storage needs',
      longDescription: [
        {
          _type: 'block',
          style: 'normal',
          children: [
            {
              _type: 'span',
              marks: [],
              text: 'Our Value Bundle includes 4 different bag sizes to handle all your fresh-keeping needs. From small berries to large lettuce heads, you\'ll have the perfect size for every produce item. Save 20% compared to buying individually.',
            },
          ],
        },
      ],
      price: 39.99,
      category: { _type: 'reference', _ref: 'cat-household' },
      features: [
        '4 sizes included (S, M, L, XL)',
        '20% savings vs individual purchase',
        'Color-coded by size',
        'Storage organizer included',
        'Recipe guide booklet',
      ],
      specifications: [
        { label: 'Small (10 bags)', value: '6" x 8"' },
        { label: 'Medium (10 bags)', value: '8" x 10"' },
        { label: 'Large (8 bags)', value: '10" x 12"' },
        { label: 'XL (5 bags)', value: '12" x 15"' },
      ],
      rating: 4.9,
      reviewCount: 89,
      badge: 'Eco Choice',
      featured: true,
      inStock: true,
    },
  ],

  faqs: [
    {
      _id: 'faq-001',
      _type: 'faq',
      question: 'How do fresh-keeping bags work?',
      answer: 'Our bags use advanced moisture regulation technology. They absorb excess moisture while maintaining optimal humidity levels, preventing both dehydration and rot. This extends freshness by 50-200% compared to regular storage.',
      category: 'Product Usage',
    },
    {
      _id: 'faq-002',
      _type: 'faq',
      question: 'Are the bags reusable?',
      answer: 'Yes! Simply wash with mild soap and water, air dry, and reuse. With proper care, each bag can be used 50+ times. Avoid hot water (>60°C) and harsh detergents.',
      category: 'Product Usage',
    },
    {
      _id: 'faq-003',
      _type: 'faq',
      question: 'What is the minimum order quantity for wholesale?',
      answer: 'Our standard MOQ is 500 units for most products. For custom packaging solutions or private label orders, MOQ starts at 1,000 units. We also offer sample packs for evaluation before bulk orders.',
      category: 'Wholesale',
    },
    {
      _id: 'faq-004',
      _type: 'faq',
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to 50+ countries worldwide. Standard shipping takes 15-25 days to major ports. We offer FOB, CIF, and DDP shipping terms. Express air freight available in 5-7 days for urgent orders.',
      category: 'Shipping',
    },
    {
      _id: 'faq-005',
      _type: 'faq',
      question: 'Are your products certified for food contact?',
      answer: 'All our products are FDA 21 CFR Part 177.1520 certified for food contact in the USA, and comply with EU Regulation 10/2011 for European markets. We also have CNAS testing reports for additional quality assurance.',
      category: 'Certifications',
    },
  ],

  testimonials: [
    {
      _id: 'testimonial-001',
      _type: 'testimonial',
      name: 'Sarah Chen',
      role: 'Organic Farm Owner',
      company: 'Green Valley Organics',
      content: 'Since switching to EPXFresh bags, our produce waste has decreased by 40%. Our customers love how much longer their vegetables stay fresh. These bags are a game-changer for our farm-to-table business.',
      rating: 5,
      location: 'California, USA',
    },
    {
      _id: 'testimonial-002',
      _type: 'testimonial',
      name: 'Michael Torres',
      role: 'Procurement Manager',
      company: 'FreshMart Supermarkets',
      content: 'We partnered with EPXFresh for our private-label fresh-keeping bag line. Their team provided excellent support throughout, from custom packaging design to logistics. Highly recommend for retail partnerships.',
      rating: 5,
      location: 'Texas, USA',
    },
    {
      _id: 'testimonial-003',
      _type: 'testimonial',
      name: 'Emma Liu',
      role: 'Home Cook & Food Blogger',
      company: null,
      content: 'As someone who meal preps every week, these bags have transformed my kitchen routine. I can prep vegetables on Sunday and they\'re still crisp on Friday. The multi-size pack is perfect for different portions.',
      rating: 5,
      location: 'Toronto, Canada',
    },
  ],

  certifications: [
    {
      _id: 'cert-fda',
      _type: 'certification',
      name: 'FDA 21 CFR Part 177.1520',
      description: 'Certified for food contact with all types of produce',
      issuingOrganization: 'U.S. Food and Drug Administration',
      issueDate: '2023-01-15',
      expiryDate: '2028-01-15',
      certificateNumber: 'FDA-2023-EPX-001',
      document: null,
    },
    {
      _id: 'cert-eu',
      _type: 'certification',
      name: 'EU Regulation 10/2011',
      description: 'Compliant with European food contact material regulations',
      issuingOrganization: 'European Food Safety Authority',
      issueDate: '2023-03-20',
      expiryDate: '2028-03-20',
      certificateNumber: 'EU-2023-EPX-042',
      document: null,
    },
    {
      _id: 'cert-cnas',
      _type: 'certification',
      name: 'CNAS Quality Testing',
      description: 'Tested and certified by China National Accreditation Service',
      issuingOrganization: 'CNAS',
      issueDate: '2023-02-10',
      expiryDate: '2026-02-10',
      certificateNumber: 'CNAS-2023-EPX-089',
      document: null,
    },
  ],

  siteSettings: {
    _id: 'site-settings',
    _type: 'siteSettings',
    siteName: 'EPXFresh',
    siteDescription: 'FDA & EU certified fresh-keeping packaging solutions for businesses and homes worldwide.',
    contactEmail: 'info@epxfresh.com',
    contactPhone: '+1 (555) 123-4567',
    address: {
      street: '123 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/company/epxfresh',
      twitter: 'https://twitter.com/epxfresh',
      facebook: 'https://facebook.com/epxfresh',
      instagram: 'https://instagram.com/epxfresh',
    },
  },
}

export default seedData

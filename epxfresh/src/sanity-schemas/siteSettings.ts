// Site Settings Schema
export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'EPXFresh',
    },
    {
      name: 'siteDescription',
      title: 'Site Description',
      type: 'text',
      rows: 2,
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    },
    {
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
    },
    {
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'facebook', type: 'string', title: 'Facebook URL' },
        { name: 'instagram', type: 'string', title: 'Instagram URL' },
        { name: 'linkedin', type: 'string', title: 'LinkedIn URL' },
        { name: 'twitter', type: 'string', title: 'Twitter URL' },
      ],
    },
    {
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'headline', type: 'string', title: 'Headline' },
        { name: 'subheadline', type: 'text', title: 'Subheadline', rows: 2 },
      ],
    },
  ],
}

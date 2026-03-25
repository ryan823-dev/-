// Certification Schema
export default {
  name: 'certification',
  title: 'Certification',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Certification Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'standard',
      title: 'Standard/Regulation',
      type: 'string',
      description: 'e.g., 21 CFR Part 177.1520',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'reportId',
      title: 'Report ID',
      type: 'string',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Passed', value: 'Passed' },
          { title: 'Verified', value: 'Verified' },
          { title: 'Active', value: 'Active' },
        ],
      },
      initialValue: 'Passed',
    },
    {
      name: 'tests',
      title: 'Tests Performed',
      type: 'array',
      of: [{ type: 'string' }],
    },
    {
      name: 'document',
      title: 'Certificate Document',
      type: 'file',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    },
  ],
}

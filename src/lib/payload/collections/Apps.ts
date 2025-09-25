import { CollectionConfig } from 'payload/types';

export const Apps: CollectionConfig = {
  slug: 'apps',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'price', 'status', 'developer'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === 'developer' || user.role === 'admin';
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'developer') {
        return {
          developer: {
            equals: user.id,
          },
        };
      }
      return false;
    },
    delete: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'developer') {
        return {
          developer: {
            equals: user.id,
          },
        };
      }
      return false;
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'shortDescription',
      type: 'text',
      required: true,
      maxLength: 150,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in USD for lifetime access',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'screenshots',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      fields: [
        {
          name: 'screenshot',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'iOS',
          value: 'IOS',
        },
        {
          label: 'Android',
          value: 'ANDROID',
        },
        {
          label: 'Web',
          value: 'WEB',
        },
        {
          label: 'Mac',
          value: 'MAC',
        },
        {
          label: 'PC',
          value: 'PC',
        },
      ],
    },
    {
      name: 'developer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      filterOptions: {
        role: {
          equals: 'developer',
        },
      },
    },
    {
      name: 'developerName',
      type: 'text',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (data.developer) {
              const developer = await req.payload.findByID({
                collection: 'users',
                id: data.developer,
              });
              return developer.name;
            }
            return undefined;
          },
        ],
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 0,
      max: 5,
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Average rating from testers (0-5)',
      },
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'releaseDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
    },
    {
      name: 'purchaseCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};

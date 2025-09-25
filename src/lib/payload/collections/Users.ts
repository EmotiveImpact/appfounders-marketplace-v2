import { CollectionConfig } from 'payload/types';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'createdAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return {
        id: {
          equals: user?.id,
        },
      };
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin';
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'tester',
      options: [
        {
          label: 'Tester',
          value: 'tester',
        },
        {
          label: 'Developer',
          value: 'developer',
        },
        {
          label: 'Admin',
          value: 'admin',
        },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'bio',
      type: 'textarea',
      required: false,
    },
    {
      name: 'purchasedApps',
      type: 'relationship',
      relationTo: 'apps',
      hasMany: true,
      admin: {
        condition: (data) => data.role === 'tester',
      },
    },
    {
      name: 'developedApps',
      type: 'relationship',
      relationTo: 'apps',
      hasMany: true,
      admin: {
        condition: (data) => data.role === 'developer',
      },
    },
    {
      name: 'createdAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ operation, value }) => {
            if (operation === 'create') {
              return new Date();
            }
            return value;
          },
        ],
      },
    },
  ],
};

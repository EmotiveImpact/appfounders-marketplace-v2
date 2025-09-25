import { CollectionConfig } from 'payload/types';

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['app', 'tester', 'amount', 'status', 'purchaseDate'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (user.role === 'developer') {
        return {
          developer: {
            equals: user.id,
          },
        };
      }
      if (user.role === 'tester') {
        return {
          tester: {
            equals: user.id,
          },
        };
      }
      return false;
    },
    create: ({ req: { user } }) => {
      return !!user;
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === 'admin';
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === 'admin';
    },
  },
  fields: [
    {
      name: 'app',
      type: 'relationship',
      relationTo: 'apps',
      required: true,
    },
    {
      name: 'tester',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: {
        role: {
          equals: 'tester',
        },
      },
    },
    {
      name: 'developer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: {
        role: {
          equals: 'developer',
        },
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'platformFee',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: '20% of the purchase amount',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (data.amount) {
              return data.amount * 0.2;
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'developerPayout',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: '80% of the purchase amount',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (data.amount) {
              return data.amount * 0.8;
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'purchaseDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'completed',
      options: [
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
    },
    {
      name: 'transactionId',
      type: 'text',
      required: false,
      admin: {
        description: 'Payment processor transaction ID',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc.status === 'completed') {
          // Update app purchase count
          await req.payload.update({
            collection: 'apps',
            id: doc.app,
            data: {
              purchaseCount: {
                increment: 1,
              },
            },
          });

          // Add app to user's purchased apps
          await req.payload.update({
            collection: 'users',
            id: doc.tester,
            data: {
              purchasedApps: {
                append: doc.app,
              },
            },
          });
        }
      },
    ],
  },
};

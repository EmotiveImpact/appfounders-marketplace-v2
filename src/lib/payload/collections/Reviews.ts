import { CollectionConfig } from 'payload/types';

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['app', 'tester', 'rating', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === 'tester';
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (user.role === 'tester') {
        return {
          tester: {
            equals: user.id,
          },
        };
      }
      return false;
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      if (user.role === 'tester') {
        return {
          tester: {
            equals: user.id,
          },
        };
      }
      return false;
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
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'updatedAt',
      type: 'date',
      required: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          () => {
            return new Date();
          },
        ],
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' || operation === 'update') {
          // Calculate new average rating for the app
          const reviews = await req.payload.find({
            collection: 'reviews',
            where: {
              app: {
                equals: doc.app,
              },
            },
          });

          if (reviews.docs.length > 0) {
            const totalRating = reviews.docs.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.docs.length;

            // Update app with new average rating
            await req.payload.update({
              collection: 'apps',
              id: doc.app,
              data: {
                rating: parseFloat(averageRating.toFixed(1)),
              },
            });
          }
        }
      },
    ],
  },
};

import { CollectionConfig } from 'payload/types';

export const Bugs: CollectionConfig = {
  slug: 'bugs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'app', 'severity', 'status', 'reportedBy', 'createdAt'],
    group: 'Testing',
  },
  access: {
    read: ({ req: { user } }) => {
      // Admins can read all bugs
      if (user?.role === 'admin') return true;
      
      // Developers can read bugs for their apps
      if (user?.role === 'developer') {
        return {
          'app.developer': {
            equals: user.id,
          },
        };
      }
      
      // Testers can read bugs they reported
      if (user?.role === 'tester') {
        return {
          reportedBy: {
            equals: user.id,
          },
        };
      }
      
      return false;
    },
    create: ({ req: { user } }) => {
      // Only testers and admins can create bugs
      return user?.role === 'tester' || user?.role === 'admin';
    },
    update: ({ req: { user } }) => {
      // Admins can update all bugs
      if (user?.role === 'admin') return true;
      
      // Developers can update bugs for their apps (to change status)
      if (user?.role === 'developer') {
        return {
          'app.developer': {
            equals: user.id,
          },
        };
      }
      
      // Testers can update bugs they reported
      if (user?.role === 'tester') {
        return {
          reportedBy: {
            equals: user.id,
          },
        };
      }
      
      return false;
    },
    delete: ({ req: { user } }) => {
      // Only admins can delete bugs
      return user?.role === 'admin';
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Bug Title',
      admin: {
        description: 'A clear, concise title describing the bug',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Bug Description',
      admin: {
        description: 'Detailed description of the bug',
      },
    },
    {
      name: 'app',
      type: 'relationship',
      relationTo: 'apps',
      required: true,
      label: 'App',
      admin: {
        description: 'The app where the bug was found',
      },
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Critical',
          value: 'critical',
        },
        {
          label: 'High',
          value: 'high',
        },
        {
          label: 'Medium',
          value: 'medium',
        },
        {
          label: 'Low',
          value: 'low',
        },
      ],
      defaultValue: 'medium',
      label: 'Severity',
      admin: {
        description: 'How severe is this bug',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Open',
          value: 'open',
        },
        {
          label: 'In Progress',
          value: 'in-progress',
        },
        {
          label: 'Fixed',
          value: 'fixed',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
      ],
      defaultValue: 'open',
      label: 'Status',
      admin: {
        description: 'Current status of the bug',
      },
    },
    {
      name: 'stepsToReproduce',
      type: 'array',
      label: 'Steps to Reproduce',
      admin: {
        description: 'List the steps to reproduce this bug',
      },
      fields: [
        {
          name: 'step',
          type: 'text',
          required: true,
          label: 'Step',
        },
      ],
    },
    {
      name: 'expectedBehavior',
      type: 'textarea',
      label: 'Expected Behavior',
      admin: {
        description: 'What should happen when the steps are followed',
      },
    },
    {
      name: 'actualBehavior',
      type: 'textarea',
      label: 'Actual Behavior',
      admin: {
        description: 'What actually happens when the steps are followed',
      },
    },
    {
      name: 'environment',
      type: 'group',
      label: 'Environment',
      admin: {
        description: 'Details about the environment where the bug was found',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            {
              label: 'iOS',
              value: 'ios',
            },
            {
              label: 'Android',
              value: 'android',
            },
            {
              label: 'Web',
              value: 'web',
            },
            {
              label: 'Mac',
              value: 'mac',
            },
            {
              label: 'PC',
              value: 'pc',
            },
          ],
          label: 'Platform',
        },
        {
          name: 'version',
          type: 'text',
          label: 'App Version',
        },
        {
          name: 'deviceModel',
          type: 'text',
          label: 'Device Model',
        },
        {
          name: 'osVersion',
          type: 'text',
          label: 'OS Version',
        },
        {
          name: 'browser',
          type: 'text',
          label: 'Browser (if applicable)',
        },
      ],
    },
    {
      name: 'attachments',
      type: 'array',
      label: 'Attachments',
      admin: {
        description: 'Screenshots, videos, or other files related to the bug',
      },
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'File',
        },
        {
          name: 'description',
          type: 'text',
          label: 'Description',
        },
      ],
    },
    {
      name: 'reportedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Reported By',
      admin: {
        description: 'The tester who reported this bug',
      },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      label: 'Assigned To',
      admin: {
        description: 'The developer assigned to fix this bug',
      },
    },
    {
      name: 'comments',
      type: 'array',
      label: 'Comments',
      admin: {
        description: 'Discussion about the bug',
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          label: 'User',
        },
        {
          name: 'comment',
          type: 'textarea',
          required: true,
          label: 'Comment',
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          label: 'Created At',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
  timestamps: true,
};

export default Bugs;

import { Access, FieldAccess } from 'payload/types';
import { User } from '../../../payload-types';

export const isAdmin: Access = ({ req: { user } }) => {
  // Return true if the user has an admin role
  return Boolean(user?.role === 'admin');
};

export const isAdminOrOwner: Access = ({ req: { user }, id }) => {
  // If there's no user, deny access
  if (!user) return false;

  // If the user is an admin, allow access
  if (user.role === 'admin') return true;

  // If this is a create operation (no ID), only allow if the user has appropriate role
  if (!id) return false;

  // Otherwise, only allow if the user is the owner of this document
  return {
    author: {
      equals: user.id,
    },
  };
};

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  // If there's no user, deny access
  if (!user) return false;

  // If the user is an admin, allow access
  if (user.role === 'admin') return true;

  // If this is a create operation (no ID), only allow if the user has appropriate role
  if (!id) return false;

  // Otherwise, only allow if the user is editing their own document
  return {
    id: {
      equals: user.id,
    },
  };
};

// Field-level access control
export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
  return Boolean(user?.role === 'admin');
};

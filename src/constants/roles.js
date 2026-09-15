export const ROLES = {
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: 'Customer',
  [ROLES.TECHNICIAN]: 'Field Technician',
  [ROLES.ADMIN]: 'System Administrator',
};

export const ROLE_COLORS = {
  [ROLES.CUSTOMER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLES.TECHNICIAN]: 'bg-amber-100 text-amber-800 border-amber-200',
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
};

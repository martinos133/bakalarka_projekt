export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    LOGOUT: '/api/auth/logout',
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
  },
  ADVERTISEMENTS: {
    BASE: '/api/advertisements',
    BY_ID: (id: string) => `/api/advertisements/${id}`,
    BY_USER: (userId: string) => `/api/advertisements/user/${userId}`,
  },
  ADMIN: {
    USERS: '/api/admin/users',
    ADVERTISEMENTS: '/api/admin/advertisements',
    STATS: '/api/admin/stats',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

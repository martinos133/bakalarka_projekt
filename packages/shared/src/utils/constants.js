"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me',
        LOGOUT: '/api/auth/logout',
    },
    USERS: {
        BASE: '/api/users',
        BY_ID: (id) => `/api/users/${id}`,
    },
    ADVERTISEMENTS: {
        BASE: '/api/advertisements',
        BY_ID: (id) => `/api/advertisements/${id}`,
        BY_USER: (userId) => `/api/advertisements/user/${userId}`,
    },
    ADMIN: {
        USERS: '/api/admin/users',
        ADVERTISEMENTS: '/api/admin/advertisements',
        STATS: '/api/admin/stats',
    },
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};
//# sourceMappingURL=constants.js.map
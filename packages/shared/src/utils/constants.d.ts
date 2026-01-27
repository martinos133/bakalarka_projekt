export declare const API_ROUTES: {
    readonly AUTH: {
        readonly LOGIN: "/api/auth/login";
        readonly REGISTER: "/api/auth/register";
        readonly ME: "/api/auth/me";
        readonly LOGOUT: "/api/auth/logout";
    };
    readonly USERS: {
        readonly BASE: "/api/users";
        readonly BY_ID: (id: string) => string;
    };
    readonly ADVERTISEMENTS: {
        readonly BASE: "/api/advertisements";
        readonly BY_ID: (id: string) => string;
        readonly BY_USER: (userId: string) => string;
    };
    readonly ADMIN: {
        readonly USERS: "/api/admin/users";
        readonly ADVERTISEMENTS: "/api/admin/advertisements";
        readonly STATS: "/api/admin/stats";
    };
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly INTERNAL_SERVER_ERROR: 500;
};

// Shape JwtGuard attaches to req.user; declared here so controllers can type @Req() as Request.
export interface JwtUser {
    sub: string;
    email: string;
}

declare module 'express' {
    interface Request {
        user: JwtUser;
    }
}

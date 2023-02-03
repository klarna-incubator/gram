import { UserToken } from "./models/UserToken";
export declare function generateAuthToken(payload: UserToken): Promise<string>;
export declare function validateAuthToken(token: string): Promise<UserToken>;
export declare function generateToken(payload: object, ttl?: number, purpose?: string): Promise<string>;
export declare function validateToken(token: string, purpose?: string): Promise<UserToken>;
//# sourceMappingURL=jwt.d.ts.map
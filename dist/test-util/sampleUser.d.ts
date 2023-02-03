import { User } from "@gram/core/dist/auth/models/User";
import { UserToken } from "@gram/core/dist/auth/models/UserToken";
import { UserProvider } from "@gram/core/dist/auth/UserProvider";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
export declare const sampleUser: UserToken;
export declare const sampleOtherUser: UserToken;
export declare const sampleReviewer: UserToken;
export declare const sampleAdmin: UserToken;
declare class TestUserProvider implements UserProvider {
    key: string;
    lookup(ctx: RequestContext, userIds: string[]): Promise<User[]>;
}
export declare const testUserProvider: TestUserProvider;
export {};
//# sourceMappingURL=sampleUser.d.ts.map
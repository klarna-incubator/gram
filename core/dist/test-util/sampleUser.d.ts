import { User } from "../auth/models/User";
import { UserToken } from "../auth/models/UserToken";
import { UserProvider } from "../auth/UserProvider";
import { RequestContext } from "../data/providers/RequestContext";
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
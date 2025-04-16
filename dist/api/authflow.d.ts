import { NewLoginRequest, UserTokens } from "../protos/auth";
export type LupydPermissions = bigint;
export declare const loginThirdPartyAppWithCallbackUrl: (loginRequest: NewLoginRequest, lupydAccessToken: string, callbackUrl: URL) => Promise<void>;
export declare const loginThirdPartyAppWithInBrowser: (loginRequest: NewLoginRequest, lupydAccessToken: string, targetOrigin: string) => Promise<void>;
export declare const getLupydAccessTokenFromFirebaseToken: (fbAccessToken: string) => Promise<UserTokens>;
export declare const refreshTokens: (refreshToken: string) => Promise<UserTokens>;
export declare const loginWithLink: (link: string, email: string) => void;
export declare class LupydAuth {
    constructor();
    getAccessToken(): string | undefined;
    getRefreshToken(): string | undefined;
    getValidAccessToken(): Promise<string>;
    fetchNewAccessToken(): Promise<string>;
}

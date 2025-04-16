interface LupydAccessToken {
    exp: number;
    iat: number;
    uid: number;
    uname: string;
}
export declare class AuthManager {
    private accessToken;
    private refreshToken;
    private appId;
    private refreshTaskId;
    isLoggedIn(): boolean;
    getDeserializedAccessToken(): LupydAccessToken;
    refresh(): Promise<void>;
}
export {};

import { Auth0Client, User } from "@auth0/auth0-spa-js";
export declare class Auth0Handler {
    private client;
    private onAuthStatusChangeCallback;
    constructor(client: Auth0Client, onAuthStatusChangeCallback: (user: User | undefined) => void);
    static initialize(clientId: string, audience: string, onAuthStatusChangeCallback: (user: User | undefined) => void): Promise<Auth0Handler>;
    login(): Promise<void>;
    getToken(forceReload?: boolean): Promise<string | null>;
    getUser(): Promise<User | undefined>;
    getUsername(): Promise<string | undefined>;
    deleteAccount(): Promise<void>;
    logout(): Promise<void>;
    assignUsername(username: string): Promise<void>;
}
export declare const getAuthHandler: () => Auth0Handler | undefined;

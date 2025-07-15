import { Auth0Client } from "@auth0/auth0-spa-js";
export interface DecodedToken {
    uname: string | undefined;
    perms: number | undefined;
    iss: string;
    aud: string[];
    iat: number;
    exp: number;
    jtl: string;
    client_id: string;
    sub: string;
}
export declare class Auth0Handler {
    private client;
    private onAuthStatusChangeCallback;
    constructor(client: Auth0Client, onAuthStatusChangeCallback: (user: DecodedToken | undefined) => void);
    static initialize(clientId: string, audience: string, onAuthStatusChangeCallback: (user: DecodedToken | undefined) => void): Promise<Auth0Handler>;
    login(): Promise<void>;
    getToken(forceReload?: boolean): Promise<string | undefined>;
    getUser(): Promise<DecodedToken | undefined>;
    getUsername(): Promise<string | undefined>;
    deleteAccount(): Promise<void>;
    logout(): Promise<void>;
    assignUsername(username: string): Promise<void>;
}
export declare const getAuthHandler: () => Auth0Handler | undefined;

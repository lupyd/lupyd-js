"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthHandler = exports.Auth0Handler = void 0;
const auth0_spa_js_1 = require("@auth0/auth0-spa-js");
const constants_1 = require("../constants");
const user_1 = require("../protos/user");
let instance = undefined;
class Auth0Handler {
    client;
    onAuthStatusChangeCallback;
    constructor(client, onAuthStatusChangeCallback) {
        this.client = client;
        this.onAuthStatusChangeCallback = onAuthStatusChangeCallback;
    }
    static async initialize(clientId, audience, redirectUrl, onAuthStatusChangeCallback) {
        if (instance) {
            console.error("Already initialized");
            // instance.onAuthStatusChangeCallback = onAuthStatusChangeCallback;
            return instance;
        }
        const client = await (0, auth0_spa_js_1.createAuth0Client)({
            domain: "auth.lupyd.com",
            clientId,
            authorizationParams: {
                audience: audience,
                redirect_uri: redirectUrl,
            },
        });
        const handler = new Auth0Handler(client, onAuthStatusChangeCallback);
        instance = handler;
        await client.checkSession();
        const isAuthenticated = await client.isAuthenticated();
        if (isAuthenticated) {
            const user = await handler.getUser();
            handler.onAuthStatusChangeCallback(user);
        }
        else {
            handler.onAuthStatusChangeCallback(undefined);
        }
        return handler;
    }
    async login(appState) {
        if (process.env.NEXT_PUBLIC_JS_ENV_EMULATOR_MODE === "true") {
            await this.client.loginWithPopup(undefined, {
                timeoutInSeconds: 60 * 10,
            });
        }
        else {
            await this.client.loginWithRedirect({
                appState,
                openUrl(url) {
                    window.open(url);
                },
            });
        }
        const user = await this.getUser();
        this.onAuthStatusChangeCallback(user);
    }
    async getToken(forceReload = false) {
        if (!(await this.client.isAuthenticated())) {
            return undefined;
        }
        const token = await this.client.getTokenSilently({
            cacheMode: forceReload ? "off" : "on",
        });
        if (forceReload) {
            this.onAuthStatusChangeCallback(await this.getUser());
        }
        return token;
    }
    async getUser() {
        const token = await this.getToken();
        if (token) {
            return getPayloadFromAccessToken(token);
        }
    }
    async getUsername() {
        const user = await this.getUser();
        if (user) {
            return "uname" in user ? user["uname"] : undefined;
        }
        return undefined;
    }
    async deleteAccount() {
        const response = await fetch(`${constants_1.API_URL}/user`, {
            method: "DELETE",
            headers: {
                authorization: `Bearer ${await this.getToken()}`,
            },
        });
        if (response.status == 200) {
            await this.logout();
        }
        else {
            throw new Error(`Received unexpected status code ${response.status} ${await response.text()}`);
        }
    }
    async logout() {
        await this.client.logout();
        this.onAuthStatusChangeCallback(undefined);
    }
    async assignUsername(username) {
        if (await this.getUsername()) {
            throw Error("Username already assigned");
        }
        const response = await fetch(`${constants_1.API_URL}/user`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${await this.getToken()}`,
            },
            body: new Uint8Array(user_1.FullUser.encode(user_1.FullUser.create({ uname: username })).finish()),
        });
        if (response.status == 201) {
            await this.getToken(true);
            return;
        }
        if (response.status == 409) {
            throw new Error(`[${response.status}] ${await response.text()}`);
        }
    }
    async handleRedirectCallback() {
        const result = await this.client.handleRedirectCallback();
        const user = await this.getUser();
        if (user) {
            this.onAuthStatusChangeCallback(user);
        }
        return result.appState;
    }
}
exports.Auth0Handler = Auth0Handler;
const getAuthHandler = () => instance;
exports.getAuthHandler = getAuthHandler;
function getPayloadFromAccessToken(token) {
    const [_header, payload, _signature] = token.split(".");
    return JSON.parse(atob(payload));
}

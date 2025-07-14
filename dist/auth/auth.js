"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthHandler = exports.Auth0Handler = void 0;
const auth0_spa_js_1 = require("@auth0/auth0-spa-js");
const constants_1 = require("../constants");
let instance = undefined;
class Auth0Handler {
    client;
    onAuthStatusChangeCallback;
    constructor(client, onAuthStatusChangeCallback) {
        this.client = client;
        this.onAuthStatusChangeCallback = onAuthStatusChangeCallback;
    }
    static async initialize(clientId, audience, onAuthStatusChangeCallback) {
        if (instance) {
            console.error("Already initialized");
            return instance;
        }
        const client = await (0, auth0_spa_js_1.createAuth0Client)({
            domain: "auth.lupyd.com",
            clientId,
            authorizationParams: {
                audience: audience,
            },
        });
        const handler = new Auth0Handler(client, onAuthStatusChangeCallback);
        await client.checkSession();
        const isAuthenticated = await client.isAuthenticated();
        if (isAuthenticated) {
            const user = await client.getUser();
            handler.onAuthStatusChangeCallback(user);
        }
        else {
            handler.onAuthStatusChangeCallback(undefined);
        }
        instance = handler;
        return handler;
    }
    async login() {
        await this.client.loginWithPopup();
        const user = await this.getUser();
        this.onAuthStatusChangeCallback(user);
    }
    async getToken(forceReload = false) {
        if (!(await this.client.getIdTokenClaims())) {
            return null;
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
        if (await this.client.isAuthenticated()) {
            return this.client.getUser();
        }
    }
    async getUsername() {
        if (await this.client.isAuthenticated()) {
            const user = await this.client.getUser();
            if (user) {
                return "uname" in user ? user["uname"] : undefined;
            }
        }
        return undefined;
    }
    async deleteAccount() {
        const response = await fetch(`https://${constants_1.API_URL}/user`, {
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
}
exports.Auth0Handler = Auth0Handler;
const getAuthHandler = () => instance;
exports.getAuthHandler = getAuthHandler;

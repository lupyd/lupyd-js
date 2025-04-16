"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LupydAuth = exports.loginWithLink = exports.refreshTokens = exports.getLupydAccessTokenFromFirebaseToken = exports.loginThirdPartyAppWithInBrowser = exports.loginThirdPartyAppWithCallbackUrl = void 0;
const constants_1 = require("./constants");
const auth_1 = require("../protos/auth");
const utils_1 = require("../bin/utils");
const minimal_1 = require("protobufjs/minimal");
const store2_1 = require("store2");
const element_1 = require("../firebase/element");
const getOob = async (loginRequest, lupydAccessToken) => {
    const response = await fetch(`${constants_1.ENDPOINT}/getOob`, {
        method: "POST",
        headers: {
            "authorization": `Bearer ${lupydAccessToken}`
        },
        body: auth_1.NewLoginRequest.encode(loginRequest, new minimal_1.BufferWriter()).finish()
    });
    return response.text();
};
const loginThirdPartyAppWithCallbackUrl = async (loginRequest, lupydAccessToken, callbackUrl) => {
    const oob = await getOob(loginRequest, lupydAccessToken);
    callbackUrl.searchParams.append("oob", oob);
    window.location.href = callbackUrl.toString();
    // NOTE TEST whether it auto closes browser session or not
};
exports.loginThirdPartyAppWithCallbackUrl = loginThirdPartyAppWithCallbackUrl;
const loginThirdPartyAppWithInBrowser = async (loginRequest, lupydAccessToken, targetOrigin) => {
    const oob = await getOob(loginRequest, lupydAccessToken);
    window.postMessage({ oob }, targetOrigin);
};
exports.loginThirdPartyAppWithInBrowser = loginThirdPartyAppWithInBrowser;
const getLupydAccessTokenFromFirebaseToken = async (fbAccessToken) => {
    const response = await fetch(`${constants_1.ENDPOINT}/newLogin`, {
        method: "POST",
        body: fbAccessToken
    });
    const body = await response.arrayBuffer();
    const status = response.status;
    if (status == 200) {
        return auth_1.UserTokens.decode(new Uint8Array(body));
    }
    console.error(`STATUS: ${status} BODY: ${(0, utils_1.arrayBufferToString)(body)}`);
};
exports.getLupydAccessTokenFromFirebaseToken = getLupydAccessTokenFromFirebaseToken;
const refreshTokens = async (refreshToken) => {
    const response = await fetch(`${constants_1.ENDPOINT}/refresh`, {
        method: "POST",
        body: refreshToken,
    });
    const body = await response.arrayBuffer();
    const status = response.status;
    if (status == 200) {
        return auth_1.UserTokens.decode(new Uint8Array(body));
    }
    console.error(`STATUS: ${status} BODY: ${(0, utils_1.arrayBufferToString)(body)}`);
};
exports.refreshTokens = refreshTokens;
const loginWithLink = (link, email) => {
};
exports.loginWithLink = loginWithLink;
class LupydAuth {
    constructor() { }
    getAccessToken() {
        return store2_1.default.get("lupyd_access_token");
    }
    getRefreshToken() {
        return store2_1.default.get("lupyd_refresh_token");
    }
    async getValidAccessToken() {
        const accessToken = this.getAccessToken();
        if (accessToken) {
            if (isValidAccessToken(accessToken)) {
                return accessToken;
            }
        }
        return this.fetchNewAccessToken();
    }
    async fetchNewAccessToken() {
        const functions = await (0, element_1.getFunctionsModule)();
        const refreshToken = this.getRefreshToken();
        const accessToken = this.getAccessToken();
        const result = await functions.httpsCallable(functions.getFunctions(undefined, element_1.FUNCTIONS_REGION), "refreshTokens")({ refreshToken, accessToken });
        if (result.data && "access_token" in result.data && "refresh_token" in result.data) {
            store2_1.default.set("lupyd_access_token", result.data.access_token);
            store2_1.default.set("lupyd_refresh_token", result.data.refresh_token);
            return result.data.access_token;
        }
        throw new Error(`Returned Data is invalid ${result.data}`);
    }
}
exports.LupydAuth = LupydAuth;
function isValidAccessToken(s) {
    const [_header, payload, _signature] = s.split('.');
    const obj = JSON.parse(new TextDecoder().decode((0, utils_1.base64DecodeURL)(payload)));
    if ("exp" in obj && typeof obj.exp === "number" && obj.exp < Date.now() / 1000) {
        return true;
    }
    else {
        return false;
    }
}

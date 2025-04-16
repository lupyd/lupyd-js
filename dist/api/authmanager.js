"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const utils_1 = require("../bin/utils");
const authflow_1 = require("./authflow");
class AuthManager {
    accessToken;
    refreshToken;
    appId;
    refreshTaskId = -1;
    isLoggedIn() {
        return this.getDeserializedAccessToken().exp < Date.now() / 1000;
    }
    getDeserializedAccessToken() {
        const [_header, payload, _signature] = this.accessToken.split(".");
        const token = JSON.parse((0, utils_1.base64UrlDecode)(payload));
        return token;
    }
    async refresh() {
        console.info("Refreshing Lupyd Tokens");
        const tokens = await (0, authflow_1.refreshTokens)(this.refreshToken);
        if (tokens == null) {
            console.error("Failed to refresh tokens");
        }
        else {
            clearTimeout(this.refreshTaskId);
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            const duration_in_ms = this.getDeserializedAccessToken().exp * 1000 - Date.now() - 3_00_000;
            this.refreshTaskId = Number(setTimeout(() => {
                this.refresh();
            }, duration_in_ms));
        }
    }
}
exports.AuthManager = AuthManager;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebrtcConfig = void 0;
const constants_1 = require("../constants");
const auth_1 = require("../firebase/auth");
const getWebrtcConfig = async () => {
    const url = `${constants_1.API_CDN_URL}/turn`;
    {
        const username = await auth_1.AuthHandler.getUsername();
        if (!username) {
            throw new Error("User not signed in");
        }
    }
    const token = await auth_1.AuthHandler.getToken();
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (response.status !== 200) {
        throw new Error(`Unexpected Response ${response.status} ${await response.text()} `);
    }
    const obj = await response.json();
    const config = parseToRTCConfig(obj);
    if (!config) {
        throw new Error(`Invalid RTC Config is received ${JSON.stringify(obj)}`);
    }
    return config;
};
exports.getWebrtcConfig = getWebrtcConfig;
function parseToRTCConfig(obj) {
    if ("iceServers" in obj) {
        const iceServers = obj["iceServers"];
        if ("username" in iceServers &&
            typeof iceServers["username"] === "string" &&
            "credential" in iceServers &&
            typeof iceServers["credential"] === "string" &&
            "urls" in iceServers &&
            Array.isArray(iceServers["urls"]) &&
            iceServers["urls"].every((e) => typeof e === "string")) {
            const urls = iceServers["urls"];
            const credential = iceServers["credential"];
            const username = iceServers["username"];
            const config = {
                iceServers: [
                    {
                        urls,
                        credential,
                        username,
                    },
                ],
            };
            return config;
        }
    }
    return undefined;
}

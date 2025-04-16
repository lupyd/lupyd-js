"use strict";
//@ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAds = void 0;
const constants_1 = require("../constants");
const ads_1 = require("../protos/ads");
const getAds = async () => {
    const response = await fetch(`${constants_1.API_URL}/ads`);
    const body = new Uint8Array(await response.arrayBuffer());
    return ads_1.AdResponse.decode(body);
};
exports.getAds = getAds;

"use strict";
//@ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAds = void 0;
const constants_1 = require("../constants");
const protos_1 = require("@lupyd/protos");
const { AdResponse } = protos_1.ads;
const getAds = async () => {
    const response = await fetch(`${constants_1.API_URL}/ads`);
    const body = new Uint8Array(await response.arrayBuffer());
    return AdResponse.decode(body);
};
exports.getAds = getAds;

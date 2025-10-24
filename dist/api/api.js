"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
exports.usernameExistsInToken = usernameExistsInToken;
exports.getPayloadFromAccessToken = getPayloadFromAccessToken;
const post_1 = require("./post");
const user_1 = require("./user");
function usernameExistsInToken(token) {
    try {
        const decodedToken = getPayloadFromAccessToken(token);
        return "uname" in decodedToken && typeof decodedToken.uname == "string";
    }
    catch (err) {
        console.error(err);
        return false;
    }
}
function getPayloadFromAccessToken(token) {
    const [_header, payload, _signature] = token.split(".");
    return JSON.parse(atob(payload));
}
async function undefinedOnfail(p) {
    try {
        const val = await p;
        return val;
    }
    catch (err) {
        return undefined;
    }
}
class ApiService {
    getToken = () => {
        throw new Error("getToken is not given");
    };
    baseUrl;
    apiCdnUrl;
    constructor(baseUrl, apiCdnUrl, getToken) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
        this.apiCdnUrl = apiCdnUrl;
    }
    async getPost(id) {
        return (0, post_1.getPost)(this.baseUrl, id, await undefinedOnfail(this.getToken()));
    }
    async getPosts(getPostDetails) {
        return (0, post_1.getPosts)(this.baseUrl, getPostDetails, await undefinedOnfail(this.getToken()));
    }
    putVote(vote) {
        return this.putVotes([vote]);
    }
    async putVotes(votes) {
        const token = await this.getToken();
        return (0, post_1.putVotes)(this.baseUrl, votes, token);
    }
    async createPost(createPostDetails) {
        const token = await this.getToken();
        return (0, post_1.createPost)(this.baseUrl, createPostDetails, token);
    }
    async createPostWithFiles(createPostDetails, files, progressCallback) {
        const token = await this.getToken();
        return (0, post_1.createPostWithFiles)(this.apiCdnUrl, createPostDetails, files, progressCallback, token);
    }
    async reportPost(id, text) {
        const token = await this.getToken();
        return (0, post_1.reportPost)(this.baseUrl, id, text, token);
    }
    async deletePost(id) {
        const token = await this.getToken();
        return (0, post_1.deletePost)(this.baseUrl, id, token);
    }
    async getTrendingHashtags() {
        return (0, post_1.getTrendingHashtags)(this.baseUrl);
    }
    async getNotifications() {
        (0, post_1.getNotifications)(this.baseUrl, await this.getToken());
    }
    async getUsers(username) {
        return (0, user_1.getUsers)(this.baseUrl, username, await undefinedOnfail(this.getToken()));
    }
    async getUser(username) {
        return (0, user_1.getUser)(this.baseUrl, username, await undefinedOnfail(this.getToken()));
    }
    async getUsersByUsername(usernames) {
        return (0, user_1.getUsersByUsername)(this.baseUrl, usernames, await undefinedOnfail(this.getToken()));
    }
    async updateUser(info) {
        return (0, user_1.updateUser)(this.baseUrl, info, await this.getToken());
    }
    async updateUserProfilePicture(blob) {
        return (0, user_1.updateUserProfilePicture)(this.apiCdnUrl, blob, await this.getToken());
    }
    async deleteUserProfilePicture() {
        return (0, user_1.deleteUserProfilePicture)(this.apiCdnUrl, await this.getToken());
    }
}
exports.ApiService = ApiService;

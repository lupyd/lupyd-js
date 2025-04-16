"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = exports.reportPost = exports.createPostWithFiles = exports.createPost = exports.putVotes = exports.putVote = exports.getPosts = exports.FetchType = exports.getPost = void 0;
const constants_1 = require("../constants");
const post_1 = require("../protos/post");
const auth_1 = require("../firebase/auth");
const utils_1 = require("../bin/utils");
const store2_1 = require("store2");
const databases_1 = require("../databases");
const getPost = async (id) => {
    const url = `${constants_1.API_URL}/post/${id}`;
    const response = await fetch(url);
    if (response.status === 200) {
        return post_1.FullPost.decode(new Uint8Array(await response.arrayBuffer()));
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
};
exports.getPost = getPost;
var FetchType;
(function (FetchType) {
    FetchType[FetchType["Latest"] = 0] = "Latest";
    FetchType[FetchType["Users"] = 1] = "Users";
    FetchType[FetchType["Replies"] = 2] = "Replies";
    FetchType[FetchType["Edits"] = 3] = "Edits";
    FetchType[FetchType["Search"] = 4] = "Search";
})(FetchType || (exports.FetchType = FetchType = {}));
const parseGetPostsData = (details) => {
    const searchParams = new URLSearchParams();
    searchParams.append("type", (details.allowedPostTypes ?? 0).toString());
    if (details.start) {
        searchParams.append("start", details.start);
    }
    if (details.end) {
        searchParams.append("end", details.end);
    }
    switch (details.fetchType) {
        case FetchType.Latest: {
            break;
        }
        case FetchType.Users: {
            if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("users", details.fetchTypeFields.join(","));
            }
            else if (typeof details.fetchTypeFields === "string" &&
                (0, utils_1.isValidUsername)(details.fetchTypeFields)) {
                searchParams.append("users", details.fetchTypeFields);
            }
            else {
                throw new Error("Invalid FetchType.Users");
            }
            break;
        }
        case FetchType.Replies: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("replies", details.fetchTypeFields);
            }
            else if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("replies", details.fetchTypeFields.join(","));
            }
            else {
                throw new Error("Invalid FetchType.Replies");
            }
            break;
        }
        case FetchType.Edits: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("edits", details.fetchTypeFields);
            }
            else if (Array.isArray(details.fetchTypeFields) &&
                details.fetchTypeFields.every((e) => typeof e === "string")) {
                searchParams.append("edits", details.fetchTypeFields.join(","));
            }
            else {
                throw new Error("Invalid FetchType.Replies");
            }
            break;
        }
        case FetchType.Search: {
            if (typeof details.fetchTypeFields === "string") {
                searchParams.append("search", details.fetchTypeFields);
            }
            else {
                throw new Error("Invalid FetchType.Search");
            }
        }
    }
    return searchParams;
};
const getPosts = async (getPostDetails) => {
    try {
        const url = new URL(`${constants_1.API_URL}/post`, window.location.origin);
        parseGetPostsData(getPostDetails).forEach((value, key) => url.searchParams.append(key, value));
        const token = await auth_1.AuthHandler.getToken();
        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        console.log({ url: url.toString() });
        if (response.status === 200) {
            const posts = post_1.FullPosts.decode(new Uint8Array(await response.arrayBuffer())).posts;
            const db = document.querySelector("lupyd-databases").localDb;
            if (db) {
                if (!token) {
                    const username = store2_1.default.get("username");
                    if (username) {
                        const transaction = db.transaction(databases_1.VOTES_DB_STORE_NAME);
                        await Promise.all(posts.map(async (post) => {
                            const row = await transaction.store.get((0, utils_1.ulidStringify)(post.id));
                            if (row && row.by == username) {
                                post.vote =
                                    typeof row.val === "boolean"
                                        ? post_1.BoolValue.create({ val: row.val })
                                        : undefined;
                            }
                        }));
                    }
                }
                else {
                    const tx = db.transaction(databases_1.VOTES_DB_STORE_NAME, "readwrite");
                    await Promise.all(posts.map((post) => tx.store.put({ val: post.vote?.val }, (0, utils_1.ulidStringify)(post.id))));
                    await tx.done;
                }
                const tx = db.transaction(databases_1.POSTS_DB_STORE_NAME, "readwrite");
                await Promise.all(posts.map((post) => tx.store.put(post, (0, utils_1.ulidStringify)(post.id))));
                await tx.done;
            }
            return posts;
        }
        else {
            console.error(`${url} [${response.status}] ${await response.text()}`);
        }
    }
    catch (err) {
        console.error(err);
    }
    return [];
};
exports.getPosts = getPosts;
class VotesRequestBatcher {
    queuedVotes = [];
    intervalId;
    constructor() {
        this.intervalId = setInterval(() => {
            this.flustVotes();
        }, 10_000);
    }
    static instance = new VotesRequestBatcher();
    queueVote(vote) {
        for (let i = 0; i < this.queuedVotes.length; i++) {
            if (this.queuedVotes[i].id == vote.id) {
                this.queuedVotes[i] = vote;
            }
        }
    }
    flustVotes() {
        const votes = this.queuedVotes;
        if (votes.length === 0)
            return;
        this.queuedVotes = [];
        (0, exports.putVotes)(votes)
            .then(() => console.log(`Flushed votes ${votes.map((e) => `${(0, utils_1.ulidStringify)(e.id)}:${e.val}`)}`))
            .catch((err) => {
            console.error(err);
            votes.forEach(this.queueVote);
        });
    }
}
const putVote = (vote) => {
    // VotesRequestBatcher.instance.queueVote(vote);
    return (0, exports.putVotes)([vote]);
};
exports.putVote = putVote;
const putVotes = async (votes) => {
    try {
        const db = document.querySelector("lupyd-databases").localDb;
        const url = `${constants_1.API_URL}/vote`;
        const token = await auth_1.AuthHandler.getToken();
        if (!token) {
            throw new Error(`User not authenticated`);
        }
        const body = post_1.Votes.encode(post_1.Votes.create({ votes })).finish();
        const response = await fetch(url, {
            method: "PUT",
            body,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 200) {
            console.log(`Successfully voted`);
            const username = await auth_1.AuthHandler.getUsername();
            if (db) {
                const tx = db.transaction(databases_1.VOTES_DB_STORE_NAME, "readwrite");
                await Promise.all(votes.map((vote) => tx.store.put({ id: vote.id, val: vote.val?.val, by: username }, (0, utils_1.ulidStringify)(vote.id))));
                await tx.done;
            }
        }
        else {
            console.error(`${url} [${response.status}] ${await response.text()}`);
        }
    }
    catch (err) {
        console.error(err);
    }
};
exports.putVotes = putVotes;
const createPost = async (createPostDetails) => {
    const url = `${constants_1.API_URL}/post`;
    const username = await auth_1.AuthHandler.getUsername();
    const token = await auth_1.AuthHandler.getToken();
    if (username === null || token === undefined)
        throw new Error("User Not Authenticated");
    console.log({ createPostDetails });
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: post_1.CreatePostDetails.encode(createPostDetails).finish(),
    });
    if (response.status === 200) {
        const id = new Uint8Array(await response.arrayBuffer());
        const post = post_1.FullPost.create({
            id,
            title: createPostDetails.title,
            body: createPostDetails.body
                ? post_1.PostBodies.encode(post_1.PostBodies.create({ bodies: [createPostDetails.body] })).finish()
                : new Uint8Array(),
            expiry: createPostDetails.expiry,
            replyingTo: createPostDetails.replyingTo,
            postType: createPostDetails.postType,
            isMemory: createPostDetails.isMemory,
            by: username,
        });
        return post;
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
};
exports.createPost = createPost;
const makeCreatePostWithFilesBlob = async (details, files) => {
    const detailsProto = post_1.CreatePostWithFiles.encode(details).finish();
    const contentLength = detailsProto.byteLength +
        8 +
        details.files.map((e) => Number(e.length)).reduce((a, b) => a + b);
    const blobParts = [];
    console.log({ contentLength });
    blobParts.push(utils_1.Utils.bigintToBigEndian8Bytes(BigInt(detailsProto.byteLength)));
    blobParts.push(detailsProto);
    for (const file of files) {
        const response = await fetch(file);
        if (response.body && response.status === 200) {
            const blob = await response.blob();
            blobParts.push(blob);
        }
        else {
            throw new Error("File or blob url is invalid");
        }
    }
    console.log({ blobParts });
    return new Blob(blobParts);
};
const createPostWithFiles = async (createPostDetails, files, progressCallback) => {
    const url = `${constants_1.API_CDN_URL}/post-full`;
    const token = await auth_1.AuthHandler.getToken();
    if (token === undefined)
        throw new Error("User Not Authenticated");
    if (!progressCallback) {
        progressCallback = (total, sent) => console.log(`${sent}/${total} progress: ${(sent * 100) / total}%`);
    }
    const body = await makeCreatePostWithFilesBlob(createPostDetails, files);
    const contentLength = body.size;
    console.log({ createPostDetails, files, contentLength });
    const response = await (0, utils_1.fetchWithProgress)(url, "PUT", {
        Authorization: `Bearer ${token}`,
        "content-type": "application/octet-stream",
    }, body, (sent, total) => progressCallback(total, sent), (recv, total) => { });
    // const response = await fetch(url, {
    //   method: "PUT",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "content-length": contentLength.toString(),
    //     "content-type": "application/octet-stream",
    //   },
    //   body,
    // });
    // if (response.status === 200) {
    //   return FullPost.decode(new Uint8Array(await response.arrayBuffer()));
    // } else {
    //   console.error(`${url} [${response.status}] ${await response.text()}`);
    // }
    if (response.status === 200) {
        return post_1.FullPost.decode(response.body);
    }
    else {
        console.error(`${url} [${response.status}] ${new TextDecoder().decode(response.body)}`);
    }
};
exports.createPostWithFiles = createPostWithFiles;
const reportPost = async (id, text) => {
    const body = post_1.PostReport.encode(post_1.PostReport.create({ postId: id, description: text })).finish();
    const url = `${constants_1.API_URL}/report`;
    const token = await auth_1.AuthHandler.getToken();
    if (token === undefined)
        throw new Error("User Not Authenticated");
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
    });
    if (response.status === 200) {
        console.log(`Successfully submitted report`);
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
};
exports.reportPost = reportPost;
const deletePost = async (id) => {
    const username = await auth_1.AuthHandler.getUsername();
    const token = await auth_1.AuthHandler.getToken();
    if (!username || !token) {
        throw new Error("User is not signed in");
    }
    const url = `${constants_1.API_URL}/post/${(0, utils_1.ulidStringify)(id)}`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(`DELETE ${url} status: ${response.status} ${await response.text()}`);
};
exports.deletePost = deletePost;

"use strict";
// import { API_URL, API_CDN_URL } from "../constants";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = exports.getTrendingHashtags = exports.deletePost = exports.reportPost = exports.createPostWithFiles = exports.createPost = exports.putVotes = exports.getPosts = exports.FetchType = exports.getPost = void 0;
const post_1 = require("../protos/post");
const utils_1 = require("../bin/utils");
const __1 = require("..");
const notification_1 = require("../protos/notification");
const api_1 = require("./api");
const getPost = async (apiUrl, id, token) => {
    const url = `${apiUrl}/post/${id}`;
    const response = await fetch(url, {
        headers: token
            ? {
                authorization: `Bearer ${token}`,
            }
            : undefined,
    });
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
    FetchType[FetchType["Hashtag"] = 5] = "Hashtag";
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
    if (details.offset) {
        searchParams.append("offset", details.offset.toString());
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
            break;
        }
        case FetchType.Hashtag: {
            if (typeof details.fetchTypeFields == "string") {
                searchParams.append("hashtag", details.fetchTypeFields);
            }
            else {
                throw new Error("Invalid FetchType.Hashtag");
            }
            break;
        }
    }
    return searchParams;
};
const getPosts = async (apiUrl, getPostDetails, token) => {
    try {
        const url = new URL(`${apiUrl}/post`, window.location.origin);
        parseGetPostsData(getPostDetails).forEach((value, key) => url.searchParams.append(key, value));
        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        console.log({ url: url.toString() });
        if (response.status === 200) {
            const posts = post_1.FullPosts.decode(new Uint8Array(await response.arrayBuffer())).posts;
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
// class VotesRequestBatcher {
//   queuedVotes: Vote[] = [];
//   intervalId: number;
//   constructor() {
//     this.intervalId = setInterval(() => {
//       this.flushVotes();
//     }, 10_000) as any as number;
//   }
//   static instance = new VotesRequestBatcher();
//   queueVote(vote: Vote) {
//     for (let i = 0; i < this.queuedVotes.length; i++) {
//       if (this.queuedVotes[i].id == vote.id) {
//         this.queuedVotes[i] = vote;
//       }
//     }
//   }
//   flushVotes() {
//     const votes = this.queuedVotes;
//     if (votes.length === 0) return;
//     this.queuedVotes = [];
//     putVotes(votes)
//       .then(() =>
//         console.log(
//           `Flushed votes ${votes.map((e) => `${ulidStringify(e.id)}:${e.val}`)}`,
//         ),
//       )
//       .catch((err) => {
//         console.error(err);
//         votes.forEach(this.queueVote);
//       });
//   }
// }
// export const putVote = (vote: Vote) => {
//   // VotesRequestBatcher.instance.queueVote(vote);
//   return putVotes([vote]);
// };
const putVotes = async (apiUrl, votes, token) => {
    try {
        const url = `${apiUrl}/vote`;
        if (!token || (0, api_1.usernameExistsInToken)(token)) {
            throw new Error(`User not authenticated`);
        }
        const body = new Uint8Array(post_1.Votes.encode(post_1.Votes.create({ votes })).finish());
        const response = await fetch(url, {
            method: "PUT",
            body,
            headers: {
                authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 200) {
            console.log(`Successfully voted`);
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
const createPost = async (apiUrl, createPostDetails, token) => {
    const url = `${apiUrl}/post`;
    if (!token || (0, api_1.usernameExistsInToken)(token))
        throw new Error("User Not Authenticated");
    console.log({ createPostDetails });
    const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new Uint8Array(post_1.CreatePostDetails.encode(createPostDetails).finish()),
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
        });
        return post;
    }
    else {
        console.error(`${url} [${response.status}] ${await response.text()}`);
    }
};
exports.createPost = createPost;
const makeCreatePostWithFilesBlob = async (details, files) => {
    const detailsProto = new Uint8Array(post_1.CreatePostWithFiles.encode(details).finish());
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
const createPostWithFiles = async (apiCdnUrl, createPostDetails, files, progressCallback, token) => {
    const url = `${apiCdnUrl}/post-full`;
    if (!token || (0, api_1.usernameExistsInToken)(token))
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
    }, body, (sent, total) => {
        if (progressCallback)
            progressCallback(total, sent);
    }, (recv, total) => { });
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
const reportPost = async (apiUrl, id, text, token) => {
    const body = new Uint8Array(post_1.PostReport.encode(post_1.PostReport.create({ postId: id, description: text })).finish());
    const url = `${apiUrl}/report`;
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
const deletePost = async (apiUrl, id, token) => {
    if (!token || (0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User is not signed in");
    }
    const url = `${apiUrl}/post/${(0, utils_1.ulidStringify)(id)}`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log(`DELETE ${url} status: ${response.status} ${await response.text()}`);
};
exports.deletePost = deletePost;
const getTrendingHashtags = async (apiUrl) => {
    const url = `${apiUrl}/hashtags`;
    const response = await fetch(url);
    if (response.status != 200) {
        throw new Error(`unexpected status code: ${response.status}, body: ${await response.text()}`);
    }
    return __1.PostProtos.PostHashtags.decode(new Uint8Array(await response.arrayBuffer()));
};
exports.getTrendingHashtags = getTrendingHashtags;
const getNotifications = async (apiUrl, token) => {
    if (!token || (0, api_1.usernameExistsInToken)(token)) {
        throw new Error("User not authenticated");
    }
    const url = `${apiUrl}/notifications`;
    const response = await fetch(url, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });
    if (response.status == 200) {
        return notification_1.Notifications.decode(new Uint8Array(await response.arrayBuffer()));
    }
    else {
        throw new Error(`Received unexpected status: ${response.status} ${await response.text()}`);
    }
};
exports.getNotifications = getNotifications;

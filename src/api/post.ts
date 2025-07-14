import { API_URL, API_CDN_URL } from "../constants";

import {
  CreatePostDetails,
  CreatePostWithFiles,
  FullPost,
  FullPosts,
  PostBodies,
  PostReport,
  Vote,
  Votes,
} from "../protos/post";
import {
  fetchWithProgress,
  isValidUsername,
  ulidStringify,
  Utils,
} from "../bin/utils";
import { PostProtos } from "..";
import { Notifications } from "../protos/notification";
import { getAuthHandler } from "../auth/auth";

export const getPost = async (id: string) => {
  const url = `${API_URL}/post/${id}`;
  const response = await fetch(url);

  if (response.status === 200) {
    return FullPost.decode(new Uint8Array(await response.arrayBuffer()));
  } else {
    console.error(`${url} [${response.status}] ${await response.text()}`);
  }
};

export enum FetchType {
  Latest,
  Users,
  Replies,
  Edits,
  Search,
  Hashtag,
}

export interface GetPostsData {
  allowedPostTypes?: number;
  fetchType: FetchType;
  fetchTypeFields?: any;
  start?: string;
  end?: string;
  offset?: number;
}

const parseGetPostsData = (details: GetPostsData) => {
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
      if (
        Array.isArray(details.fetchTypeFields) &&
        details.fetchTypeFields.every((e) => typeof e === "string")
      ) {
        searchParams.append("users", details.fetchTypeFields.join(","));
      } else if (
        typeof details.fetchTypeFields === "string" &&
        isValidUsername(details.fetchTypeFields)
      ) {
        searchParams.append("users", details.fetchTypeFields);
      } else {
        throw new Error("Invalid FetchType.Users");
      }

      break;
    }
    case FetchType.Replies: {
      if (typeof details.fetchTypeFields === "string") {
        searchParams.append("replies", details.fetchTypeFields);
      } else if (
        Array.isArray(details.fetchTypeFields) &&
        details.fetchTypeFields.every((e) => typeof e === "string")
      ) {
        searchParams.append("replies", details.fetchTypeFields.join(","));
      } else {
        throw new Error("Invalid FetchType.Replies");
      }

      break;
    }
    case FetchType.Edits: {
      if (typeof details.fetchTypeFields === "string") {
        searchParams.append("edits", details.fetchTypeFields);
      } else if (
        Array.isArray(details.fetchTypeFields) &&
        details.fetchTypeFields.every((e) => typeof e === "string")
      ) {
        searchParams.append("edits", details.fetchTypeFields.join(","));
      } else {
        throw new Error("Invalid FetchType.Replies");
      }
      break;
    }

    case FetchType.Search: {
      if (typeof details.fetchTypeFields === "string") {
        searchParams.append("search", details.fetchTypeFields);
      } else {
        throw new Error("Invalid FetchType.Search");
      }
      break;
    }

    case FetchType.Hashtag: {
      if (typeof details.fetchTypeFields == "string") {
        searchParams.append("hashtag", details.fetchTypeFields);
      } else {
        throw new Error("Invalid FetchType.Hashtag");
      }

      break;
    }
  }

  return searchParams;
};

export const getPosts = async (getPostDetails: GetPostsData) => {
  try {
    const url = new URL(`${API_URL}/post`, window.location.origin);
    parseGetPostsData(getPostDetails).forEach((value, key) =>
      url.searchParams.append(key, value),
    );
    const token = await getAuthHandler()?.getToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    console.log({ url: url.toString() });
    if (response.status === 200) {
      const posts = FullPosts.decode(
        new Uint8Array(await response.arrayBuffer()),
      ).posts;

      return posts;
    } else {
      console.error(`${url} [${response.status}] ${await response.text()}`);
    }
  } catch (err) {
    console.error(err);
  }

  return [];
};

class VotesRequestBatcher {
  queuedVotes: Vote[] = [];
  intervalId: number;

  constructor() {
    this.intervalId = setInterval(() => {
      this.flushVotes();
    }, 10_000) as any as number;
  }

  static instance = new VotesRequestBatcher();

  queueVote(vote: Vote) {
    for (let i = 0; i < this.queuedVotes.length; i++) {
      if (this.queuedVotes[i].id == vote.id) {
        this.queuedVotes[i] = vote;
      }
    }
  }

  flushVotes() {
    const votes = this.queuedVotes;
    if (votes.length === 0) return;
    this.queuedVotes = [];
    putVotes(votes)
      .then(() =>
        console.log(
          `Flushed votes ${votes.map((e) => `${ulidStringify(e.id)}:${e.val}`)}`,
        ),
      )
      .catch((err) => {
        console.error(err);
        votes.forEach(this.queueVote);
      });
  }
}

export const putVote = (vote: Vote) => {
  // VotesRequestBatcher.instance.queueVote(vote);
  return putVotes([vote]);
};

export const putVotes = async (votes: Vote[]) => {
  try {
    // const db = (
    //   document.querySelector("lupyd-databases") as LupydDatabasesElement
    // ).localDb;
    const url = `${API_URL}/vote`;
    const token = await getAuthHandler()?.getToken();
    if (!token) {
      throw new Error(`User not authenticated`);
    }
    const body = Votes.encode(Votes.create({ votes })).finish();
    const response = await fetch(url, {
      method: "PUT",
      body,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log(`Successfully voted`);
      const username = await getAuthHandler()?.getUsername();
      // if (db) {
      //   const tx = db.transaction(VOTES_DB_STORE_NAME, "readwrite");
      //   await Promise.all(
      //     votes.map((vote) =>
      //       tx.store.put(
      //         { id: vote.id, val: vote.val?.val, by: username },
      //         ulidStringify(vote.id),
      //       ),
      //     ),
      //   );
      //   await tx.done;
      // }
    } else {
      console.error(`${url} [${response.status}] ${await response.text()}`);
    }
  } catch (err) {
    console.error(err);
  }
};

export const createPost = async (createPostDetails: CreatePostDetails) => {
  const url = `${API_URL}/post`;
  const username = await getAuthHandler()?.getUsername();
  const token = await getAuthHandler()?.getToken();
  if (username === null || token === undefined)
    throw new Error("User Not Authenticated");
  console.log({ createPostDetails });
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: CreatePostDetails.encode(createPostDetails).finish(),
  });
  if (response.status === 200) {
    const id = new Uint8Array(await response.arrayBuffer());
    const post = FullPost.create({
      id,
      title: createPostDetails.title,
      body: createPostDetails.body
        ? PostBodies.encode(
            PostBodies.create({ bodies: [createPostDetails.body] }),
          ).finish()
        : new Uint8Array(),
      expiry: createPostDetails.expiry,
      replyingTo: createPostDetails.replyingTo,
      postType: createPostDetails.postType,
      isMemory: createPostDetails.isMemory,
      by: username,
    });

    return post;
  } else {
    console.error(`${url} [${response.status}] ${await response.text()}`);
  }
};

const makeCreatePostWithFilesBlob = async (
  details: CreatePostWithFiles,
  files: string[],
) => {
  const detailsProto = CreatePostWithFiles.encode(details).finish();
  const contentLength =
    detailsProto.byteLength +
    8 +
    details.files.map((e) => Number(e.length)).reduce((a, b) => a + b);

  const blobParts: BlobPart[] = [];

  console.log({ contentLength });

  blobParts.push(
    Utils.bigintToBigEndian8Bytes(BigInt(detailsProto.byteLength)),
  );
  blobParts.push(detailsProto);

  for (const file of files) {
    const response = await fetch(file);

    if (response.body && response.status === 200) {
      const blob = await response.blob();
      blobParts.push(blob);
    } else {
      throw new Error("File or blob url is invalid");
    }
  }
  console.log({ blobParts });
  return new Blob(blobParts);
};

export const createPostWithFiles = async (
  createPostDetails: CreatePostWithFiles,
  files: string[],
  progressCallback?: (totalBytes: number, bytesSent: number) => void,
) => {
  const url = `${API_CDN_URL}/post-full`;
  const token = await getAuthHandler()?.getToken();
  if (token === undefined) throw new Error("User Not Authenticated");

  if (!progressCallback) {
    progressCallback = (total, sent) =>
      console.log(`${sent}/${total} progress: ${(sent * 100) / total}%`);
  }

  const body = await makeCreatePostWithFilesBlob(createPostDetails, files);
  const contentLength = body.size;
  console.log({ createPostDetails, files, contentLength });

  const response = await fetchWithProgress(
    url,
    "PUT",
    {
      Authorization: `Bearer ${token}`,
      "content-type": "application/octet-stream",
    },
    body,
    (sent, total) => progressCallback(total, sent),
    (recv, total) => {},
  );

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
    return FullPost.decode(response.body);
  } else {
    console.error(
      `${url} [${response.status}] ${new TextDecoder().decode(response.body)}`,
    );
  }
};

export const reportPost = async (id: Uint8Array, text: string) => {
  const body = PostReport.encode(
    PostReport.create({ postId: id, description: text }),
  ).finish();
  const url = `${API_URL}/report`;
  const token = await getAuthHandler()?.getToken();
  if (token === undefined) throw new Error("User Not Authenticated");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (response.status === 200) {
    console.log(`Successfully submitted report`);
  } else {
    console.error(`${url} [${response.status}] ${await response.text()}`);
  }
};

export const deletePost = async (id: Uint8Array) => {
  const username = await getAuthHandler()?.getUsername();
  const token = await getAuthHandler()?.getToken();
  if (!username || !token) {
    throw new Error("User is not signed in");
  }

  const url = `${API_URL}/post/${ulidStringify(id)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(
    `DELETE ${url} status: ${response.status} ${await response.text()}`,
  );
};

export const getTrendingHashtags = async () => {
  const url = `${API_URL}/hashtags`;
  const response = await fetch(url);
  if (response.status != 200) {
    throw new Error(
      `unexpected status code: ${response.status}, body: ${await response.text()}`,
    );
  }
  return PostProtos.PostHashtags.decode(
    new Uint8Array(await response.arrayBuffer()),
  );
};

export const getNotifications = async () => {
  const url = `${API_URL}/notifications`;
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${await getAuthHandler()?.getToken()}`,
    },
  });

  if (response.status == 200) {
    return Notifications.decode(new Uint8Array(await response.arrayBuffer()));
  } else {
    throw new Error(
      `Received unexpected status: ${response.status} ${await response.text()}`,
    );
  }
};

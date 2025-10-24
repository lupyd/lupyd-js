// import { API_URL, API_CDN_URL } from "../constants";

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
import { usernameExistsInToken } from "./api";
import { throwStatusError } from "../error";

export const getPost = async (apiUrl: string, id: string, token?: string) => {
  const url = `${apiUrl}/post/${id}`;
  const response = await fetch(url, {
    headers: token
      ? {
          authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (response.status === 200) {
    return FullPost.decode(new Uint8Array(await response.arrayBuffer()));
  }

  throwStatusError(response.status, await response.text());
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

export const getPosts = async (
  apiUrl: string,
  getPostDetails: GetPostsData,
  token?: string,
) => {
  const url = new URL(`${apiUrl}/post`, window.location.origin);
  parseGetPostsData(getPostDetails).forEach((value, key) =>
    url.searchParams.append(key, value),
  );
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (response.status === 200) {
    const posts = FullPosts.decode(
      new Uint8Array(await response.arrayBuffer()),
    ).posts;

    return posts;
  }
  throwStatusError(response.status, await response.text());
};

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

export const putVotes = async (
  apiUrl: string,
  votes: Vote[],
  token?: string,
) => {
  const url = `${apiUrl}/vote`;
  if (!token || usernameExistsInToken(token)) {
    throw new Error(`User not authenticated`);
  }
  const body = new Uint8Array(Votes.encode(Votes.create({ votes })).finish());
  const response = await fetch(url, {
    method: "PUT",
    body,
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 200) {
    return;
  }
  throwStatusError(response.status, await response.text());
};

export const createPost = async (
  apiUrl: string,
  createPostDetails: CreatePostDetails,
  token?: string,
) => {
  const url = `${apiUrl}/post`;
  if (!token || usernameExistsInToken(token))
    throw new Error("User Not Authenticated");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: new Uint8Array(CreatePostDetails.encode(createPostDetails).finish()),
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
    });

    return post;
  }

  throwStatusError(response.status, await response.text());
};

const makeCreatePostWithFilesBlob = async (
  details: CreatePostWithFiles,
  files: string[],
) => {
  const detailsProto = new Uint8Array(
    CreatePostWithFiles.encode(details).finish(),
  );
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
  apiCdnUrl: string,
  createPostDetails: CreatePostWithFiles,
  files: string[],
  progressCallback?: (totalBytes: number, bytesSent: number) => void,
  token?: string,
) => {
  const url = `${apiCdnUrl}/post-full`;
  if (!token || usernameExistsInToken(token))
    throw new Error("User Not Authenticated");

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
    (sent, total) => {
      if (progressCallback) progressCallback(total, sent);
    },
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
  }

  throwStatusError(response.status, new TextDecoder().decode(response.body));
};

export const reportPost = async (
  apiUrl: string,
  id: Uint8Array,
  text: string,
  token?: string,
) => {
  const body = new Uint8Array(
    PostReport.encode(
      PostReport.create({ postId: id, description: text }),
    ).finish(),
  );
  const url = `${apiUrl}/report`;
  if (token === undefined) throw new Error("User Not Authenticated");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (response.status === 200) {
    return;
  }

  throwStatusError(response.status, await response.text());
};

export const deletePost = async (
  apiUrl: string,
  id: Uint8Array,
  token?: string,
) => {
  if (!token || usernameExistsInToken(token)) {
    throw new Error("User is not signed in");
  }

  const url = `${apiUrl}/post/${ulidStringify(id)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 200) {
    return;
  }

  throwStatusError(response.status, await response.text());
};

export const getTrendingHashtags = async (apiUrl: string) => {
  const url = `${apiUrl}/hashtags`;
  const response = await fetch(url);
  if (response.status != 200) {
    return PostProtos.PostHashtags.decode(
      new Uint8Array(await response.arrayBuffer()),
    );
  }

  throwStatusError(response.status, await response.text());
};

export const getNotifications = async (apiUrl: string, token?: string) => {
  if (!token || usernameExistsInToken(token)) {
    throw new Error("User not authenticated");
  }
  const url = `${apiUrl}/notifications`;
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.status == 200) {
    return Notifications.decode(new Uint8Array(await response.arrayBuffer()));
  }

  throwStatusError(response.status, await response.text());
};

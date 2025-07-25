// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.7.0
//   protoc               v6.31.1
// source: user.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { File, PostBody } from "./post";

export const protobufPackage = "lupyd.user";

export interface BoolValue {
  val: boolean;
}

export interface FullUser {
  uname: string;
  bio: Uint8Array;
  followers: number;
  settings: number;
  uid: string;
  credits: number;
}

export interface FullUserWithProfile {
  user: FullUser | undefined;
  pfp: File | undefined;
}

export interface FullUsers {
  users: FullUser[];
}

export interface Users {
  users: User[];
}

export interface UpdateUserInfo {
  bio: PostBody | undefined;
  settings: number;
}

export interface User {
  uname: string;
  bio: Uint8Array;
  settings: number;
  followers: number;
}

export interface Relation {
  uname: string;
  /** true follows, false blocked */
  relation: boolean;
}

export interface Relations {
  relations: Relation[];
}

function createBaseBoolValue(): BoolValue {
  return { val: false };
}

export const BoolValue: MessageFns<BoolValue> = {
  encode(message: BoolValue, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.val !== false) {
      writer.uint32(8).bool(message.val);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): BoolValue {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBoolValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 8) {
            break;
          }

          message.val = reader.bool();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BoolValue {
    return { val: isSet(object.val) ? globalThis.Boolean(object.val) : false };
  },

  toJSON(message: BoolValue): unknown {
    const obj: any = {};
    if (message.val !== false) {
      obj.val = message.val;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BoolValue>, I>>(base?: I): BoolValue {
    return BoolValue.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BoolValue>, I>>(object: I): BoolValue {
    const message = createBaseBoolValue();
    message.val = object.val ?? false;
    return message;
  },
};

function createBaseFullUser(): FullUser {
  return { uname: "", bio: new Uint8Array(0), followers: 0, settings: 0, uid: "", credits: 0 };
}

export const FullUser: MessageFns<FullUser> = {
  encode(message: FullUser, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.uname !== "") {
      writer.uint32(10).string(message.uname);
    }
    if (message.bio.length !== 0) {
      writer.uint32(18).bytes(message.bio);
    }
    if (message.followers !== 0) {
      writer.uint32(24).int32(message.followers);
    }
    if (message.settings !== 0) {
      writer.uint32(32).int32(message.settings);
    }
    if (message.uid !== "") {
      writer.uint32(42).string(message.uid);
    }
    if (message.credits !== 0) {
      writer.uint32(53).float(message.credits);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): FullUser {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFullUser();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.uname = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.bio = reader.bytes();
          continue;
        }
        case 3: {
          if (tag !== 24) {
            break;
          }

          message.followers = reader.int32();
          continue;
        }
        case 4: {
          if (tag !== 32) {
            break;
          }

          message.settings = reader.int32();
          continue;
        }
        case 5: {
          if (tag !== 42) {
            break;
          }

          message.uid = reader.string();
          continue;
        }
        case 6: {
          if (tag !== 53) {
            break;
          }

          message.credits = reader.float();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FullUser {
    return {
      uname: isSet(object.uname) ? globalThis.String(object.uname) : "",
      bio: isSet(object.bio) ? bytesFromBase64(object.bio) : new Uint8Array(0),
      followers: isSet(object.followers) ? globalThis.Number(object.followers) : 0,
      settings: isSet(object.settings) ? globalThis.Number(object.settings) : 0,
      uid: isSet(object.uid) ? globalThis.String(object.uid) : "",
      credits: isSet(object.credits) ? globalThis.Number(object.credits) : 0,
    };
  },

  toJSON(message: FullUser): unknown {
    const obj: any = {};
    if (message.uname !== "") {
      obj.uname = message.uname;
    }
    if (message.bio.length !== 0) {
      obj.bio = base64FromBytes(message.bio);
    }
    if (message.followers !== 0) {
      obj.followers = Math.round(message.followers);
    }
    if (message.settings !== 0) {
      obj.settings = Math.round(message.settings);
    }
    if (message.uid !== "") {
      obj.uid = message.uid;
    }
    if (message.credits !== 0) {
      obj.credits = message.credits;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FullUser>, I>>(base?: I): FullUser {
    return FullUser.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FullUser>, I>>(object: I): FullUser {
    const message = createBaseFullUser();
    message.uname = object.uname ?? "";
    message.bio = object.bio ?? new Uint8Array(0);
    message.followers = object.followers ?? 0;
    message.settings = object.settings ?? 0;
    message.uid = object.uid ?? "";
    message.credits = object.credits ?? 0;
    return message;
  },
};

function createBaseFullUserWithProfile(): FullUserWithProfile {
  return { user: undefined, pfp: undefined };
}

export const FullUserWithProfile: MessageFns<FullUserWithProfile> = {
  encode(message: FullUserWithProfile, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.user !== undefined) {
      FullUser.encode(message.user, writer.uint32(10).fork()).join();
    }
    if (message.pfp !== undefined) {
      File.encode(message.pfp, writer.uint32(18).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): FullUserWithProfile {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFullUserWithProfile();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.user = FullUser.decode(reader, reader.uint32());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.pfp = File.decode(reader, reader.uint32());
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FullUserWithProfile {
    return {
      user: isSet(object.user) ? FullUser.fromJSON(object.user) : undefined,
      pfp: isSet(object.pfp) ? File.fromJSON(object.pfp) : undefined,
    };
  },

  toJSON(message: FullUserWithProfile): unknown {
    const obj: any = {};
    if (message.user !== undefined) {
      obj.user = FullUser.toJSON(message.user);
    }
    if (message.pfp !== undefined) {
      obj.pfp = File.toJSON(message.pfp);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FullUserWithProfile>, I>>(base?: I): FullUserWithProfile {
    return FullUserWithProfile.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FullUserWithProfile>, I>>(object: I): FullUserWithProfile {
    const message = createBaseFullUserWithProfile();
    message.user = (object.user !== undefined && object.user !== null) ? FullUser.fromPartial(object.user) : undefined;
    message.pfp = (object.pfp !== undefined && object.pfp !== null) ? File.fromPartial(object.pfp) : undefined;
    return message;
  },
};

function createBaseFullUsers(): FullUsers {
  return { users: [] };
}

export const FullUsers: MessageFns<FullUsers> = {
  encode(message: FullUsers, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.users) {
      FullUser.encode(v!, writer.uint32(10).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): FullUsers {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFullUsers();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.users.push(FullUser.decode(reader, reader.uint32()));
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FullUsers {
    return { users: globalThis.Array.isArray(object?.users) ? object.users.map((e: any) => FullUser.fromJSON(e)) : [] };
  },

  toJSON(message: FullUsers): unknown {
    const obj: any = {};
    if (message.users?.length) {
      obj.users = message.users.map((e) => FullUser.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FullUsers>, I>>(base?: I): FullUsers {
    return FullUsers.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FullUsers>, I>>(object: I): FullUsers {
    const message = createBaseFullUsers();
    message.users = object.users?.map((e) => FullUser.fromPartial(e)) || [];
    return message;
  },
};

function createBaseUsers(): Users {
  return { users: [] };
}

export const Users: MessageFns<Users> = {
  encode(message: Users, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.users) {
      User.encode(v!, writer.uint32(10).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Users {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUsers();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.users.push(User.decode(reader, reader.uint32()));
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Users {
    return { users: globalThis.Array.isArray(object?.users) ? object.users.map((e: any) => User.fromJSON(e)) : [] };
  },

  toJSON(message: Users): unknown {
    const obj: any = {};
    if (message.users?.length) {
      obj.users = message.users.map((e) => User.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Users>, I>>(base?: I): Users {
    return Users.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Users>, I>>(object: I): Users {
    const message = createBaseUsers();
    message.users = object.users?.map((e) => User.fromPartial(e)) || [];
    return message;
  },
};

function createBaseUpdateUserInfo(): UpdateUserInfo {
  return { bio: undefined, settings: 0 };
}

export const UpdateUserInfo: MessageFns<UpdateUserInfo> = {
  encode(message: UpdateUserInfo, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.bio !== undefined) {
      PostBody.encode(message.bio, writer.uint32(10).fork()).join();
    }
    if (message.settings !== 0) {
      writer.uint32(32).int32(message.settings);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): UpdateUserInfo {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateUserInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.bio = PostBody.decode(reader, reader.uint32());
          continue;
        }
        case 4: {
          if (tag !== 32) {
            break;
          }

          message.settings = reader.int32();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UpdateUserInfo {
    return {
      bio: isSet(object.bio) ? PostBody.fromJSON(object.bio) : undefined,
      settings: isSet(object.settings) ? globalThis.Number(object.settings) : 0,
    };
  },

  toJSON(message: UpdateUserInfo): unknown {
    const obj: any = {};
    if (message.bio !== undefined) {
      obj.bio = PostBody.toJSON(message.bio);
    }
    if (message.settings !== 0) {
      obj.settings = Math.round(message.settings);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<UpdateUserInfo>, I>>(base?: I): UpdateUserInfo {
    return UpdateUserInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<UpdateUserInfo>, I>>(object: I): UpdateUserInfo {
    const message = createBaseUpdateUserInfo();
    message.bio = (object.bio !== undefined && object.bio !== null) ? PostBody.fromPartial(object.bio) : undefined;
    message.settings = object.settings ?? 0;
    return message;
  },
};

function createBaseUser(): User {
  return { uname: "", bio: new Uint8Array(0), settings: 0, followers: 0 };
}

export const User: MessageFns<User> = {
  encode(message: User, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.uname !== "") {
      writer.uint32(10).string(message.uname);
    }
    if (message.bio.length !== 0) {
      writer.uint32(18).bytes(message.bio);
    }
    if (message.settings !== 0) {
      writer.uint32(24).int32(message.settings);
    }
    if (message.followers !== 0) {
      writer.uint32(32).int32(message.followers);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): User {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUser();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.uname = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.bio = reader.bytes();
          continue;
        }
        case 3: {
          if (tag !== 24) {
            break;
          }

          message.settings = reader.int32();
          continue;
        }
        case 4: {
          if (tag !== 32) {
            break;
          }

          message.followers = reader.int32();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): User {
    return {
      uname: isSet(object.uname) ? globalThis.String(object.uname) : "",
      bio: isSet(object.bio) ? bytesFromBase64(object.bio) : new Uint8Array(0),
      settings: isSet(object.settings) ? globalThis.Number(object.settings) : 0,
      followers: isSet(object.followers) ? globalThis.Number(object.followers) : 0,
    };
  },

  toJSON(message: User): unknown {
    const obj: any = {};
    if (message.uname !== "") {
      obj.uname = message.uname;
    }
    if (message.bio.length !== 0) {
      obj.bio = base64FromBytes(message.bio);
    }
    if (message.settings !== 0) {
      obj.settings = Math.round(message.settings);
    }
    if (message.followers !== 0) {
      obj.followers = Math.round(message.followers);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<User>, I>>(base?: I): User {
    return User.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<User>, I>>(object: I): User {
    const message = createBaseUser();
    message.uname = object.uname ?? "";
    message.bio = object.bio ?? new Uint8Array(0);
    message.settings = object.settings ?? 0;
    message.followers = object.followers ?? 0;
    return message;
  },
};

function createBaseRelation(): Relation {
  return { uname: "", relation: false };
}

export const Relation: MessageFns<Relation> = {
  encode(message: Relation, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.uname !== "") {
      writer.uint32(10).string(message.uname);
    }
    if (message.relation !== false) {
      writer.uint32(16).bool(message.relation);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Relation {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRelation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.uname = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 16) {
            break;
          }

          message.relation = reader.bool();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Relation {
    return {
      uname: isSet(object.uname) ? globalThis.String(object.uname) : "",
      relation: isSet(object.relation) ? globalThis.Boolean(object.relation) : false,
    };
  },

  toJSON(message: Relation): unknown {
    const obj: any = {};
    if (message.uname !== "") {
      obj.uname = message.uname;
    }
    if (message.relation !== false) {
      obj.relation = message.relation;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Relation>, I>>(base?: I): Relation {
    return Relation.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Relation>, I>>(object: I): Relation {
    const message = createBaseRelation();
    message.uname = object.uname ?? "";
    message.relation = object.relation ?? false;
    return message;
  },
};

function createBaseRelations(): Relations {
  return { relations: [] };
}

export const Relations: MessageFns<Relations> = {
  encode(message: Relations, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.relations) {
      Relation.encode(v!, writer.uint32(10).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Relations {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRelations();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.relations.push(Relation.decode(reader, reader.uint32()));
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Relations {
    return {
      relations: globalThis.Array.isArray(object?.relations)
        ? object.relations.map((e: any) => Relation.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Relations): unknown {
    const obj: any = {};
    if (message.relations?.length) {
      obj.relations = message.relations.map((e) => Relation.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Relations>, I>>(base?: I): Relations {
    return Relations.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Relations>, I>>(object: I): Relations {
    const message = createBaseRelations();
    message.relations = object.relations?.map((e) => Relation.fromPartial(e)) || [];
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  const bin = globalThis.atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; ++i) {
    arr[i] = bin.charCodeAt(i);
  }
  return arr;
}

function base64FromBytes(arr: Uint8Array): string {
  const bin: string[] = [];
  arr.forEach((byte) => {
    bin.push(globalThis.String.fromCharCode(byte));
  });
  return globalThis.btoa(bin.join(""));
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | bigint | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
  fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}

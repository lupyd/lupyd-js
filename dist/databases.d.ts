import { IDBPDatabase } from "idb";
export declare const CHAT_DB_NAME = "chats";
export declare const CHAT_DB_STORE_NAME = "defaultChatMessages";
export declare const CHAT_DB_VERSION = 1;
export declare const LOCAL_DB_NAME = "local";
export declare const LOCAL_DB_VERSION = 5;
export declare const VOTES_DB_STORE_NAME = "votes";
export declare const SEARCH_DB_STORE_NAME = "search";
export declare const POSTS_DB_STORE_NAME = "posts";
export declare class LupydDatabasesElement extends HTMLElement {
    loadingError?: Error;
    chatDb?: IDBPDatabase;
    localDb?: IDBPDatabase;
    constructor();
    openDatabases(): Promise<void>;
    isLoaded(): boolean;
    waitTillDatabasesOpen(): Promise<unknown>;
    clearDatabases(): Promise<void>;
}
export declare function clearEverything(): Promise<void>;

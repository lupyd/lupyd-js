import { Ulid } from "id128";
import { IDBPDatabase, openDB, deleteDB } from "idb";
import store from "store2";

export const CHAT_DB_NAME = "chats";
export const CHAT_DB_STORE_NAME = "defaultChatMessages";
export const CHAT_DB_VERSION = 1;

export const LOCAL_DB_NAME = "local";
export const LOCAL_DB_VERSION = 5;
export const VOTES_DB_STORE_NAME = "votes";
export const SEARCH_DB_STORE_NAME = "search";
export const POSTS_DB_STORE_NAME = "posts";

export class LupydDatabasesElement extends HTMLElement {
  loadingError?: Error;
  chatDb?: IDBPDatabase;
  localDb?: IDBPDatabase;

  constructor() {
    super();
    this.openDatabases();
  }

  async openDatabases() {
    try {
      this.chatDb = await openDB(CHAT_DB_NAME, CHAT_DB_VERSION, {
        blocked(currentVersion, blockedVersion, event) {
          console.error(
            `blocked db open cV: ${currentVersion} bV: ${blockedVersion}`,
            event,
          );
        },
        upgrade(database, oldVersion, newVersion, transaction, event) {
          console.log(
            `upgrade `,
            database,
            ` oldVersion: ${oldVersion} newVersion: ${newVersion} transaction: `,
            transaction,
            ` event `,
            event,
          );
          const store = database.createObjectStore(CHAT_DB_STORE_NAME, {
            keyPath: "msgId",
          });
          store.createIndex("other", "other");
        },
        blocking(currentVersion, blockedVersion, event) {
          console.warn(
            `blocking db cv: ${currentVersion} bv: ${blockedVersion} `,
            event,
          );
        },
        terminated() {
          console.log(`Terminated db chats`);
        },
      });

      this.localDb = await openDB(LOCAL_DB_NAME, LOCAL_DB_VERSION, {
        blocked(currentVersion, blockedVersion, event) {
          console.error(
            `blocked db open cV: ${currentVersion} bV: ${blockedVersion}`,
            event,
          );
        },
        upgrade(database, oldVersion, newVersion, transaction, event) {
          console.log(
            `upgrade `,
            database,
            ` oldVersion: ${oldVersion} newVersion: ${newVersion} transaction: `,
            transaction,
            ` event `,
            event,
          );

          for (const store of Array.from(database.objectStoreNames)) {
            database.deleteObjectStore(store);
          }

          const searchStore = database.createObjectStore(SEARCH_DB_STORE_NAME);
          const votesStore = database.createObjectStore(VOTES_DB_STORE_NAME);
          const postsStore = database.createObjectStore(POSTS_DB_STORE_NAME);

          postsStore.createIndex("userIndex", "by");
        },
        blocking(currentVersion, blockedVersion, event) {
          console.warn(
            `blocking db cv: ${currentVersion} bv: ${blockedVersion} `,
            event,
          );
        },
        terminated() {
          console.log(`Terminated local database`);
        },
      });

      this.dispatchEvent(new CustomEvent("DatabasesOpened"));
    } catch (err: any) {
      this.dispatchEvent(new CustomEvent("error", { detail: err }));
      this.loadingError = err;
    }

    if (this.localDb) {
      const tx = this.localDb.transaction(POSTS_DB_STORE_NAME, "readwrite");
      const oldTime = new Date();
      oldTime.setDate(oldTime.getDate() - 7);

      const oldKey = Ulid.generate({ time: oldTime }).toCanonical();

      for await (const postId of tx.store) {
        if (postId.key && postId.key.toString() < oldKey) {
          await tx.store.delete(postId.key);
        } else {
          break;
        }
      }

      await tx.done;
    }
  }

  isLoaded() {
    return this.chatDb != null && this.localDb != null;
  }

  waitTillDatabasesOpen() {
    if (this.loadingError) {
      throw this.loadingError;
    }
    if (this.isLoaded()) {
      return;
    }
    return new Promise((res, rej) => {
      this.addEventListener("DatabasesOpened", (_) => {
        res(0);
      });
      this.addEventListener("error", (err) => rej(err));
    });
  }

  async clearDatabases() {
    if (this.chatDb) await clearDatabase(this.chatDb!);
    if (this.localDb) await clearDatabase(this.localDb!);
  }
}

async function clearDatabase(db: IDBPDatabase) {
  for (const storeName in db.objectStoreNames) {
    await db.clear(storeName);
  }
}

export async function clearEverything() {
  store.clearAll();
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name) {
      await deleteDB(db.name);
    }
  }
}

customElements.define("lupyd-databases", LupydDatabasesElement);

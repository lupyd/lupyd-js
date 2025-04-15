import { initializeApp, FirebaseApp } from "firebase/app";
import {
  User,
  browserLocalPersistence,
  connectAuthEmulator,
  initializeAuth,
  onAuthStateChanged,
  Auth as FirebaseAuth,
} from "firebase/auth";
import van from "vanjs-core";
import { AuthHandler } from "./auth";
import { getUserData } from "../doc/user";
import store from "store2";
import "../constants";
import {
  API_CDN_URL,
  API_URL,
  CDN_STORAGE,
  CREATE_USER_CHAT_FUNC_URL,
  CREATE_USER_FUNC_URL,
  DEFAULT_USER_ICON,
  FIREBASE_CONFIG,
  FIRESTORE_BASE_URL,
  LUPYD_VERSION,
  MAX_TOTAL_FILES_SIZE,
  MOBILE_MAX_WIDTH_PX,
} from "../constants";

export const FUNCTIONS_REGION = "asia-south1";

// A Singleton Model designed by the Modern Web Standard

export class LupydFirebaseElement extends HTMLElement {
  app: FirebaseApp;
  auth: FirebaseAuth;
  currentUser = van.state<User | null>(null);
  currentUsername = van.state<string | null>(null);
  constants = {
    MAX_TOTAL_FILES_SIZE,
    DEFAULT_USER_ICON,
    API_URL,
    API_CDN_URL,
    CDN_STORAGE,
    CREATE_USER_FUNC_URL,
    FIRESTORE_BASE_URL,
    MOBILE_MAX_WIDTH_PX,
    CREATE_USER_CHAT_FUNC_URL,
    LUPYD_VERSION,
    FIREBASE_CONFIG,
  };

  constructor() {
    super();
    this.app = initializeApp(FIREBASE_CONFIG);
    this.auth = initializeAuth(this.app, {
      persistence: browserLocalPersistence,
    });
    this.initializeAuth();
    if (process.env.JS_ENV_EMULATOR_MODE == "true") {
      connectAuthEmulator(this.auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });

      console.log("Using Firebase Auth emulator");

      import("firebase/database").then(
        ({ connectDatabaseEmulator, getDatabase }) => {
          connectDatabaseEmulator(getDatabase(this.app), "127.0.0.1", 9000);
          console.log("Using firebase database emulator");
        },
      );
    }
  }

  initializeAuth() {
    onAuthStateChanged(this.auth, (user) => {
      console.log(`Auth State Changed: `, user);
      this.currentUser.val = user;
      if (user) {
        if (user.email) {
          store.set("email", user.email);
        }
        AuthHandler.getUsername(user).then((username) => {
          if (username) {
            getUserData().then(console.log).catch(console.error);
            store.set("username", username);
            this.currentUsername.val = username;
          }
        });
      }
    });
  }

  // get authMod() {
  //   return import("firebase/auth")
  // }
}

customElements.define("lupyd-firebase", LupydFirebaseElement);

export const fbElement = () =>
  document.querySelector("lupyd-firebase") as LupydFirebaseElement;

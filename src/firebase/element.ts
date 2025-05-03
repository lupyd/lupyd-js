"use client";

import { initializeApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import {
  User,
  browserLocalPersistence,
  connectAuthEmulator,
  initializeAuth,
  onAuthStateChanged,
  Auth as FirebaseAuth,
} from "firebase/auth";
import { AuthHandler } from "./auth";
import { getUserData } from "../doc/user";
const store = require("store2");
import "../constants";
import van, { State } from "vanjs-core";
import {
  API_CDN_URL,
  API_URL,
  CDN_STORAGE,
  CREATE_USER_CHAT_FUNC_URL,
  CREATE_USER_FUNC_URL,
  DEFAULT_USER_ICON,
  FIRESTORE_BASE_URL,
  LUPYD_VERSION,
  MAX_TOTAL_FILES_SIZE,
  MOBILE_MAX_WIDTH_PX,
} from "../constants";

export const FUNCTIONS_REGION = "asia-south1";

// A Singleton Model designed by the Modern Web Standard
//
export class LupydFirebaseElement {
  app: FirebaseApp;
  auth: FirebaseAuth;
  currentUser: State<User | null> = van.state(null);
  currentUsername: State<string | null> = van.state(null);
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
  };

  onAuthStateChange: (username: string, user: User) => void;

  constructor(
    config: FirebaseOptions,
    onAuthStateChange: (username: string, user: User) => void = (_, __) => {},
  ) {
    this.onAuthStateChange = onAuthStateChange;
    this.app = initializeApp(config);
    this.auth = initializeAuth(this.app, {
      persistence: browserLocalPersistence,
    });
    if (process.env.NEXT_PUBLIC_JS_ENV_EMULATOR_MODE == "true") {
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

  setOnAuthStateChangeCallback(
    onAuthStateChange: (username: string, user: User) => void,
  ) {
    this.onAuthStateChange = onAuthStateChange;
  }

  initializeAuth() {
    onAuthStateChanged(this.auth, (user) => {
      console.log(`Auth State Changed: `, user);
      this.currentUser.val = user;
      if (user) {
        if (user.email) {
          store.set("email", user.email);
        }
        AuthHandler.getUsername(user)
          .then((username) => {
            if (username) {
              getUserData().then(console.log).catch(console.error);
              store.set("username", username);
              this.currentUsername.val = username;
              this.onAuthStateChange(username, user);
            } else {
              this.onAuthStateChange(null, user);
            }
          })
          .catch((err) => {
            console.error(err);
            this.onAuthStateChange(null, user);
          });
      } else {
        this.onAuthStateChange(null, null);
      }
    });
  }
}

let _fbElement: LupydFirebaseElement | undefined = undefined;

export const fbElement = () => {
  if (typeof window === "undefined") return undefined;
  if (!_fbElement) {
    if (process.env.NEXT_PUBLIC_JS_ENV_FIREBASE_CONFIG) {
      const config = JSON.parse(
        atob(process.env.NEXT_PUBLIC_JS_ENV_FIREBASE_CONFIG),
      );
      console.log(`Using FB config `, config);
      _fbElement = new LupydFirebaseElement(config);
    }
  }

  return _fbElement;
};

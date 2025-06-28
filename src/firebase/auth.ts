import {
  EmailAuthProvider,
  signOut as FBSignOut,
  User,
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  linkWithCredential,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  sendPasswordResetEmail,
  updatePassword,
  confirmPasswordReset,
  type ActionCodeSettings,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
// import store from "store2";

const store = require("store2");

import { FullUser } from "../protos/user";
import { fbElement } from "./element";
// import { clearEverything } from "../databases";
import { API_CDN_URL, CREATE_USER_FUNC_URL } from "../constants";

const clearEverything = async () =>
  console.error("Local Databases are not implemented");

export namespace AuthHandler {
  export async function deleteAccount() {
    const user = currentUser().val;
    if (user) {
      await user.delete();
    }
    await clearEverything();
  }

  export async function createUser(email: string, password: string) {
    const auth = getAuth();
    return createUserWithEmailAndPassword(auth, email, password);
  }

  export function currentUser() {
    return fbElement().currentUser;
  }

  export function currentUsername() {
    return fbElement().currentUsername;
  }

  export function getAuth() {
    return fbElement().auth;
  }
  export async function sendVerificationMail(user: User) {
    return sendEmailVerification(user, {
      handleCodeInApp: true,
      // dynamicLinkDomain: `${window.location.origin}/m/signin`,
      url: `${window.location.origin}/action`,
    });
  }

  export async function signIn(email: string, link: string) {
    const auth = getAuth();
    if (isSignInWithEmailLink(auth, link)) {
      const creds = await signInWithEmailLink(auth, email, link);
      const user = creds.user;
      console.log("Signed in with link", user);
      return user;
    } else {
      throw new Error(`Invalid Email Link ${link}`);
    }
  }
  export async function sendSignInLink(
    email: string,
    thirdPartyDynamicLink?: string,
  ) {
    {
      // const dynamicLinkDomain = `${window.location.origin}/m/action${thirdPartyDynamicLink === undefined ? "" : `?tpdl=${thirdPartyDynamicLink}`}`;
      const url = `${window.location.origin}/action`;
      const settings: ActionCodeSettings = {
        handleCodeInApp: true,
        // dynamicLinkDomain,
        url,
      };
      console.debug(`ActionCodeSettings `, settings);
      await sendSignInLinkToEmail(getAuth(), email, settings);
      console.log("Sent Email to ", email);
      store.set("email", email);
    }
  }

  export async function signOut() {
    await FBSignOut(getAuth());
    console.log("User Sign out successful");
    clearEverything();
  }

  export async function signUp(
    user: FullUser,
    pfpUrl: string | undefined = undefined,
  ) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      const cUsername = await getUsername(currentUser);
      if (cUsername) {
        console.log("User logged in ", cUsername);
      } else {
        try {
          console.log(`Creating user ${user.uname}`);
          const token = await currentUser.getIdToken(true);
          const response = await fetch(CREATE_USER_FUNC_URL, {
            method: "POST",
            body: FullUser.encode(user).finish(),
            headers: {
              authorization: `Bearer ${token}`,
              "content-type": "application/protobuf; proto=lupyd.user.FullUser",
            },
          });
          if (response.status == 200) {
            const result = await currentUser.getIdTokenResult(true);
            await currentUser.reload();
            console.log(`Succesful sign up `, result);
            AuthHandler.currentUser().val = auth.currentUser;

            const finalUsername = await getUsername(auth.currentUser);
            fbElement().onAuthStateChange(finalUsername, auth.currentUser);

            if (pfpUrl) {
              try {
                const pfpResponse = await fetch(pfpUrl);
                if (pfpResponse.body && pfpResponse.status === 200) {
                  const blob = await pfpResponse.blob();
                  const response = await fetch(`${API_CDN_URL}/user`, {
                    method: "PUT",
                    body: blob,
                    headers: {
                      authorization: `Bearer ${result.token}`,
                      "content-type":
                        pfpResponse.headers.get("content-type") ?? "image/webp",
                    },
                  });
                  const etag = await response.text();
                  console.log({ etag, status: response.status });
                }
              } catch (err) {
                console.error(err);
              }
            }
          } else {
            const error = await response.text();
            console.error(`[${response.status}] ${error}`);
            throw error;
          }
        } catch (err) {
          console.error("Failed to Create User: ", err);
          throw err;
        }
      }
    } else {
      throw new Error("No Current User");
    }
  }

  export async function getToken(forceRefresh?: boolean) {
    return currentUser().val?.getIdToken(forceRefresh);
  }

  export async function getUsername(currentUser: User | null = null) {
    if (!currentUser) {
      currentUser = getAuth().currentUser;
    }
    if (!currentUser) {
      return null;
    }
    const tokenResult = await getAuth().currentUser!.getIdTokenResult();
    const uname = tokenResult.claims["uname"] as string | undefined;
    return uname ?? null;
  }

  export async function linkPassword(password: string) {
    const user = getAuth().currentUser;
    if (!user || !user.email || !user.emailVerified) {
      throw new Error(`User not authenticated ${user?.toJSON()} `);
    }

    // if (!(await validatePassword(getAuth(), password)).isValid) {
    //   throw new Error(`Password is Invalid`);
    // }
    const cred = EmailAuthProvider.credential(user.email, password);
    const result = await linkWithCredential(user, cred);
    console.log(`User password linked `, result);
  }

  export async function sendResetPasswordMail(email: string) {
    const settings: ActionCodeSettings = {
      handleCodeInApp: true,
      // dynamicLinkDomain: `${window.location.origin}/m/signin`,
      url: `${window.location.origin}/action?email=${email}`,
    };
    await sendPasswordResetEmail(getAuth(), email, settings);
  }

  export async function changePassword(newPassword: string) {
    const user = getAuth().currentUser;
    if (user) {
      await updatePassword(user, newPassword);
    }
  }

  export async function confirmResettingPassword(
    newPassword: string,
    oobCode: string,
  ) {
    await confirmPasswordReset(getAuth(), oobCode, newPassword);
  }

  export async function signInWithPassword(email: string, password: string) {
    await signInWithEmailAndPassword(getAuth(), email, password);
  }

  export async function changeEmail(newEmail: string) {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error("User is null");
    }

    await verifyBeforeUpdateEmail(user, newEmail, {
      handleCodeInApp: true,
      url: `${window.location.origin}`,
    });

    return user.email;
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHandler = void 0;
const auth_1 = require("firebase/auth");
// import store from "store2";
const store = require("store2");
const user_1 = require("../protos/user");
const element_1 = require("./element");
// import { clearEverything } from "../databases";
const constants_1 = require("../constants");
const clearEverything = async () => console.error("Local Databases are not implemented");
var AuthHandler;
(function (AuthHandler) {
    async function deleteAccount() {
        const user = currentUser().val;
        if (user) {
            await user.delete();
        }
        await clearEverything();
    }
    AuthHandler.deleteAccount = deleteAccount;
    async function createUser(email, password) {
        const auth = getAuth();
        return (0, auth_1.createUserWithEmailAndPassword)(auth, email, password);
    }
    AuthHandler.createUser = createUser;
    function currentUser() {
        return (0, element_1.fbElement)().currentUser;
    }
    AuthHandler.currentUser = currentUser;
    function currentUsername() {
        return (0, element_1.fbElement)().currentUsername;
    }
    AuthHandler.currentUsername = currentUsername;
    function getAuth() {
        return (0, element_1.fbElement)().auth;
    }
    AuthHandler.getAuth = getAuth;
    async function sendVerificationMail(user) {
        return (0, auth_1.sendEmailVerification)(user, {
            handleCodeInApp: true,
            // dynamicLinkDomain: `${window.location.origin}/m/signin`,
            url: `${window.location.origin}/action`,
        });
    }
    AuthHandler.sendVerificationMail = sendVerificationMail;
    async function signIn(email, link) {
        const auth = getAuth();
        if ((0, auth_1.isSignInWithEmailLink)(auth, link)) {
            const creds = await (0, auth_1.signInWithEmailLink)(auth, email, link);
            const user = creds.user;
            console.log("Signed in with link", user);
            return user;
        }
        else {
            throw new Error(`Invalid Email Link ${link}`);
        }
    }
    AuthHandler.signIn = signIn;
    async function sendSignInLink(email, thirdPartyDynamicLink) {
        {
            // const dynamicLinkDomain = `${window.location.origin}/m/action${thirdPartyDynamicLink === undefined ? "" : `?tpdl=${thirdPartyDynamicLink}`}`;
            const url = `${window.location.origin}/action`;
            const settings = {
                handleCodeInApp: true,
                // dynamicLinkDomain,
                url,
            };
            console.debug(`ActionCodeSettings `, settings);
            await (0, auth_1.sendSignInLinkToEmail)(getAuth(), email, settings);
            console.log("Sent Email to ", email);
            store.set("email", email);
        }
    }
    AuthHandler.sendSignInLink = sendSignInLink;
    async function signOut() {
        await (0, auth_1.signOut)(getAuth());
        console.log("User Sign out successful");
        clearEverything();
    }
    AuthHandler.signOut = signOut;
    async function signUp(user, pfpUrl = undefined) {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
            const cUsername = await getUsername(currentUser);
            if (cUsername) {
                console.log("User logged in ", cUsername);
            }
            else {
                try {
                    console.log(`Creating user ${user.uname}`);
                    const token = await currentUser.getIdToken(true);
                    const response = await fetch(constants_1.CREATE_USER_FUNC_URL, {
                        method: "POST",
                        body: user_1.FullUser.encode(user).finish(),
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
                        (0, element_1.fbElement)().onAuthStateChange(finalUsername, auth.currentUser);
                        if (pfpUrl) {
                            try {
                                const pfpResponse = await fetch(pfpUrl);
                                if (pfpResponse.body && pfpResponse.status === 200) {
                                    const blob = await pfpResponse.blob();
                                    const response = await fetch(`${constants_1.API_CDN_URL}/user`, {
                                        method: "PUT",
                                        body: blob,
                                        headers: {
                                            authorization: `Bearer ${result.token}`,
                                            "content-type": pfpResponse.headers.get("content-type") ?? "image/webp",
                                        },
                                    });
                                    const etag = await response.text();
                                    console.log({ etag, status: response.status });
                                }
                            }
                            catch (err) {
                                console.error(err);
                            }
                        }
                    }
                    else {
                        const error = await response.text();
                        console.error(`[${response.status}] ${error}`);
                        throw error;
                    }
                }
                catch (err) {
                    console.error("Failed to Create User: ", err);
                    throw err;
                }
            }
        }
        else {
            throw new Error("No Current User");
        }
    }
    AuthHandler.signUp = signUp;
    async function getToken(forceRefresh) {
        return currentUser().val?.getIdToken(forceRefresh);
    }
    AuthHandler.getToken = getToken;
    async function getUsername(currentUser = null) {
        if (!currentUser) {
            currentUser = getAuth().currentUser;
        }
        if (!currentUser) {
            return null;
        }
        const tokenResult = await getAuth().currentUser.getIdTokenResult();
        const uname = tokenResult.claims["uname"];
        return uname ?? null;
    }
    AuthHandler.getUsername = getUsername;
    async function linkPassword(password) {
        const user = getAuth().currentUser;
        if (!user || !user.email || !user.emailVerified) {
            throw new Error(`User not authenticated ${user?.toJSON()} `);
        }
        // if (!(await validatePassword(getAuth(), password)).isValid) {
        //   throw new Error(`Password is Invalid`);
        // }
        const cred = auth_1.EmailAuthProvider.credential(user.email, password);
        const result = await (0, auth_1.linkWithCredential)(user, cred);
        console.log(`User password linked `, result);
    }
    AuthHandler.linkPassword = linkPassword;
    async function sendResetPasswordMail(email) {
        const settings = {
            handleCodeInApp: true,
            // dynamicLinkDomain: `${window.location.origin}/m/signin`,
            url: `${window.location.origin}/action?email=${email}`,
        };
        await (0, auth_1.sendPasswordResetEmail)(getAuth(), email, settings);
    }
    AuthHandler.sendResetPasswordMail = sendResetPasswordMail;
    async function changePassword(newPassword) {
        const user = getAuth().currentUser;
        if (user) {
            await (0, auth_1.updatePassword)(user, newPassword);
        }
    }
    AuthHandler.changePassword = changePassword;
    async function confirmResettingPassword(newPassword, oobCode) {
        await (0, auth_1.confirmPasswordReset)(getAuth(), oobCode, newPassword);
    }
    AuthHandler.confirmResettingPassword = confirmResettingPassword;
    async function signInWithPassword(email, password) {
        await (0, auth_1.signInWithEmailAndPassword)(getAuth(), email, password);
    }
    AuthHandler.signInWithPassword = signInWithPassword;
    async function changeEmail(newEmail) {
        const user = getAuth().currentUser;
        if (!user) {
            throw new Error("User is null");
        }
        await (0, auth_1.verifyBeforeUpdateEmail)(user, newEmail, {
            handleCodeInApp: true,
            url: `${window.location.origin}`,
        });
        return user.email;
    }
    AuthHandler.changeEmail = changeEmail;
})(AuthHandler || (exports.AuthHandler = AuthHandler = {}));

import { ENDPOINT } from "./constants"
import { NewLoginRequest, UserTokens } from "../protos/auth"
import { arrayBufferToString, base64DecodeURL, base64UrlDecode } from "../bin/utils"
import { BufferWriter } from "protobufjs/minimal";
import store from "store2";
import { FUNCTIONS_REGION, getFunctionsModule } from "../firebase/element";
import { HttpsCallableResult } from "firebase/functions";

export type LupydPermissions = bigint

const getOob = async (loginRequest: NewLoginRequest, lupydAccessToken: string): Promise<string> => {
  const response = await fetch(`${ENDPOINT}/getOob`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${lupydAccessToken}`
    },
    body: NewLoginRequest.encode(loginRequest, new BufferWriter()).finish()
  })
  return response.text();
}


export const loginThirdPartyAppWithCallbackUrl = async (loginRequest: NewLoginRequest, lupydAccessToken: string, callbackUrl: URL) => {
  const oob = await getOob(loginRequest, lupydAccessToken);
  callbackUrl.searchParams.append("oob", oob);
  window.location.href = callbackUrl.toString();
  // NOTE TEST whether it auto closes browser session or not
}


export const loginThirdPartyAppWithInBrowser = async (loginRequest: NewLoginRequest, lupydAccessToken: string, targetOrigin: string) =>  {
  const oob = await getOob(loginRequest, lupydAccessToken);
  window.postMessage({ oob }, targetOrigin);
}

export const getLupydAccessTokenFromFirebaseToken = async (fbAccessToken: string) => {
  const response = await fetch(`${ENDPOINT}/newLogin`, {
    method: "POST",
    body: fbAccessToken
  });
  const body = await response.arrayBuffer();
  const status = response.status;
  if (status == 200) {
    return UserTokens.decode(new Uint8Array(body));
  }
  console.error(`STATUS: ${status} BODY: ${arrayBufferToString(body)}`);
}


export const refreshTokens = async (refreshToken: string) => {
  const response = await fetch(`${ENDPOINT}/refresh`, {
    method: "POST",
    body: refreshToken,
  });


  const body = await response.arrayBuffer();
  const status = response.status;
  if (status == 200) {
    return UserTokens.decode(new Uint8Array(body));
  }
  console.error(`STATUS: ${status} BODY: ${arrayBufferToString(body)}`);
}


export const loginWithLink = (link: string, email: string) => {
  
}

export class LupydAuth {
  constructor() {}
  
  getAccessToken(): string | undefined {
    return store.get("lupyd_access_token")
  }

  getRefreshToken(): string | undefined {
    return store.get("lupyd_refresh_token")
  }

  async getValidAccessToken(): Promise<string> {
    const accessToken = this.getAccessToken()
    if (accessToken) {
      if (isValidAccessToken(accessToken)) {
        return accessToken
      }
    }

    return this.fetchNewAccessToken()
  }

  async fetchNewAccessToken(): Promise<string> {

    const functions = await getFunctionsModule()
    const refreshToken = this.getRefreshToken()
    const accessToken = this.getAccessToken()
    const result: HttpsCallableResult<any> = await functions.httpsCallable(functions.getFunctions(undefined, FUNCTIONS_REGION), "refreshTokens")({ refreshToken, accessToken })

    if (result.data && "access_token" in result.data && "refresh_token" in result.data) {
      store.set("lupyd_access_token", result.data.access_token)
      store.set("lupyd_refresh_token", result.data.refresh_token)

      return result.data.access_token
    }

    throw new Error(`Returned Data is invalid ${result.data}`)
  }
}


function isValidAccessToken(s: string) {
  const [_header, payload, _signature] = s.split('.')
  const obj = JSON.parse(new TextDecoder().decode(base64DecodeURL(payload)))
  if ("exp" in obj && typeof obj.exp === "number" && obj.exp < Date.now() / 1000) {
    return true;
  } else {
    return false;
  }
}

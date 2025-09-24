import { Auth0Client, createAuth0Client } from "@auth0/auth0-spa-js";
import { API_URL } from "../constants";
import { FullUser } from "../protos/user";

let instance: Auth0Handler | undefined = undefined;

export interface DecodedToken {
  uname: string | undefined;
  perms: number | undefined;
  iss: string;
  aud: string[];
  iat: number;
  exp: number;
  jtl: string;
  client_id: string;
  sub: string;
}

export class Auth0Handler {
  private client: Auth0Client;
  private onAuthStatusChangeCallback: (user: DecodedToken | undefined) => void;

  constructor(
    client: Auth0Client,
    onAuthStatusChangeCallback: (user: DecodedToken | undefined) => void,
  ) {
    this.client = client;
    this.onAuthStatusChangeCallback = onAuthStatusChangeCallback;
  }

  static async initialize(
    domain: string,
    clientId: string,
    audience: string,
    redirectUrl: string,
    onAuthStatusChangeCallback: (user: DecodedToken | undefined) => void,
  ): Promise<Auth0Handler> {
    if (instance) {
      console.error("Already initialized");

      // instance.onAuthStatusChangeCallback = onAuthStatusChangeCallback;
      return instance;
    }

    const client = await createAuth0Client({
      domain,
      clientId,
      authorizationParams: {
        audience: audience,
        redirect_uri: redirectUrl,
      },
    });

    const handler = new Auth0Handler(client, onAuthStatusChangeCallback);
    instance = handler;

    await client.checkSession();
    const isAuthenticated = await client.isAuthenticated();

    if (isAuthenticated) {
      const user = await handler.getUser();
      handler.onAuthStatusChangeCallback(user);
    } else {
      handler.onAuthStatusChangeCallback(undefined);
    }

    return handler;
  }

  async login(appState: any) {
    if (process.env.NEXT_PUBLIC_JS_ENV_EMULATOR_MODE === "true") {
      await this.client.loginWithPopup(undefined, {
        timeoutInSeconds: 60 * 10,
      });
    } else {
      await this.client.loginWithRedirect({
        appState,
        openUrl(url) {
          window.open(url);
        },
      });
    }
    const user = await this.getUser();

    this.onAuthStatusChangeCallback(user);
  }

  async getToken(forceReload = false) {
    if (!(await this.client.isAuthenticated())) {
      return undefined;
    }

    const token = await this.client.getTokenSilently({
      cacheMode: forceReload ? "off" : "on",
    });

    if (forceReload) {
      this.onAuthStatusChangeCallback(await this.getUser());
    }

    return token;
  }

  async getUser() {
    const token = await this.getToken();
    if (token) {
      return getPayloadFromAccessToken(token);
    }
  }

  async getUsername(): Promise<string | undefined> {
    const user = await this.getUser();

    if (user) {
      return "uname" in user ? user["uname"] : undefined;
    }

    return undefined;
  }

  async deleteAccount() {
    const response = await fetch(`${API_URL}/user`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${await this.getToken()}`,
      },
    });

    if (response.status == 200) {
      await this.logout();
    } else {
      throw new Error(
        `Received unexpected status code ${response.status} ${await response.text()}`,
      );
    }
  }

  async logout() {
    await this.client.logout();
    this.onAuthStatusChangeCallback(undefined);
  }

  async assignUsername(username: string) {
    if (await this.getUsername()) {
      throw Error("Username already assigned");
    }

    const response = await fetch(`${API_URL}/user`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${await this.getToken()}`,
      },
      body: new Uint8Array(
        FullUser.encode(FullUser.create({ uname: username })).finish(),
      ),
    });

    if (response.status == 201) {
      await this.getToken(true);
      return;
    }
    if (response.status == 409) {
      throw new Error(`[${response.status}] ${await response.text()}`);
    }
  }

  async handleRedirectCallback() {
    const result = await this.client.handleRedirectCallback();

    const user = await this.getUser();
    if (user) {
      this.onAuthStatusChangeCallback(user);
    }

    return result.appState;
  }
}

export const getAuthHandler = () => instance;

function getPayloadFromAccessToken(token: string): DecodedToken {
  const [_header, payload, _signature] = token.split(".");
  return JSON.parse(atob(payload)) as DecodedToken;
}

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
    clientId: string,
    audience: string,
    onAuthStatusChangeCallback: (user: DecodedToken | undefined) => void,
  ): Promise<Auth0Handler> {
    if (instance) {
      console.error("Already initialized");
      return instance;
    }

    const client = await createAuth0Client({
      domain: "auth.lupyd.com",
      clientId,
      authorizationParams: {
        audience: audience,
      },
    });

    const handler = new Auth0Handler(client, onAuthStatusChangeCallback);

    await client.checkSession();
    const isAuthenticated = await client.isAuthenticated();

    if (isAuthenticated) {
      const user = await handler.getUser();
      handler.onAuthStatusChangeCallback(user);
    } else {
      handler.onAuthStatusChangeCallback(undefined);
    }

    instance = handler;

    return handler;
  }

  async login() {
    await this.client.loginWithPopup();
    const user = await this.getUser();

    this.onAuthStatusChangeCallback(user);
  }

  async getToken(forceReload = false) {
    if (!(await this.client.getIdTokenClaims())) {
      return null;
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
    if (await this.client.isAuthenticated()) {
      return this.getToken().then(getPayloadFromAccessToken);
    }
  }

  async getUsername(): Promise<string | undefined> {
    if (await this.client.isAuthenticated()) {
      const user = await this.client.getUser();

      if (user) {
        return "uname" in user ? user["uname"] : undefined;
      }
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
      body: FullUser.encode(FullUser.create({ uname: username })).finish(),
    });

    if (response.status == 201) {
      await this.getToken(true);
      return;
    }
    if (response.status == 409) {
      throw new Error(`[${response.status}] ${await response.text()}`);
    }
  }
}

export const getAuthHandler = () => instance;

function getPayloadFromAccessToken(token: string): DecodedToken {
  const [_header, payload, _signature] = token.split(".");
  return JSON.parse(payload) as DecodedToken;
}

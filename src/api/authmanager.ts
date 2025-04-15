import { base64UrlDecode } from "../bin/utils";
import { refreshTokens } from "./authflow";

interface LupydAccessToken {
  exp: number;
  iat: number;
  uid: number;
  uname: string;
}

export class AuthManager {
  private accessToken: string;
  private refreshToken: string;
  private appId: string;
  private refreshTaskId: number = -1;

  isLoggedIn(): boolean {
    return this.getDeserializedAccessToken().exp < Date.now() / 1000;
  }

  getDeserializedAccessToken() {
    const [_header, payload, _signature] = this.accessToken.split(".");
    const token: LupydAccessToken = JSON.parse(base64UrlDecode(payload));
    return token;
  }

  async refresh() {
    console.info("Refreshing Lupyd Tokens");
    const tokens = await refreshTokens(this.refreshToken);
    if (tokens == null) {
      console.error("Failed to refresh tokens");
    } else {
      clearTimeout(this.refreshTaskId);
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;

      const duration_in_ms =
        this.getDeserializedAccessToken().exp * 1000 - Date.now() - 3_00_000;

      this.refreshTaskId = Number(
        setTimeout(() => {
          this.refresh();
        }, duration_in_ms),
      );
    }
  }
}

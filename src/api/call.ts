import { API_CDN_URL } from "../constants";
import { AuthHandler } from "../firebase/auth";

export const getWebrtcConfig = async () => {
  const url = `${API_CDN_URL}/turn`;
  {
    const username = await AuthHandler.getUsername();
    if (!username) {
      throw new Error("User not signed in");
    }
  }
  const token = await AuthHandler.getToken();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `Unexpected Response ${response.status} ${await response.text()} `,
    );
  }

  const obj = await response.json();
  const config = parseToRTCConfig(obj);
  if (!config) {
    throw new Error(`Invalid RTC Config is received ${JSON.stringify(obj)}`);
  }

  return config;
};

function parseToRTCConfig(obj: any) {
  if ("iceServers" in obj) {
    const iceServers = obj["iceServers"];
    if (
      "username" in iceServers &&
      typeof iceServers["username"] === "string" &&
      "credential" in iceServers &&
      typeof iceServers["credential"] === "string" &&
      "urls" in iceServers &&
      Array.isArray(iceServers["urls"]) &&
      iceServers["urls"].every((e) => typeof e === "string")
    ) {
      const urls = iceServers["urls"];
      const credential = iceServers["credential"];
      const username = iceServers["username"];

      const config: RTCConfiguration = {
        iceServers: [
          {
            urls,
            credential,
            username,
          },
        ],
      };

      return config;
    }
  }

  return undefined;
}

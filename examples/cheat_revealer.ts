// Using bun for it, but you can use any other package manager
import axios from "axios";

const args = process.argv.slice(2);
const steamidIndex = args.findIndex((arg) => arg === "--steamid");
const steamid = steamidIndex !== -1 ? args[steamidIndex + 1] : null;

if (!steamid) {
  console.error("Please provide a profile using --steamid flag");
  process.exit(1);
}

const { ALYX_API_KEY } = process.env;
if (!ALYX_API_KEY) {
  throw new Error("ALYX_API_KEY is not set in the environment variables");
}

const key = `Bearer ${ALYX_API_KEY}`;
const client = axios.create({
  baseURL: "https://alyx.ro/api/v1",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "api", // WARNING: This is a custom user agent, IT WILL NOT WORK WITHOUT IT
    Authorization: key,
  },
});

// Types can be updated from: https://docs.alyx.ro/types-and-constants/
interface ISteamProfile {
  steamid2: string;
  steamid3: string;
  steamid64: string;
  accountid: number;
  avatar: string;
  name: string;
  url: string;
}

interface ICheatData {
  software: string;
  detected: string;
  cache?: {
    hit: boolean;
    at: string;
  };
}

const request = async <T>(
  endpoint: string,
  params: Record<string, any>
): Promise<T | null> => {
  try {
    const { data } = await client.get(endpoint, { params });
    if (data.success) {
      return data.data as T;
    }

    if (data.error) {
      console.error(data.error);
    }

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const main = async () => {
  const steam_profile = await request<ISteamProfile>("/steam/parse", {
    steam_id: steamid,
  });

  if (!steam_profile) {
    console.error("Failed to get steam profile");
    process.exit(1);
  }

  const cheat_data = await request<ICheatData>("/revealer", {
    steam_id: steam_profile.steamid64,
  });

  if (!cheat_data) {
    return;
  }

  console.log(
    `${steam_profile.name} has been using ${
      cheat_data?.software
    } since ${new Date(cheat_data?.detected).toLocaleString()}`
  );
};

main();

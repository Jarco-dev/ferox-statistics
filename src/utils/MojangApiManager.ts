import fetch from "node-fetch";
import type Client from "../index";

class MojangApiManager {
    public logger: typeof Client.logger;
    public uuidToNameCache: { [key: string]: string };
    public nameToUuidCache: { [key: string]: string };

    constructor(client: typeof Client) {
        this.logger = client.logger;

        this.uuidToNameCache = {};
        this.nameToUuidCache = {};
    }

    public async getUuid(username: string): Promise<string | undefined> {
        if (this.nameToUuidCache[username]) {
            return this.nameToUuidCache[username];
        }

        const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
            .catch(err => this.logger.error(`Error while fetching uuid from mojang username: ${username}`, err));

        if (!res) return undefined;

        if (res.status === 200) {
            const { id } = await res.json();
            const m = (/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/).exec(id) as RegExpExecArray;
            this.nameToUuidCache[username] = `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`;
            setTimeout(() => delete this.nameToUuidCache[username], 900000);
            return this.nameToUuidCache[username];
        } else {
            return undefined;
        }
    }

    public async getUsername(uuid: string): Promise<string | undefined> {
        if (this.uuidToNameCache[uuid]) {
            return this.uuidToNameCache[uuid];
        }

        const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)
            .catch(err => this.logger.error(`Error while fetching username from mojang uuid: ${uuid}`, err));

        if (!res) return undefined;

        if (res.status === 200) {
            const profile = await res.json();
            this.uuidToNameCache[uuid] = profile.name;
            setTimeout(() => delete this.uuidToNameCache[uuid], 900000);
            return this.uuidToNameCache[uuid];
        } else {
            return undefined;
        }
    }
}

export default MojangApiManager;

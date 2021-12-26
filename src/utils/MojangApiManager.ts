import fetch from "node-fetch";
import type Client from "../index";

class MojangApiManager {
    public logger: typeof Client.logger;
    public uuidToNameCache: {[key: string]: string};
    public nameToUuidCache: {[key: string]: string};

    constructor(client: typeof Client) {
        this.logger = client.logger;

        this.uuidToNameCache = {};
        this.nameToUuidCache = {};
    }

    public async getUuid(username: string): Promise<string | undefined> {
        const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
            .catch(err => this.logger.error(`Error while fetching uuid from mojang username: ${username}`, err));

        if (!res) return undefined;

        if (res.status === 200) {
            let uuid: string;
            if(this.nameToUuidCache[username]) {
                uuid = this.nameToUuidCache[username];
            } else {
                const { id } = await res.json();
                const m = (/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/).exec(id) as RegExpExecArray;
                uuid = `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`

                this.nameToUuidCache[username] = uuid;
                setTimeout(() => delete this.nameToUuidCache[username], 900000);
            }
            return uuid;
        } else {
            return undefined;
        }
    }

    public async getUsername(uuid: string): Promise<string | undefined> {
        const res = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`)
            .catch(err => this.logger.error(`Error while fetching username from mojang uuid: ${uuid}`, err));

        if (!res) return undefined;

        if (res.status === 200) {
            let username: string;
            if(this.uuidToNameCache[uuid]) {
                username = this.uuidToNameCache[uuid];
            } else {
                const names = await res.json();
                username = names[names.length - 1].name;

                this.uuidToNameCache[uuid] = username;
                setTimeout(() => delete this.uuidToNameCache[uuid], 900000);
            }
            return username;
        } else {
            return undefined;
        }
    }
}

export default MojangApiManager;

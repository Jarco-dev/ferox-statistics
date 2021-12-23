import fetch from "node-fetch";
import type Client from "../index";

class MojangApiManager {
    public logger: typeof Client.logger;

    constructor(client: typeof Client) {
        this.logger = client.logger;
    }

    public async getUuid(username: string): Promise<string | undefined> {
        const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
            .catch(err => this.logger.error(`Error while fetching uuid from mojang username: ${username}`, err));

        if (!res) return undefined;

        if (res.status === 200) {
            const { id } = await res.json();
            const m = (/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/).exec(id) as RegExpExecArray;
            return `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`;
        } else {
            return undefined;
        }
    }

    public async getUsername(uuid: string): Promise<string | undefined> {
        const res = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`)
            .catch(err => this.logger.error(`Error while fetching username from mojang uuid: ${uuid}`, err));

        if (!res) return undefined;

        if (res.status === 200) {
            const names = await res.json();
            return names[names.length-1].name;
        } else {
            return undefined;
        }
    }

}

export default MojangApiManager;

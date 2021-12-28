import type { CommandInteraction } from "discord.js";
import Client from "../index";
import BaseCommand from "./structures/BaseCommand";


class CooldownManager {
    public cooldown: { [key: string]: number };
    private global: typeof Client.global;
    private sender: typeof Client.sender;

    constructor(client: typeof Client) {
        this.global = client.global;
        this.sender = client.sender;
        this.cooldown = {};
    }

    public check(i: CommandInteraction, command: BaseCommand): boolean {
        const key: string = `${command.name}_${i.user.id}`;

        if (this.cooldown[key]) {
            const diff = this.cooldown[key] - Date.now();
            const timeLeft = this.global.parseTime((diff >= 1000) ? diff : 1000);
            this.sender.reply(i, {
                content: `Please wait \`${timeLeft}\` and try again`,
                ephemeral: true
            }, { msgType: "TIME" });
            return true;
        } else {
            this.cooldown[key] = Date.now() + command.cooldown;
            setTimeout(() => delete this.cooldown[key], command.cooldown);
            return false;
        }
    }
}

export default CooldownManager;

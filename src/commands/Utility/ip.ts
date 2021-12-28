import { CommandInteraction } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class IpCommand extends BaseCommand {
    constructor() {
        super({
            name: "ip",
            description: "Get the server ip",
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public run(i: CommandInteraction): void {
        this.sender.reply(i, { content: `The server ip is: \`${this.sConfig.MISC.SERVER_IP}\`` }, { msgType: "SUCCESS" });
    }
}

export default IpCommand;

import type { CommandInteraction } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class InfoCommand extends BaseCommand {
    constructor() {
        super({
            name: "info",
            description: "View some information about the bot",
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public async run(i: CommandInteraction): Promise<void> {
        // Collect the data
        const uptime = this.global.parseTime(this.client.uptime ?? 0);
        const users = this.client.guilds.cache.reduce((a, g) => a += g.memberCount, 0);
        const guilds = this.client.guilds.cache.size;
        const devTag = (await this.client.users.fetch("232163746829697025")).tag;

        // Create and send the embed
        const embed = this.global.embed()
            .setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL())
            .addField("Version", `v${this.config.VERSION}`, true)
            .addField("Libary", "discord.js", true)
            .addField("Creator", devTag, true)
            .addField("Servers", guilds.toString(), true)
            .addField("Users", users.toString(), true)
            .addField("Uptime", uptime, true);
        this.sender.reply(i, { embeds: [embed] });
    }
}

export default InfoCommand;

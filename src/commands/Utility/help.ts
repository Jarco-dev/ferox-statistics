import { CommandInteraction } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class HelpCommand extends BaseCommand {
    constructor() {
        super({
            name: "help",
            description: "View a list of available commands with a short description",
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public run(i: CommandInteraction): void {
        let cmdData: string[] = [];

        for (const cmdName in this.commandLoader.commands) {
            const cmd = this.commandLoader.commands[cmdName];
            cmdData.push(`**${cmd.name}**\n- ${cmd.description}`);
        }

        const embed = this.global.embed()
            .setTitle(`Main commands`)
            .setDescription(cmdData.join("\n"));
        this.sender.reply(i, { embeds: [embed], ephemeral: true });
    }
}

export default HelpCommand;

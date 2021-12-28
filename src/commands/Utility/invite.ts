import type { CommandInteraction } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class InviteCommand extends BaseCommand {
    constructor() {
        super({
            name: "invite",
            description: "Get a link to invite the bot",
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public run(i: CommandInteraction): void {
        const embed = this.global.embed()
            .setTitle("Click the button to invite the bot")
            .setDescription(`Make sure to check out the premium features as well`);

        const row1 = this.global.actionRow()
            .addComponents([
                this.global.button()
                    .setStyle("LINK")
                    .setURL(this.sConfig.LINKS.BOT_INVITE)
                    .setEmoji("🔗")
                    .setLabel("Invite")
            ]);

        this.sender.reply(i, { embeds: [embed], components: [row1], ephemeral: true });
    }
}

export default InviteCommand;

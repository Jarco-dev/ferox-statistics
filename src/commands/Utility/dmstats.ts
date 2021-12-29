import { CommandInteraction } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class DmStatsCommand extends BaseCommand {
    constructor() {
        super({
            name: "dmstats",
            description: "Toggle statistics being sent to you in dm after each game",
            cooldown: 3000,
            status: "DEV"
        });
    }

    public async run(i: CommandInteraction): Promise<void> {
        const current = await this.prisma.userSettings.findUnique({ where: { id: i.user.id } });
        await this.prisma.userSettings.update({ data: { dmStats: !current!.dmStats }, where: { id: i.user.id } });
        if (current!.dmStats) {
            const embed = this.global.embed()
                .setTitle("The feature dm stats has been `enabled`")
                .setDescription("You will now receive a dm at the end of each of your games with it's statistics");
            this.sender.reply(i, { embeds: [embed], ephemeral: true });
        } else {
            this.sender.reply(i, {
                content: "The feature dm stats has been `disabled`",
                ephemeral: true
            }, { msgType: "SUCCESS" });
        }
    }
}

export default DmStatsCommand;

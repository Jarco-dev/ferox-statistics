import { CommandInteraction } from "discord.js";
import BaseCommand from "../../utils/structures/BaseCommand";

class SettingsCommand extends BaseCommand {
    constructor() {
        super({
            name: "settings",
            description: "Manage your account settings",
            options: [{
                type: "SUB_COMMAND",
                name: "dmstats",
                description: "Manage statistics being sent to you after each game",
                options: [
                    {
                        type: "STRING",
                        name: "action",
                        description: "The action you with to take",
                        choices: [
                            { name: "Set", value: "set" },
                            { name: "View", value: "view" },
                            { name: "Reset", value: "reset" }
                        ],
                        required: true
                    }, {
                        type: "BOOLEAN",
                        name: "value",
                        description: "The new status of the feature dm stats"
                    }
                ]
            }],
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public run(i: CommandInteraction): void {

        switch (i.options.getSubcommand()) {
            case "dmstats": {
                this._runDmStatsSubCommand(i);
                break;
            }
        }

    }

    private async _runDmStatsSubCommand(i: CommandInteraction): Promise<void> {
        switch (i.options.getString("action")) {

            case "set": {
                const value = i.options.getBoolean("value");
                if (typeof value !== "boolean") {
                    this.sender.reply(i, {
                        content: "Please provide a value to set the feature dm stats to",
                        ephemeral: true
                    }, { msgType: "INVALID" });
                    return;
                }

                await this.prisma.userSettings.update({ data: { dmStats: value }, where: { id: i.user.id } });
                if (value) {
                    const embed = this.global.embed()
                        .setTitle("The feature dm stats has been set to `enabled`")
                        .setDescription("You will now receive a dm at the end of each of your games with it's statistics");
                    this.sender.reply(i, { embeds: [embed], ephemeral: true });
                } else {
                    this.sender.reply(i, {
                        content: "The feature dm stats has been set to `disabled`",
                        ephemeral: true
                    }, { msgType: "SUCCESS" });
                }
                break;
            }

            case "view": {
                const data = await this.prisma.userSettings.findUnique({ where: { id: i.user.id } });
                if (!data) throw new Error("user settings could not be found");
                this.sender.reply(i, {
                    content: `The feature dm stats is currently \`${(data.dmStats) ? "enabled" : "disabled"}\``,
                    ephemeral: true
                }, { msgType: "SUCCESS" });
                break;
            }

            case "reset": {
                await this.prisma.userSettings.update({ data: { dmStats: false }, where: { id: i.user.id } });
                this.sender.reply(i, {
                    content: "The feature dm stats has been reset to it's default",
                    ephemeral: true
                }, { msgType: "SUCCESS" });
            }

        }
    }
}

export default SettingsCommand;

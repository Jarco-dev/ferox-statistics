import type prisma from "@prisma/client";
import type { CommandInteraction } from "discord.js";
import moment from "moment";
import type { UserStatistics } from "../../types";
import BaseCommand from "../../utils/structures/BaseCommand";

class UserStatsCommand extends BaseCommand {
    constructor() {
        super({
            name: "userstats",
            description: "View user statistics from the ferox minecraft server",
            options: [
                {
                    type: "STRING",
                    name: "username",
                    description: "View a specific user by their user name"
                }, {
                    type: "USER",
                    name: "user",
                    description: "View a specific user by their discord"
                }, {
                    type: "BOOLEAN",
                    name: "hidden",
                    description: "View the statistics in a hidden message"
                }
            ],
            cooldown: 3000,
            status: "ENABLED"
        });
    }

    public async run(i: CommandInteraction): Promise<void> {
        // Get the stats
        let username = i.options.getString("username");
        const user = i.options.getUser("user");
        let data: prisma.Stats;

        if (username && user) {
            this.sender.reply(i, {
                content: "`username` and `user` cant be used together",
                ephemeral: true
            }, { msgType: "INVALID" });
            return;
        }

        if (username) {
            // Fetch the uuid
            const uuid = await this.mojang.getUuid(username);
            if (!uuid) {
                this.sender.reply(i, {
                    content: `The username ${username} doesn't exist`,
                    ephemeral: true
                }, { msgType: "INVALID" });
                return;
            }

            // Fetch the data
            const res = await this.prisma.stats.findUnique({ where: { uuid: uuid } });
            if (!res) {
                this.sender.reply(i, {
                    content: `${username} never joined the server`,
                    ephemeral: true
                }, { msgType: "INVALID" });
                return;
            } else data = res;
        } else {
            // Fetch the stats
            const res = await this.prisma.stats.findFirst({ where: { discordid: (user) ? user.id : i.user.id } });
            if (!res) {
                if (user) this.sender.reply(i, {
                    content: `${user} doesn't have their discord linked`,
                    ephemeral: true
                }, { msgType: "INVALID" });
                else this.sender.reply(i, {
                    content: "Please link your discord first, to learn more use `/link info`",
                    ephemeral: true
                }, { msgType: "INVALID" });
                return;
            } else data = res;
        }

        // Parse stats
        if (!username) {
            const name = await this.mojang.getUsername(data.uuid);
            if (name) username = name;
            else throw new Error("Couldn't fetch username from uuid");
        }
        const userStats: UserStatistics = {
            ...data,
            username: username as string,
            bowAccuracy: (data.arrowsshot === 0) ? `100%` : `${Math.round((data.arrowshit / data.arrowsshot) * 100)}%`,
            createdat: moment.utc(data.createdat).format("YYYY-MM-DD HH:mm:ss UTC"),
            playtime: this.global.parseTime(data.playtime ?? 0) || "None on record",
            killDeathRatio: ((data.kills ?? 0) / (data.deaths ?? 0)).toFixed(2),
            winLossRatio: (data.wins / data.loses).toFixed(2),
            gamesPlayed: await this.prisma.gameStats.count({ where: { OR: [{ teamredmembers: { contains: data.uuid } }, { teambluemembers: { contains: data.uuid } }] } })
        };

        // Create and send the embed
        const embed = this.global.embed()
            .setAuthor("FeroxCore", `https://api.mcsrvstat.us/icon/${this.sConfig.MISC.SERVER_IP}`)
            .setTitle(userStats.username)
            .setThumbnail(`https://crafatar.com/renders/head/${userStats.uuid}?overlay`)
            .addField("Misc", `\`>\` Games played: \`${userStats.gamesPlayed}\`\n\`>\` Nexuses broken: \`${userStats.nexusesbroken}\`\n\`>\` playtime: \`${userStats.playtime}\`\n\`>\` First join: \`${userStats.createdat}\``)
            .addField("Games", `\n\`>\` Wins: \`${userStats.wins}\`\n\`>\` Loses: \`${userStats.loses}\`\n\`>\` WLR: \`${userStats.winLossRatio}\``, true)
            .addField("Bow", `\`>\` Shots taken: \`${userStats.arrowsshot}\`\n\`>\` Shots hit: \`${userStats.arrowshit}\`\n\`>\` Accuracy: \`${userStats.bowAccuracy}\``, true)
            .addField("Combat", `\`>\` Kills: \`${userStats.kills}\`\n\`>\` Deaths: \`${userStats.deaths}\`\n\`>\` KDR: \`${userStats.killDeathRatio}\``, true);


        const hidden = i.options.getBoolean("hidden");
        this.sender.reply(i, { embeds: [embed], ephemeral: (hidden === true) });
    }
}

export default UserStatsCommand;

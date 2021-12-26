import BaseCommand from "../../utils/structures/BaseCommand";
import type { CommandInteraction } from "discord.js";
import type { StatisticType } from "../../types";

class LeaderboardCommand extends BaseCommand {
    public valueToString: {[key: string]: string};

    constructor() {
        super({
            name: "leaderboard",
            description: "View the leaderboards",
            options: [{
                type: "STRING",
                name: "statistic",
                description: "The statistic you want to view",
                choices: [
                    { name: "Kills", value: "kills" },
                    { name: "Deaths", value: "deaths" },
                    { name: "Wins", value: "wins" },
                    { name: "Loses", value: "loses" },
                    { name: "Nexuses broken", value: "nexusesbroken" },
                    { name: "Arrows shot", value: "arrowsshot" },
                    { name: "Arrows hit", value: "arrowshit" },
                    { name: "Playtime", value: "playtime" }
                ],
                required: true
            }],
            cooldown: 3000,
            status: "DEV"
        });

        this.valueToString = {
            kills: "Kills",
            deaths: "Deaths",
            wins: "Wins",
            loses: "Loses",
            nexusesbroken: "Nexuses broken",
            arrowsshot: "Arrows shot",
            arrowshit: "Arrows hit",
            playtime: "Playtime"
        }
    }

    public async run(i: CommandInteraction): Promise<void> {
        // Get the top 10
        const statistic = i.options.getString("statistic", true) as StatisticType;
        const data = await this.prisma.stats.findMany({
            take: 10,
            orderBy: [{ [statistic]: "desc" }, { updatedat: "asc" }],
        });

        // Create and send the embed
        let desc = "";
        for (let i = 0; i < data.length; i++) {
            const username = await this.mojang.getUsername(data[i].uuid);
            let stat = (statistic === "playtime") ? this.global.parseTime(data[i][statistic] ?? 0) : data[i][statistic];
            desc += `**${i+1}.** ${stat} - ${username}\n`;
        }

        const embed = this.global.embed()
            .setTitle(`${this.valueToString[statistic]} leaderboard`)
            .setDescription(desc);
        this.sender.reply(i, {embeds: [embed]});
    }
}

export default LeaderboardCommand;

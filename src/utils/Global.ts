import type { ButtonInteraction, Channel, ChannelMention, CommandInteraction, Guild, GuildChannel, GuildMember, PermissionResolvable, Role, RoleMention, SelectMenuInteraction, Snowflake, TextBasedChannels, User, UserMention } from "discord.js";
import { DMChannel, Interaction, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from "discord.js";
import type Client from "../index";

class Global {
    private client: typeof Client;
    private logger: typeof Client.logger;
    private config: typeof Client.config;
    private sender: typeof Client.sender;

    constructor(client: typeof Client) {
        this.client = client;
        this.logger = client.logger;
        this.config = client.config;
        this.sender = client.sender;
    }

    public embed(): MessageEmbed {
        return new MessageEmbed()
            .setColor(this.config.COLORS.DEFAULT)
            .setTimestamp()
            .setFooter(`${this.client.user!.username} v${this.config.VERSION}`);
    }

    public emptyEmbed(): MessageEmbed {
        return new MessageEmbed();
    }

    public button(): MessageButton {
        return new MessageButton();
    }

    public actionRow(): MessageActionRow {
        return new MessageActionRow();
    }

    public selectMenu(): MessageSelectMenu {
        return new MessageSelectMenu();
    }

    public async fetchUser(userId?: (Snowflake | UserMention | null | undefined)): Promise<User | void> {
        if (userId) {
            const snowflake = userId.match(/[0-9]+/)?.[0];
            if (snowflake) return await this.client.users.fetch(userId).catch(() => {});
        }
    }

    public async fetchMember(guild: Guild, userId?: (Snowflake | UserMention | null | undefined)): Promise<void | GuildMember> {
        if (guild && userId) {
            const snowflake = userId.match(/[0-9]+/)?.[0];
            if (snowflake) return await guild.members.fetch(userId).catch(() => { });
        }
    }

    public async fetchRole(guild: Guild, roleId?: (Snowflake | RoleMention | null | undefined)): Promise<Role | null | void> {
        if (guild && roleId) {
            const snowflake = roleId.match(/[0-9]+/)?.[0];
            if (snowflake) return await guild.roles.fetch(snowflake).catch(() => { });
        }
    }

    public fetchChannel(channelId?: (Snowflake | ChannelMention | null | undefined)): Channel | null | undefined {
        if (channelId) {
            const snowflake = channelId.match(/[0-9]+/)?.[0];
            if (snowflake) return this.client.channels.resolve(snowflake);
        }
    }

    public parseTime(duration: number): string {
        let result = "";

        duration = Math.floor(duration / 1000);
        let sec = duration % 60;
        if (duration >= 1) result = sec + "s";

        duration = Math.floor(duration / 60);
        let min = duration % 60;
        if (duration >= 1) result = min + "m " + result;

        duration = Math.floor(duration / 60);
        let hour = duration % 24;
        if (duration >= 1) result = hour + "h " + result;

        duration = Math.floor(duration / 24);
        let day = duration % 365;
        if (duration >= 1) result = day + "d " + result;

        duration = Math.floor(duration / 365);
        let year = duration;
        if (duration >= 1) result = year + "y " + result;

        return result;
    }

    public limitString(string: string, limit: number, tooLongMsg: string = "..."): string {
        if (string.length > limit) {
            return string.substring(0, limit + tooLongMsg.length) + tooLongMsg;
        } else {
            return string;
        }
    }

    public hasPermissions(
        channel: GuildChannel,
        permissions: PermissionResolvable[],
        notifHere?: (TextBasedChannels | CommandInteraction | ButtonInteraction | SelectMenuInteraction)
    ): boolean {
        // Client member exists
        if (!channel.guild.me) throw new Error("Could not get channel.guild.me for permission checking");
        const perms = channel.permissionsFor(channel.guild.me);
        permissions = permissions.filter(perm => !perms.has(perm));
        if (permissions.length === 0) return true;
        if (notifHere) {
            if (notifHere instanceof Interaction) {
                this.sender.reply(notifHere, {
                    content: `The bot is missing the \`${permissions.join("`, `")}\` permission(s) in ${channel}, Please contact a server admin!`
                }, { msgType: "INVALID" });
            } else {
                if (!notifHere.partial) {
                    if (!(notifHere instanceof DMChannel)) {
                        const notifChanPerms = notifHere.permissionsFor(channel.guild.me);
                        if (!notifChanPerms.has("VIEW_CHANNEL") || !notifChanPerms.has("SEND_MESSAGES") || !notifChanPerms.has("EMBED_LINKS")) return false;
                    }
                    this.sender.msgChannel(notifHere, {
                        content: `The bot is missing the \`${permissions.join("`, `")}\` permission(s) in ${channel}, Please contact a server admin!`
                    }, { msgType: "INVALID" });
                } else throw new Error("Can't send missing permissions message in partial channel");
            }
        }
        return false;
    }

    public isAboveRoles(
        roles: Role[], notifHere?: (TextBasedChannels | CommandInteraction | ButtonInteraction | SelectMenuInteraction)): boolean {
        roles = roles.filter(role => !role.editable).sort((a, b) => b.position - a.position);
        if (roles.length === 0) return true;
        if (notifHere) {
            if (notifHere instanceof Interaction) {
                this.sender.reply(notifHere, {
                    content: `The bot is too low in the role hierarchy to manage the \`${roles.join("`, `")}\` role(s), Please contact a server admin!`
                }, { msgType: "INVALID" });
            } else {
                if (!notifHere.partial) {
                    if (!(notifHere instanceof DMChannel)) {
                        if (!notifHere.guild.me) throw new Error("Could not get channel.guild.me for permission checking");
                        const notifChanPerms = notifHere.permissionsFor(notifHere.guild.me);
                        if (!notifChanPerms.has("VIEW_CHANNEL") || !notifChanPerms.has("SEND_MESSAGES") || !notifChanPerms.has("EMBED_LINKS")) return false;
                    }
                    this.sender.msgChannel(notifHere, {
                        content: `The bot is too low in the role hierarchy to manage the \`${roles.join("`, `")}\` role(s), Please contact a server admin!`
                    }, { msgType: "INVALID" });
                } else throw new Error("Can't send missing permissions message in dm channel");
            }
        }
        return false;
    }
}

export default Global;

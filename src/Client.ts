import { Client as DiscordClient } from "discord.js";
import config from "./config";
import Logger from "./utils/Logger";
import { PrismaClient } from "@prisma/client";
import Sender from "./utils/Sender";
import Global from "./utils/Global";
import CooldownManager from "./utils/CooldownManager";
import MojangApiManager from "./utils/MojangApiManager";
import CommandLoader from "./commands/CommandLoader";
import EventLoader from "./events/EventLoader";
import FeatureLoader from "./features/FeatureLoader";
import MetricsManager from "./utils/MetricsManager";
import type { SecretConfig } from "./types";

class Client extends DiscordClient {
    public sConfig = require("../secret/config") as SecretConfig;
    public config = config;
    public logger = new Logger(this);
    public prisma = new PrismaClient();
    public sender = new Sender(this);
    public global = new Global(this);
    public cooldownManager = new CooldownManager(this);
    public metricsManager = new MetricsManager(this);
    public mojang = new MojangApiManager(this);
    public commandLoader = new CommandLoader(this);
    public eventLoader = new EventLoader(this);
    public featureLoader = new FeatureLoader(this);

    constructor() {
        super(config.CLIENT_OPTIONS);

        // Logging
        this.logger.setLogLevel(this.sConfig.LOG_LEVEL);

        // Database
        this.prisma.$connect().catch((err: unknown) => this.logger.error("Error while connecting to database", err));

        // Loaders
        this.commandLoader.loadAll();
        this.eventLoader.loadAll();
        this.featureLoader.loadAll();
    }
}

export default Client;

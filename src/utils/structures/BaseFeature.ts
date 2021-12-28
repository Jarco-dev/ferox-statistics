import Client from "../../index";

abstract class BaseFeature {
    public name: string;
    public client = Client;
    public prisma = Client.prisma;
    public sConfig = Client.sConfig;
    public config = Client.config;
    public logger = Client.logger;
    public sender = Client.sender;
    public global = Client.global;
    public mojang = Client.mojang;
    public metricsManager = Client.metricsManager;
    public commandLoader = Client.commandLoader;
    public eventLoader = Client.eventLoader;
    public featureLoader = Client.featureLoader;

    protected constructor(name: string) {
        this.name = name;
    }

    public abstract start(...args: unknown[]): void;
}

export default BaseFeature;

import BaseFeature from "../utils/structures/BaseFeature";
import { promises as fs } from "fs";
import path from "path";
import Client from "../index";

class FeatureLoader {
    public client: typeof Client;
    public logger: typeof Client.logger;
    public config: typeof Client.config;
    public features: { [key: string]: BaseFeature };
    public path: string;

    constructor(client: typeof Client) {
        this.client = client;
        this.logger = client.logger;
        this.config = client.config;
        this.features = {};
        this.path = path.join(__dirname, "../features/");
    }

    public async loadAll(): Promise<void> {
        // Get all the folders
        const folders = await fs.readdir(this.path);
        for (const folder of folders) {
            // Load the features if it's a folder
            if ((await fs.lstat(this.path + folder)).isDirectory()) {
                const files = await fs.readdir(this.path + folder);
                // Go through all the feature files
                for (const file of files) {
                    // Load the feature
                    try {
                        const Feature = require(path.join(this.path, `./${folder}/${file}`)).default;
                        if (Feature.prototype instanceof BaseFeature) {
                            const feature = new Feature();
                            this.features[feature.name] = feature;
                        }
                    } catch (err) {
                        this.logger.error(`Error while trying to load a feature featureFile: ${file}`, err);
                    }
                }
            }
        }
    }

    public async startAll(): Promise<void> {
        for (const feature in this.features) {
            try {
                this.features[feature].start();
            } catch (err) {
                this.logger.error(`Error while starting a feature feature: ${feature}`, err);
            }
        }
    }
}

export default FeatureLoader;

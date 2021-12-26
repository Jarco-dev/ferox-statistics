import BaseFeature from "../../utils/structures/BaseFeature";

class PresenceFeature extends BaseFeature {
    constructor() {
        super("presence");
    }

    start() {
        this.client.user!.setPresence({
            status: "online",
            activities: [{
                type: "WATCHING",
                name: `${this.client.users.cache.size} users`
            }]
        });
    }
}

export default PresenceFeature;

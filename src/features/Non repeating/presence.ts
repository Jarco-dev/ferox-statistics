import BaseFeature from "../../utils/structures/BaseFeature";

class PresenceFeature extends BaseFeature {
    constructor() {
        super("presence");
    }

    start() {
        this.client.user!.setPresence({
            status: "online",
            activities: [{
                name: "todos for staff",
                type: "STREAMING",
                url: "https://www.twitch.tv/feroxhosting"
            }]
        });
    }
}

export default PresenceFeature;

import { logger } from "../../lib/utils";
import { createEvent } from "../../handlers/eventHandler";

export default createEvent({
    name: "debug",
    listener: (instance, message) => {
        logger.debug(message);
    },
});

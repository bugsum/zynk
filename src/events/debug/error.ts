import { logger } from "../../lib/utils";
import { createEvent } from "../../handlers/eventHandler";

export default createEvent({
    name: "error",
    listener: (instance, error) => {
        logger.error(error);
    },
});

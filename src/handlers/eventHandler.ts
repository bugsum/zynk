import type { Client } from "../ochako";
import { Event, EventNames } from "../lib/types";
import { logger } from "../lib/utils";

export function createEvent<EventName extends EventNames>(
    props: Event<EventName>,
): Event<EventName> {
    return props;
}

export function eventExecutor(instance: Client, event: Event): void {
    event.runOnce
        ? instance?.once(event.name, (...props) =>
              event.listener(instance, ...props),
          )
        : instance?.on(event.name, (...props) =>
              event.listener(instance, ...props),
          );

    logger.debug(`Registered Event: ${event.name}`);
}

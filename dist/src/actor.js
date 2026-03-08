// Creates a new actor with the specified position, previous version, and health
function make_actor(att, oldVersion, upd, createFunc) {
    const a = {
        attributes: att,
        // Function to update the actor
        update: upd ? upd : (oldActor) => oldActor,
        // Function to send a message to the actor
        send: (m) => {
            const oldUpdate = a.update;
            const k = m.key;
            const action = att.actions[k];
            // If the message is a "tick", update the actor and store the old version
            if (k === "tick") {
                const updated = oldUpdate(a);
                if (updated === a) {
                    return make_actor(a.attributes, a, undefined, a.create);
                }
                else {
                    updated.oldVersion = a;
                }
                return updated;
            }
            if (action === undefined)
                throw new Error(`action : ${m.key} not found in actor  type : ${att.type}.`);
            // Otherwise, modify the update function based on the action received
            else if (action) {
                a.update = (oldActor) => {
                    return action(oldUpdate(oldActor), ...m.params);
                };
            }
            return undefined;
        },
        create: createFunc ?? ((actor) => { }),
        // contact function: allows an actor to contact other actors
        contact: (message, actors) => {
            actors.forEach(actor => {
                actor.send(message);
            });
        },
        oldVersion: oldVersion ?? null, // Store the previous version of the actor
    };
    return a;
}
function count_type(actors, type) {
    const newFromType = actors.filter((x) => x.attributes.type === type);
    return newFromType.length;
}
export { make_actor, count_type, };
//# sourceMappingURL=actor.js.map
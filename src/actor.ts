import * as A from '#src/attributes.js';

// Define a message type with a key and parameters
type message = { key: string; params: any[] };

// Define the actor type and its properties and functions
type Actor = {
    update: (Actor: Actor) => Actor; // Function to update the Actor's state
    send: (message: message) => Actor | void; // Function to process a message
    create: (Actor: Actor) => void; // Function to create a new Actor
    contact: (message: message, Actors: Actor[]) => void; // Send message to Actors 
    oldVersion: Actor | null; // Keeps track of the previous version of the Actor
    attributes: A.Attributes<Actor>;
};

// Creates a new actor with the specified position, previous version, and health
function make_actor(att: A.Attributes<Actor>, oldVersion: Actor | null, upd?: (oldActor: Actor) => Actor, createFunc?: (actor: Actor) => void): Actor {
    const a: Actor = {
        attributes: att,
        // Function to update the actor
        update: upd ? upd : (oldActor: Actor): Actor => oldActor,

        // Function to send a message to the actor
        send: (m: message) => {
            const oldUpdate = a.update;
            const k = m.key;
            const action = att.actions[k];

            // If the message is a "tick", update the actor and store the old version
            if (k === "tick") {
                const updated = oldUpdate(a);
                if (updated === a) {
                    return make_actor(a.attributes, a, undefined, a.create);
                } else {
                    updated.oldVersion = a;
                }
                return updated;
            }

            if (action === undefined) 
                throw new Error(`action : ${m.key} not found in actor  type : ${att.type}.`);
            
            // Otherwise, modify the update function based on the action received
            else if (action) {
                a.update = (oldActor: Actor): Actor => {
                    return action(oldUpdate(oldActor), ...m.params);
                };
            }
            return undefined;
        },

        create: createFunc ?? ((actor: Actor) => { }),

        // contact function: allows an actor to contact other actors
        contact: (message: message, actors: Actor[]) => {
            actors.forEach(actor => {
                actor.send(message);
            });
        },

        oldVersion: oldVersion ?? null, // Store the previous version of the actor
    };

    return a;
}

function count_type(actors: Actor[], type: A.actorType): number {
    const newFromType: Actor[] = actors.filter((x) => x.attributes.type === type);
    return newFromType.length;
}

export {
    message,
    Actor,
    make_actor,
    count_type,
};
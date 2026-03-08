import * as A from '#src/actor.js';
import * as C from '#src/collisions.js';
import { actorType } from './attributes.js';
function make_world(player, actors, score) {
    const w = {
        // Initialize actors and assign a `create` function to each one
        player: A.make_actor(player.attributes, player.oldVersion, player.update, (a) => { w.include([a]); }),
        actors: actors.map((actor) => {
            // Allows the actor to create other actors
            return A.make_actor(actor.attributes, actor.oldVersion, actor.update, (a) => { w.include([a]); });
        }),
        score: score,
        // Modified tick function to include collision handling
        tick: () => {
            w.score.send({ key: "increment", params: [] });
            const updatedScore = w.score.send({ key: "tick", params: [] });
            const hadShield = w.player.attributes.hasShield;
            const updatedPlayer = w.player.send({ key: "tick", params: [] });
            if (updatedPlayer === undefined)
                throw new Error("Player died");
            // Update all actors by sending them the "tick" message
            const updatedActors = w.actors.map(actor => {
                const newActor = actor.send({ key: "tick", params: [] });
                if (newActor === undefined)
                    throw new Error("tick messages returned undefined");
                return newActor;
            });
            const livingActors = updatedActors.filter(actor => (actor.attributes.isDead === false || actor.attributes.type === actorType.SCORE));
            // Handle collisions between actors
            C.handleCollisions([updatedPlayer, ...livingActors]);
            const allNewActors = [...livingActors, ...w.added];
            allNewActors.forEach((a => {
                if (a.attributes.speed) {
                    a.send({ key: "move", params: [a.attributes.speed.x, a.attributes.speed.y] });
                }
            }));
            const shouldHaveShield = hadShield || updatedPlayer.attributes.hasShield;
            // Create a new world with the living actors and the new ones
            const worldWithUpdatedActors = make_world(A.make_actor(updatedPlayer.attributes.shield(shouldHaveShield), updatedPlayer.oldVersion, updatedPlayer.update, updatedPlayer.create), allNewActors, updatedScore);
            return worldWithUpdatedActors;
        },
        // Transmit function: sends messages to all actors
        transmit: (messages) => {
            messages.forEach((m) => {
                if (m.key === "tick") {
                    throw new Error("world.transmit called with a 'tick' in the messages");
                }
                w.actors.forEach((actor) => {
                    actor.send(m); // Each actor receives the message
                });
            });
        },
        // Include function: adds new actors to the `added` list
        include: (newActors) => {
            // Create a copy of each actor before adding them to avoid unwanted modifications
            const newcopy = newActors.map((actor) => {
                return A.make_actor(actor.attributes, actor.oldVersion, actor.update);
            });
            // Update the list of actors to be added in the next tick
            w.added.push(...newcopy);
        },
        added: [], // List of actors waiting to be added in the next tick
    };
    return w;
}
export { make_world, };
//# sourceMappingURL=runtime.js.map
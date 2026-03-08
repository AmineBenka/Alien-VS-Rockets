import * as A from '#src/actor.js';
type world = {
    player: A.Actor;
    actors: A.Actor[];
    score: A.Actor;
    tick: () => world;
    transmit: (messages: A.message[]) => void;
    include: (newActors: A.Actor[]) => void;
    added: A.Actor[];
};
declare function make_world(player: A.Actor, actors: A.Actor[], score: A.Actor): world;
export { world, make_world, };

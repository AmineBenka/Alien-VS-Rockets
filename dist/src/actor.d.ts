import * as A from '#src/attributes.js';
type message = {
    key: string;
    params: any[];
};
type Actor = {
    update: (Actor: Actor) => Actor;
    send: (message: message) => Actor | void;
    create: (Actor: Actor) => void;
    contact: (message: message, Actors: Actor[]) => void;
    oldVersion: Actor | null;
    attributes: A.Attributes<Actor>;
};
declare function make_actor(att: A.Attributes<Actor>, oldVersion: Actor | null, upd?: (oldActor: Actor) => Actor, createFunc?: (actor: Actor) => void): Actor;
declare function count_type(actors: Actor[], type: A.actorType): number;
export { message, Actor, make_actor, count_type, };

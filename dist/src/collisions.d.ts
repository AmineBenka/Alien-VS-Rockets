import * as A from '#src/actor.js';
declare function detectCollisions(actors: A.Actor[]): [A.Actor, A.Actor][];
declare function handleCollisions(actors: A.Actor[]): void;
export { detectCollisions, handleCollisions, };

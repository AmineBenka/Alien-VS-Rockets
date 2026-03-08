import * as Ac from '#src/actor.js';
import * as At from '#src/attributes.js';
declare function make_player(p: At.Position): Ac.Actor;
declare function make_stone(p: At.Position): Ac.Actor;
declare function make_foe(p: At.Position, t: At.actorType): Ac.Actor;
declare function make_bullet(p: At.Position, t: At.actorType): Ac.Actor;
declare function make_potion(p: At.Position, t: At.actorType): Ac.Actor;
declare function make_score(initialScore?: number): Ac.Actor;
export { make_player, make_stone, make_foe, make_bullet, make_potion, make_score, };

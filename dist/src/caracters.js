import * as Ac from '#src/actor.js';
import * as At from '#src/attributes.js';
import * as B from '#src/actions.js';
function make_player(p) {
    const actions = {
        shoot: B.shoot,
        collide: B.playerCollide,
        move: B.move
    };
    const att = At.make_attribute({
        t: At.actorType.PLAYER,
        p: p,
        health: At.health(At.actorType.PLAYER),
        hasShield: false,
        isDead: false,
        a: actions
    });
    const player = Ac.make_actor(att, null);
    return player;
}
function make_stone(p) {
    const actions = {
        collide: B.stoneCollide,
        freeze: B.freeze,
        move: B.move
    };
    const att = At.make_attribute({
        t: At.actorType.STONE,
        p: p,
        health: At.health(At.actorType.STONE),
        speed: At.speed(At.actorType.STONE),
        a: actions,
        isDead: false
    });
    const stone = Ac.make_actor(att, null);
    return stone;
}
function make_foe(p, t) {
    const actions = {
        shoot: B.shoot,
        freeze: B.freeze,
        collide: B.foeCollide,
        move: B.move
    };
    const att = At.make_attribute({
        t: t,
        p: p,
        health: At.health(t),
        speed: At.speed(t),
        a: actions,
        isDead: false,
    });
    const shooter = Ac.make_actor(att, null);
    return shooter;
}
function make_bullet(p, t) {
    const actions = {
        collide: B.bulletCollide,
        move: B.move
    };
    const att = At.make_attribute({
        t: t,
        p: p,
        health: At.health(t),
        speed: At.speed(t),
        a: actions,
        isDead: false
    });
    return Ac.make_actor(att, null);
}
function make_potion(p, t) {
    const actions = {
        collide: B.potionCollide,
        move: B.move,
    };
    const att = At.make_attribute({
        t: t,
        p: p,
        speed: At.speed(t),
        a: actions,
        isDead: false
    });
    return Ac.make_actor(att, null);
}
function make_score(initialScore = 0) {
    const increment = (a) => {
        return Ac.make_actor(a.attributes.incScore(), a.oldVersion);
    };
    const actions = {
        increment: increment,
    };
    const att = At.make_attribute({
        t: At.actorType.SCORE,
        a: actions,
        score: initialScore
    });
    return Ac.make_actor(att, null);
}
export { make_player, make_stone, make_foe, make_bullet, make_potion, make_score, };
//# sourceMappingURL=caracters.js.map
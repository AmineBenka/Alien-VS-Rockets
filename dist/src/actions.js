import * as Ac from '#src/actor.js';
import * as At from '#src/attributes.js';
const shoot = (a, bullet) => {
    // Create a bullet in front of the player
    if (a.attributes.location === undefined) {
        throw new Error("shoot called on player with undefined location.");
    }
    // Use the create function to add the bullet to the world
    a.create(bullet);
    return a;
};
const heal = (a, heals = 1) => {
    if (a.attributes.health === undefined) {
        throw new Error("heal called on actor w/ health");
    }
    const newHealth = (a.attributes.health < 10) ? 1 : 0;
    return Ac.make_actor(a.attributes.changeHealth(newHealth), a.oldVersion, undefined, a.create);
};
const hit = (a, damage = 1) => {
    if (a.attributes.health === undefined) {
        throw new Error("hit called on actor w/ health");
    }
    return Ac.make_actor(a.attributes.changeHealth(-damage), a.oldVersion, undefined, a.create);
};
const freeze = (a, b) => {
    if (!(a.attributes.type === At.actorType.STONE || a.attributes.type === At.actorType.SHOOTER)) {
        throw new Error(`freeze called on invalid type : ${a.attributes.type}`);
    }
    return Ac.make_actor(a.attributes.freeze(b), a.oldVersion, undefined, a.create);
};
const setShield = (a, b) => {
    return Ac.make_actor(a.attributes.shield(b), a.oldVersion, undefined, a.create);
};
const move = (a, x, y) => {
    const pos = { x: x, y: y };
    const newAtt = a.attributes.changeLocation(pos);
    return Ac.make_actor(newAtt, a.oldVersion, undefined, a.create);
};
function typeToDamage(t) {
    switch (t) {
        case At.actorType.STONE:
            return 1;
        case At.actorType.SHOOTER:
            return 1;
        case At.actorType.SHOOTERBULLET:
            return 1;
        case At.actorType.BOSSBULLET:
            return 2;
        case At.actorType.BOSSBOMB:
            return 3;
        default:
            return 1;
    }
}
const playerCollide = (a, t, currentActors) => {
    if (t === At.actorType.POWERUP)
        return heal(a, 1);
    if (t === At.actorType.STONE || t === At.actorType.SHOOTER
        || t === At.actorType.SHOOTERBULLET || t === At.actorType.BOSSBULLET
        || t === At.actorType.BOSSBOMB) {
        if (a.attributes.hasShield === true)
            return a;
        return hit(a, typeToDamage(t));
    }
    if (t === At.actorType.SHIELD)
        return setShield(a, true);
    if (t === At.actorType.FREEZE) {
        const frozen = currentActors.filter((a) => (a.attributes.type === At.actorType.SHOOTER || a.attributes.type === At.actorType.STONE));
        a.contact({ key: "freeze", params: [] }, frozen);
        return a;
    }
    return a;
};
const stoneCollide = (a, t) => {
    if (t === At.actorType.PLAYER || t === At.actorType.PLAYERBULLET)
        return hit(a, 1);
    return a;
};
const foeCollide = (a, ty) => {
    if (ty === At.actorType.PLAYER || ty === At.actorType.PLAYERBULLET)
        return hit(a, 1);
    return a;
};
const bulletCollide = (a, ty) => {
    if (a.attributes.type === At.actorType.PLAYERBULLET) {
        if (ty === At.actorType.STONE || ty === At.actorType.BOSSBOMB || ty === At.actorType.BOSSBULLET || ty === At.actorType.BOSS || ty === At.actorType.SHOOTERBULLET || ty === At.actorType.SHOOTER)
            return hit(a, 1);
        return a;
    }
    else {
        if (ty === At.actorType.PLAYERBULLET || ty === At.actorType.PLAYER)
            return hit(a, 1);
        return a;
    }
};
const potionCollide = (a, ty) => {
    switch (ty) {
        case (At.actorType.PLAYER):
            return Ac.make_actor(a.attributes.kill(), a.oldVersion);
        default:
            return a;
    }
};
export { move, shoot, heal, freeze, setShield, hit, potionCollide, bulletCollide, foeCollide, stoneCollide, playerCollide };
//# sourceMappingURL=actions.js.map
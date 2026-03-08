import * as Ac from '#src/actor.js';
import * as At from '#src/attributes.js';


const shoot = (a: Ac.Actor, bullet : Ac.Actor): Ac.Actor => {
    // Create a bullet in front of the player
    if(a.attributes.location === undefined){
        throw new Error("shoot called on player with undefined location.");
    }
    // Use the create function to add the bullet to the world
    a.create(bullet);

    return a;
};

const heal = (a: Ac.Actor, heals: number = 1): Ac.Actor => {
    if(a.attributes.health === undefined){
        throw new Error("heal called on actor w/ health");
    }
    const newHealth : number = (a.attributes.health < 10) ? 1 : 0;
    return Ac.make_actor(a.attributes.changeHealth(newHealth), a.oldVersion,undefined, a.create);
};

const hit = (a: Ac.Actor, damage: number = 1): Ac.Actor => {
    if(a.attributes.health === undefined){
        throw new Error("hit called on actor w/ health");
    }
    return Ac.make_actor(a.attributes.changeHealth(-damage), a.oldVersion,undefined, a.create);
};

const freeze = (a: Ac.Actor, b : boolean): Ac.Actor => {
    if(!(a.attributes.type === At.actorType.STONE || a.attributes.type === At.actorType.SHOOTER)){
        throw new Error(`freeze called on invalid type : ${a.attributes.type}`);
    }
    return Ac.make_actor(a.attributes.freeze(b), a.oldVersion,undefined, a.create);
};

const setShield = (a: Ac.Actor, b: boolean): Ac.Actor => {
   return Ac.make_actor(a.attributes.shield(b), a.oldVersion,undefined, a.create);
};

const move = (a: Ac.Actor, x:number,y:number): Ac.Actor => {
    const pos = {x:x, y:y}; 
    const newAtt = a.attributes.changeLocation(pos);
   return Ac.make_actor(newAtt, a.oldVersion,undefined, a.create);
};

function typeToDamage(t: At.actorType): number {
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

const playerCollide = (a: Ac.Actor, t: At.actorType, currentActors: Ac.Actor[]): Ac.Actor => {
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
        return setShield(a,true);
    if (t === At.actorType.FREEZE) {
        const frozen = currentActors.filter(
            (a: Ac.Actor) => (a.attributes.type === At.actorType.SHOOTER || a.attributes.type === At.actorType.STONE)
        );
        a.contact({ key: "freeze", params: [] }, frozen);
        return a;
    }
    return a;
};

const stoneCollide = (a: Ac.Actor, t: At.actorType): Ac.Actor => {
    if (t === At.actorType.PLAYER || t === At.actorType.PLAYERBULLET)
        return hit(a, 1);
    return a;
};

const foeCollide = (a: Ac.Actor, ty: At.actorType): Ac.Actor => {
    if (ty === At.actorType.PLAYER || ty === At.actorType.PLAYERBULLET)
        return hit(a, 1);
    return a;
};

const bulletCollide =
    (a: Ac.Actor, ty: At.actorType): Ac.Actor => {
        if (a.attributes.type === At.actorType.PLAYERBULLET) {
            if (ty === At.actorType.STONE || ty === At.actorType.BOSSBOMB || ty === At.actorType.BOSSBULLET || ty === At.actorType.BOSS || ty === At.actorType.SHOOTERBULLET || ty === At.actorType.SHOOTER)
                return hit(a,1);
            return a;
        }
        else {
            if (ty === At.actorType.PLAYERBULLET || ty === At.actorType.PLAYER)
                return hit(a,1);
            return a;
        }
    };

const potionCollide = (a: Ac.Actor, ty: At.actorType): Ac.Actor => {
    switch (ty) {
        case (At.actorType.PLAYER):
            return Ac.make_actor(a.attributes.kill(),a.oldVersion);
        default:
            return a;
    }
};
export{
    move,shoot, heal, freeze, setShield, hit,potionCollide,bulletCollide,foeCollide,stoneCollide,playerCollide
};
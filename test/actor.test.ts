import * as A from '#src/attributes.js';
import * as Actor from '#src/actor.js';
import * as C from '#src/caracters.js';
import * as Actions from '#src/actions.js';

describe('Actor Tests', () => {
    let actor: Actor.Actor;
    let anotherActor: Actor.Actor;

    beforeEach(() => {
        const actions: A.Actions<Actor.Actor> = {
            move: Actions.move,
            collide: (a) => a,
            update: (a) => a
        };
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 0,
            a: actions
        });
        actor = Actor.make_actor(attributes, null);
        anotherActor = Actor.make_actor(attributes, null);
    });

    test('Initial actor position', () => {
        expect(actor.attributes.location).toEqual({ x: 0, y: 0 });
        expect(actor.update(actor)).toStrictEqual(actor);
    });

    test('Single move action', () => {
        const action: Actor.message = { key: "move", params: [1, 1] };
        actor.send(action);
        expect(actor.update(actor)).not.toBe(actor);
        const newActor = actor.send({ key: "tick", params: [] });
        expect(newActor?.attributes.location).toEqual({ x: 1, y: 1 });
    });

    test('Multiple move actions', () => {
        const actions: Actor.message[] = [
            { key: "move", params: [1, 1] },
            { key: "move", params: [2, 2] },
            { key: "move", params: [3, 3] },
        ];

        actions.forEach(action => actor.send(action));
        expect(actor.update(actor)).not.toBe(actor);
        const newActor = actor.send({ key: "tick", params: [] });
        expect(newActor?.attributes.location).toEqual({ x: 6, y: 6 });
    });

    test('Move action with negative values', () => {
        const action: Actor.message = { key: "move", params: [-3, -2] };
        actor.send(action);
        const newActor = actor.send({ key: "tick", params: [] });
        expect(newActor?.attributes.location).toEqual({ x: -3, y: -2 });
    });

    test('Multiple ticks without moves', () => {
        const tickAction: Actor.message = { key: "tick", params: [] };
        const p = C.make_player({ x: 0, y: 0 });

        const newActor1 = p.send(tickAction);
        expect(newActor1?.oldVersion?.attributes.location).toStrictEqual(p?.attributes.location);
        expect(newActor1?.oldVersion).toEqual(p);
        expect(newActor1?.oldVersion?.oldVersion).toEqual(null);

        const newActor2 = newActor1?.send(tickAction);
        expect(newActor2?.oldVersion?.attributes.location).toStrictEqual(newActor1?.attributes.location);
        expect(newActor2?.oldVersion?.oldVersion?.attributes.location).toStrictEqual(p.attributes.location);
        expect(newActor2?.oldVersion?.update(p)).toEqual(p);

        const newActor3 = newActor2?.send(tickAction);
        expect(newActor3?.oldVersion?.attributes.location).toStrictEqual(newActor2?.attributes.location);
        expect(newActor3?.oldVersion?.update(p)).toEqual(p);
    });

    test('Alternating moves and ticks', () => {
        const moveAction: Actor.message = { key: "move", params: [1, 1] };
        const tickAction: Actor.message = { key: "tick", params: [] };

        actor.send(moveAction);
        let newActor = actor.send(tickAction);
        expect(newActor?.oldVersion?.attributes.location).toEqual({ x: 0, y: 0 });
        expect(newActor?.attributes.location).toEqual({ x: 1, y: 1 });

        newActor?.send(moveAction);
        newActor = newActor?.send(tickAction);
        expect(newActor?.attributes.location).toEqual({ x: 2, y: 2 });
        expect(newActor?.oldVersion?.attributes.location).toEqual({ x: 1, y: 1 });
        expect(newActor?.update(actor)).toStrictEqual(actor);
    });

    test('Move with zero values', () => {
        const action: Actor.message = { key: "move", params: [0, 0] };
        actor.send(action);
        const newActor = actor.send({ key: "tick", params: [] });
        expect(newActor?.attributes.location).toEqual({ x: 0, y: 0 });
        expect(newActor?.update(actor)).toStrictEqual(actor);
    });

    test('Multiple moves in different directions', () => {
        const actions: Actor.message[] = [
            { key: "move", params: [1, 1] },
            { key: "move", params: [-1, 2] },
            { key: "move", params: [3, -3] },
        ];

        actions.forEach(action => actor.send(action));
        const newActor = actor.send({ key: "tick", params: [] });
        expect(newActor?.attributes.location).toEqual({ x: 3, y: 0 });
        expect(newActor?.update(actor)).toStrictEqual(actor);
    });

    test('Update function identity', () => {
        const newActor = actor.send({ key: "tick", params: [] });
        expect(newActor?.update(newActor!)).toStrictEqual(newActor);
    });

    test('Collision between two actors', () => {
        const player = C.make_player({ x: 0, y: 0 });

        player.send({ key: "collide", params: [A.actorType.STONE] });

        const updatedActor = player.send({ key: "tick", params: [] });

        expect(updatedActor?.attributes.health).toBe(9);
    });

    test('Healing an actor', () => {
        const actions: A.Actions<Actor.Actor> = {
            heal: Actions.heal,
            update: (a) => a
        };
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 1,
            a: actions
        });
        const healableActor = Actor.make_actor(attributes, null);

        healableActor.send({ key: "heal", params: [] });

        const updatedActor = healableActor.send({ key: "tick", params: [] });

        expect(updatedActor?.attributes.health).toBe(2);
    });

    test('Actor is dead when isDead is true', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 0,
            isDead: true,
            a: actions
        });
        const deadActor = Actor.make_actor(attributes, null);
        expect(deadActor.attributes.isDead).toBe(true);
    });

    test('Actor dies when health drops to zero', () => {
        const bullet = C.make_bullet({ x: 0, y: 0 }, A.actorType.PLAYERBULLET);

        bullet.send({ key: "collide", params: [A.actorType.STONE] });
        const updatedActor = bullet.send({ key: "tick", params: [] });

        expect(updatedActor?.attributes.health).toBe(0);
        expect(updatedActor?.attributes.isDead).toBe(true);
    });

    test('Actor health cannot exceed maximum (10)', () => {
        const actions: A.Actions<Actor.Actor> = {
            heal: Actions.heal,
            update: (a) => a
        };
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 10,
            a: actions
        });
        const maxHealthActor = Actor.make_actor(attributes, null);

        maxHealthActor.send({ key: "heal", params: [] });
        const updatedActor = maxHealthActor.send({ key: "tick", params: [] });

        expect(updatedActor?.attributes.health).toBe(10);
    });

    test('Multiple collisions reduce health accordingly', () => {
        const player = C.make_player({ x: 0, y: 0 });

        player.send({ key: "collide", params: [A.actorType.STONE] });
        player.send({ key: "collide", params: [A.actorType.STONE] });
        player.send({ key: "collide", params: [A.actorType.STONE] });

        const updatedActor = player.send({ key: "tick", params: [] });

        expect(updatedActor?.attributes.health).toBe(7);
    });

    test('Time travel: accessing previous actor states', () => {
        const player = C.make_player({ x: 0, y: 0 });

        player.send({ key: "move", params: [1, 1] });
        const firstMove = player.send({ key: "tick", params: [] });

        firstMove?.send({ key: "move", params: [2, 2] });
        const secondMove = firstMove?.send({ key: "tick", params: [] });

        secondMove?.send({ key: "move", params: [3, 3] });
        secondMove?.send({ key: "collide", params: [A.actorType.STONE] });
        const thirdMove = secondMove?.send({ key: "tick", params: [] });

        expect(thirdMove?.attributes.location).toEqual({ x: 6, y: 6 });
        expect(thirdMove?.attributes.health).toBe(9);

        expect(thirdMove?.oldVersion?.attributes.location).toEqual({ x: 3, y: 3 });
        expect(thirdMove?.oldVersion?.attributes.health).toBe(10);

        expect(thirdMove?.oldVersion?.oldVersion?.attributes.location).toEqual({ x: 1, y: 1 });
        expect(thirdMove?.oldVersion?.oldVersion?.attributes.health).toBe(10);
    });

    test('Actor dies if created with isDead true', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 0,
            isDead: true,
            a: actions
        });
        const deadActor = Actor.make_actor(attributes, null);
        expect(deadActor.attributes.isDead).toBe(true);
        expect(deadActor.attributes.health).toBe(0);
    });

    test("Correctly counts actors of the given type", () => {
        const actors: Actor.Actor[] = [
            C.make_player({ x: 0, y: 0 }),
            C.make_stone({ x: 1, y: 0 }),
            C.make_stone({ x: 2, y: 0 }),
            C.make_bullet({ x: 2, y: 0 }, A.actorType.PLAYERBULLET),
        ];

        expect(Actor.count_type(actors, A.actorType.STONE)).toBe(2);
        expect(Actor.count_type(actors, A.actorType.PLAYER)).toBe(1);
        expect(Actor.count_type(actors, A.actorType.PLAYERBULLET)).toBe(1);
        expect(Actor.count_type(actors, A.actorType.ANY)).toBe(0);
    });

    test("Returns 0 for an empty list", () => {
        expect(Actor.count_type([], A.actorType.STONE)).toBe(0);
    });

    test('Player moves in both directions', () => {
        const player = C.make_player({ x: 0, y: 0 });

        player.send({ key: "move", params: [5, 10] });
        const movedPlayer = player.send({ key: "tick", params: [] });

        expect(movedPlayer?.attributes.location).toEqual({ x: 5, y: 10 });
    });

    test('Stone actor has default speed', () => {
        const stone = C.make_stone({ x: 0, y: 0 });

        expect(stone.attributes.speed).toEqual({ x: 0, y: 0.4 });
    });

    test('Player can shoot bullets', () => {
        const player = C.make_player({ x: 5, y: 5 });
        let bulletCreated = false;

        player.create = (bullet) => {
            expect(bullet.attributes.type).toBe(A.actorType.PLAYERBULLET);
            expect(bullet.attributes.location).toEqual({ x: 5, y: 4 });
            bulletCreated = true;
        };

        player.send({ key: "shoot", params: [C.make_bullet({ x: 5, y: 4 }, A.actorType.PLAYERBULLET)] });
        player.send({ key: "tick", params: [] });

        expect(bulletCreated).toBe(true);
    });

    test('Freeze immobilizes stone actors', () => {
        const stone = C.make_stone({ x: 0, y: 0 });
        expect(stone.attributes.speed).toEqual({ x: 0, y: 0.4 });

        stone.send({ key: "freeze", params: [true] });
        const frozenStone = stone.send({ key: "tick", params: [] });

        expect(frozenStone?.attributes.speed).toEqual({ x: 0, y: 0 });
    });

    test('Unfreeze restores stone speed', () => {
        const stone = C.make_stone({ x: 0, y: 0 });
        stone.send({ key: "freeze", params: [true] });
        const frozenStone = stone.send({ key: "tick", params: [] });
        expect(frozenStone?.attributes.speed).toEqual({ x: 0, y: 0 });

        frozenStone?.send({ key: "freeze", params: [false] });
        const unfrozenStone = frozenStone?.send({ key: "tick", params: [] });

        expect(unfrozenStone?.attributes.speed).toEqual({ x: 0, y: 0.4 });
    });
});

describe('Attributes Tests', () => {
    test('make_attribute creates attributes correctly', () => {
        const actions: A.Actions<Actor.Actor> = {
            testAction: (a) => a
        };

        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 10, y: 20 },
            health: 5,
            speed: { x: 1, y: 2 },
            a: actions,
            isDead: false,
            hasShield: true,
            score: 100
        });

        expect(attributes.type).toBe(A.actorType.PLAYER);
        expect(attributes.location).toEqual({ x: 10, y: 20 });
        expect(attributes.health).toBe(5);
        expect(attributes.speed).toEqual({ x: 1, y: 2 });
        expect(attributes.actions).toBe(actions);
        expect(attributes.isDead).toBe(false);
        expect(attributes.hasShield).toBe(true);
        expect(attributes.score).toBe(100);
        expect(attributes.icon).toBe('🚀');
    });

    test('kill sets isDead to true', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            a: actions,
            isDead: false
        });

        const killedAttributes = attributes.kill();
        expect(killedAttributes.isDead).toBe(true);
    });

    test('shield changes hasShield value', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            a: actions,
            hasShield: false
        });

        const shieldedAttributes = attributes.shield(true);
        expect(shieldedAttributes.hasShield).toBe(true);

        const unshieldedAttributes = attributes.shield(false);
        expect(unshieldedAttributes.hasShield).toBe(false);
    });

    test('incScore increments score', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.SCORE,
            a: actions,
            score: 42
        });

        const updatedAttributes = attributes.incScore();
        expect(updatedAttributes.score).toBe(43);
    });

    test('changeHealth modifies health', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            a: actions,
            health: 5
        });

        const healedAttributes = attributes.changeHealth(3);
        expect(healedAttributes.health).toBe(8);

        const damagedAttributes = attributes.changeHealth(-2);
        expect(damagedAttributes.health).toBe(3);
    });

    test('freeze changes speed', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.STONE,
            p: { x: 0, y: 0 },
            a: actions,
            speed: { x: 1, y: 2 }
        });

        const frozenAttributes = attributes.freeze(true);
        expect(frozenAttributes.speed).toEqual({ x: 0, y: 0 });

        const unfrozenAttributes = attributes.freeze(false);
        expect(unfrozenAttributes.speed).toEqual(A.speed(A.actorType.STONE));
    });

    test('changeLocation modifies position', () => {
        const actions: A.Actions<Actor.Actor> = {};
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 5, y: 10 },
            a: actions
        });

        const movedAttributes = attributes.changeLocation({ x: 3, y: -2 });
        expect(movedAttributes.location).toEqual({ x: 8, y: 8 });
    });

    test('speed returns correct speed for each type', () => {
        expect(A.speed(A.actorType.STONE)).toEqual({ x: 0, y: 0.4 });
        expect(A.speed(A.actorType.SHOOTER)).toEqual({ x: 0, y: 0.2 });
        expect(A.speed(A.actorType.PLAYERBULLET)).toEqual({ x: 0, y: -0.8 });
        expect(A.speed(A.actorType.SHOOTERBULLET)).toEqual({ x: 0, y: 0.8 });
        expect(A.speed(A.actorType.POWERUP)).toEqual({ x: 0, y: 0.3 });
        expect(A.speed(A.actorType.PLAYER)).toEqual({ x: 0, y: 0 });
    });

    test('health returns correct health for each type', () => {
        expect(A.health(A.actorType.PLAYER)).toBe(10);
        expect(A.health(A.actorType.STONE)).toBe(3);
        expect(A.health(A.actorType.SHOOTER)).toBe(3);
        expect(A.health(A.actorType.PLAYERBULLET)).toBe(1);
        expect(A.health(A.actorType.SHOOTERBULLET)).toBe(1);
        expect(A.health(A.actorType.BOSS)).toBe(20);
        expect(A.health(A.actorType.BOSSBODY)).toBe(100);
    });
});

describe('Actions Tests', () => {
    test('move correctly moves an actor', () => {
        const player = C.make_player({ x: 5, y: 5 });
        const moved = Actions.move(player, 3, 2);

        expect(moved.attributes.location).toEqual({ x: 8, y: 7 });
    });

    test('shoot creates a bullet correctly', () => {
        const player = C.make_player({ x: 5, y: 5 });
        let bulletCreated = false;
        let createdBullet: Actor.Actor | null = null;

        player.create = (bullet) => {
            bulletCreated = true;
            createdBullet = bullet;
        };

        const afterShoot = Actions.shoot(player, C.make_bullet({ x: 5, y: 4 }, A.actorType.PLAYERBULLET));

        expect(bulletCreated).toBe(true);
        expect(createdBullet).not.toBeNull();
        expect(afterShoot).toBe(player);
    });

    test('heal correctly increases health', () => {
        const actions: A.Actions<Actor.Actor> = {
            heal: Actions.heal,
            update: (a) => a
        };
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 5,
            a: actions
        });
        const player = Actor.make_actor(attributes, null);

        const healed = Actions.heal(player);

        expect(healed.attributes.health).toBe(6);
    });

    test('heal caps health at 10', () => {
        const actions: A.Actions<Actor.Actor> = {
            heal: Actions.heal,
            update: (a) => a
        };
        const attributes = A.make_attribute({
            t: A.actorType.PLAYER,
            p: { x: 0, y: 0 },
            health: 10,
            a: actions
        });
        const player = Actor.make_actor(attributes, null);

        const healed = Actions.heal(player);

        expect(healed.attributes.health).toBe(10);
    });
});
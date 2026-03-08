import * as A from '#src/actor.js';
import * as W from '#src/runtime.js';
import * as CO from '#src/collisions.js';
import * as CA from '#src/caracters.js';
import { actorType } from '#src/attributes.js';

describe('make_world function', () => {
  let player: A.Actor;
  let testActor1: A.Actor;
  let testActor2: A.Actor;
  let testActor3: A.Actor;
  let world: W.world;
  let score: A.Actor;

  beforeEach(() => {
    player = CA.make_player({ x: 0, y: 0 });
    testActor1 = A.make_actor(
      CA.make_player({ x: 0, y: 0 }).attributes,
      null
    );
    testActor2 = A.make_actor(
      CA.make_player({ x: 0, y: 0 }).attributes,
      null
    );
    testActor3 = A.make_actor(
      CA.make_player({ x: 0, y: 0 }).attributes,
      null
    );
    score = CA.make_score(0);
    world = W.make_world(player, [testActor1, testActor2], CA.make_score(0));
  });

  test('world creation', () => {
    expect(world.actors).toHaveLength(2);
    expect(world.actors[0].attributes.location).toEqual({ x: 0, y: 0 });
    expect(world.actors[1].attributes.location).toEqual({ x: 0, y: 0 });
  });

  test('world transmit function throws error for tick message', () => {
    const messages: A.message[] = [{ key: 'tick', params: [] }];
    expect(() => world.transmit(messages)).toThrow('world.transmit called with a \'tick\' in the messages');
  });

  test('actor create function adds new actor to world', () => {
    const newActorPosition = { x: 5, y: 0 };
    const newActorPosition1 = { x: 0, y: 0 };

    const actor = A.make_actor(
      CA.make_player(newActorPosition).attributes,
      null
    );
    world.actors[0].create(actor);

    expect(world.added).toHaveLength(1);
    expect(world.added[0].attributes.location).toEqual(newActorPosition);
    expect(world.added[0].oldVersion).toEqual(null);

    const actor1 = A.make_actor(
      CA.make_player(newActorPosition1).attributes,
      null
    );
    world.actors[1].create(actor1);

    expect(world.added).toHaveLength(2);
    expect(world.added[0].attributes.location).toEqual(newActorPosition);
    expect(world.added[0].oldVersion).toEqual(null);
    expect(world.added[1].attributes.location).toEqual(newActorPosition1);
    expect(world.added[1].oldVersion).toEqual(null);

    world.transmit([{ key: 'move', params: [1, 1] }]);
    const newWorld = world.tick();
    expect(newWorld.actors).toHaveLength(4);
    expect(newWorld.actors[0].attributes.location).toEqual({ x: 1, y: 1 });
    expect(newWorld.actors[1].attributes.location).toEqual({ x: 1, y: 1 });
    expect(newWorld.actors[2].attributes.location).toEqual({ x: 5, y: 0 });
    expect(newWorld.actors[3].attributes.location).toEqual({ x: 0, y: 0 });
  });

  test("make_world given empty list, makes 0 length list 'actors'", () => {
    const world1 = W.make_world(player, [], CA.make_score(0));
    expect(world1.actors).toHaveLength(0);
  });

  test('detectCollisions function identifies actors at the same location', () => {
    const actor1 = A.make_actor(CA.make_player({ x: 0, y: 0 }).attributes, null);
    const actor2 = A.make_actor(CA.make_player({ x: 0, y: 0 }).attributes, null);
    const actor3 = A.make_actor(CA.make_player({ x: 0, y: 0 }).attributes, null);

    const collisions = CO.detectCollisions([actor1, actor2, actor3]);

    expect(collisions).toHaveLength(3);
    expect(collisions[0]).toContain(actor1);
    expect(collisions[0]).toContain(actor2);
  });

  test('dead actors are removed during tick', () => {
    const actor1 = A.make_actor(CA.make_stone({ x: 0, y: 0 }).attributes.kill(), null);
    const actor2 = A.make_actor(CA.make_stone({ x: 0, y: 0 }).attributes.kill(), null);

    const world = W.make_world(player, [actor1, actor2], CA.make_score(0));
    const newWorld = world.tick();

    expect(newWorld.actors).toHaveLength(0);
  });

  test('detectCollisions identifies multiple actors at the same location', () => {
    const actor1 = A.make_actor(CA.make_player({ x: 0, y: 0 }).attributes, null);
    const actor2 = A.make_actor(CA.make_player({ x: 0, y: 0 }).attributes, null);
    const actor3 = A.make_actor(CA.make_player({ x: 0, y: 0 }).attributes, null);

    const collisions = CO.detectCollisions([actor1, actor2, actor3]);
    expect(collisions).toHaveLength(3);

    expect(collisions).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([actor1, actor2]),
        expect.arrayContaining([actor1, actor3]),
        expect.arrayContaining([actor2, actor3])
      ])
    );
  });

  test('handleCollisions handles collisions between player and shooter correctly', () => {
    const player = CA.make_player({ x: 0, y: 0 });
    const shooter = CA.make_foe({ x: 0, y: 0 },actorType.SHOOTER);

    const world = W.make_world(player, [shooter], CA.make_score(0));

    CO.handleCollisions([world.player, ...world.actors]);
    const newWorld = world.tick();

    expect(newWorld.player.attributes.location).toEqual({ x: 0, y: 0 });
    expect(newWorld.actors[0].attributes.location).toEqual({ x: 0, y: 0 });

    expect(newWorld.player.attributes.health).toEqual(9);
    expect(newWorld.actors[0].attributes.health).toEqual(2);
  });

  test('handleCollisions handles collisions between player and stone correctly', () => {
    const player = CA.make_player({ x: 0, y: 0 });
    const stone = CA.make_stone({ x: 0, y: 0 });

    const world = W.make_world(player, [stone], CA.make_score(0));
    
    CO.handleCollisions([world.player, ...world.actors]);
    const newWorld = world.tick();

    expect(newWorld.player.attributes.location).toEqual({ x: 0, y: 0 });
    expect(newWorld.actors[0].attributes.location).toEqual({ x: 0, y: 0 });

    expect(newWorld.player.attributes.health).toEqual(9);
    expect(newWorld.actors[0].attributes.health).toEqual(2);
  });
});
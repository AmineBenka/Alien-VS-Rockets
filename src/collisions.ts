import * as A from '#src/actor.js';

function detectCollisions(actors: A.Actor[]): [A.Actor, A.Actor][] {
  // Generate all possible pairs of actors
  const generatePairs = (xs: A.Actor[]): [A.Actor, A.Actor][] =>
    xs.flatMap((a1, i) =>
      xs.slice(i + 1).map(a2 => [a1, a2] as [A.Actor, A.Actor])
    );

  // Filter pairs where actors are at the same position
  const areColliding = ([a1, a2]: [A.Actor, A.Actor]): boolean => {
    const l1 = a1.attributes.location;
    const l2 = a2.attributes.location;
    if(!l1 || !l2) throw new Error("areColliding called on pair w/ location");
    return l1.x === l2.x && l1.y === l2.y;
};

  const haveCollided = ([a1, a2]: [A.Actor, A.Actor]): boolean => {
    const l1 = a1.attributes.location;
    const l2 = a2.attributes.location;
    if(!l1 || !l2) throw new Error("haveCollided called on pair w/ location");

    if ((a1.oldVersion === null && a2.oldVersion === null) || a1.attributes.type === a2.attributes.type) {
      return false;
    }
    const a1Old = a1.oldVersion?.attributes.location ?? l1;
    const a2Old = a2.oldVersion?.attributes.location ?? l2;
    if ((l1.x === l2.x) &&
      ((a1Old.y < a2Old.y && l1.y > l2.y) ||
        (a1Old.y > a2Old.y && l1.y < l2.y))) {
      return true;
    }
    if ((l1.y === l2.y) &&
      ((a1Old.x < a2Old.x && l1.x > l2.x) ||
        (a1Old.x > a2Old.x && l1.x < l2.x))) {
      return true;
    }
    return false;
  };

  const collision = ([a1, a2]: [A.Actor, A.Actor]): boolean =>
    haveCollided([a1, a2]) || areColliding([a1, a2]);

  // Return the final collisions
  return generatePairs(actors).filter(collision);
}

function handleCollisions(actors: A.Actor[]) {
  // First, detect collisions between actors
  const collisions = detectCollisions(actors);

  // Process all collisions
  collisions.forEach(([a1, a2]) => {
    a1.send({ key: "collide", params: [a2.attributes.type, actors] });
    a2.send({ key: "collide", params: [a1.attributes.type, actors] });
  });
}

export {
    detectCollisions,
    handleCollisions,
  };
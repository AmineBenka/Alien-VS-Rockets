// Enum for actor types
enum actorType {
  PLAYER = 'Player',
  STONE = 'Stone',
  SHOOTER = 'Shooter',
  PLAYERBULLET = 'PlayerBullet',
  SHOOTERBULLET = 'ShooterBullet',
  BOSS = 'Boss',
  BOSSBODY = 'BossBody',
  BOSSBULLET = 'BossBullet',
  BOSSBOMB = 'BossBomb',
  POWERUP = 'Powerup',
  SHIELD = "Shield",
  FREEZE = "Freeze",
  SCORE = "Score",
  ANY = 'Any'
}

// Define a position type with x and y coordinates
type Position = { x: number, y: number };

function positionSum(p1:Position, p2: Position){
return {
  x : p1.x + p2.x,
  y : p1.y + p2.y
};
}

// Define a speed type 
type Speed = { x: number, y: number };

// Actions type for cleaner code
type Actions<A> = { [key: string]: (a: A, ...rest: any) => A }

type Attributes<A> = {
location? : Position,
type : actorType,
speed?: Speed,
actions: Actions<A>, // Actions the actor can perform
health?: number, // Health points of the actor
isDead?: boolean, // Indicates if actor should be removed
hasShield?: boolean,
score?: number,
icon: string,
kill : () => Attributes<A>,
shield : (v:boolean) => Attributes<A>,
incScore : () => Attributes<A>,
changeHealth : (n : number) => Attributes<A>,
changeLocation : (pos : Position) => Attributes<A>,
freeze : (b : boolean) => Attributes<A> 
};

function icon(t: actorType): string {
switch (t) {
  case actorType.PLAYER:
    return '🚀';
  case actorType.STONE:
    return '🪨';
  case actorType.BOSSBOMB:
    return '💣​';
  case actorType.PLAYERBULLET:
    return '-';
  case actorType.BOSSBULLET:
    return '-';
  case actorType.SHOOTERBULLET:
    return '•';
  case actorType.POWERUP:
    return '🧪';
  case actorType.FREEZE:
    return '❄️';
  case actorType.SHIELD:
    return '🛡️';
  case actorType.SHOOTER:
    return '👾';
  case actorType.BOSS:
    return '🦁';
  case actorType.BOSSBODY:
    return '=';
  case actorType.SCORE:
    return '🎯';
  default:
    return "";
}
}

function speed(t: actorType): Speed {
switch (t) {
  case actorType.STONE:
    return { x: 0, y: 0.4 };
  case actorType.SHOOTER:
    return { x: 0, y: 0.2 };
  case actorType.BOSSBOMB:
    return { x: 0, y: 0.3 };
  case actorType.PLAYERBULLET:
    return { x: 0, y: -0.8 };
  case actorType.SHOOTERBULLET:
    return { x: 0, y: 0.8 };
  case actorType.BOSSBULLET:
    return { x: 0, y: 1 };
  case actorType.POWERUP:
    return { x: 0, y: 0.3 };
  case actorType.FREEZE:
    return { x: 0, y: 0.3 };
  case actorType.SHIELD:
    return { x: 0, y: 0.3 };
  default:
    return { x: 0, y: 0 };
}
}

function health(t: actorType): number {
  switch (t) {
    case actorType.PLAYER:
      return 10;
    case actorType.STONE:
      return 3;
    case actorType.SHOOTER:
      return 3;
    case actorType.BOSSBOMB:
      return 20;
    case actorType.BOSSBULLET:
      return 2;
    case actorType.BOSS:
      return 20;
    case actorType.SHOOTERBULLET:
      return 1;
    case actorType.PLAYERBULLET:
      return 1;
    case actorType.BOSSBODY:
      return 100;
    default:
      return 0;
  }
}

function make_attribute<A>(params : {t: actorType,a: Actions<A>,p? : Position, speed? : Speed, health?: number, isDead?: boolean,hasShield?: boolean, score?: number}) : Attributes<A> {
const att = {
  type : params.t , actions : params.a, 
  location : params.p,
  speed : params.speed,
  health : params.health,
  isDead : params.isDead,
  hasShield : params.hasShield,
  score : params.score,
  icon : icon(params.t),
  kill: () => {
    return make_attribute({
      t: att.type,
      a: att.actions,
      p : att.location,
      speed: att.speed,
      health: att.health,
      isDead: true,
      hasShield: att.hasShield
    });
  },
  shield: (b: boolean) => {
    return make_attribute({
      t: att.type,
      a: att.actions,
      p : att.location,
      health: att.health,
      isDead: att.isDead,
      hasShield: b
    });
  },
  incScore : () =>{
    return make_attribute({
      t: att.type,
      a: att.actions,
      score : (att.score??0) + 1
    });
  },
  changeHealth : (n:number) =>{
    const newHealth = (att.health??0) + n;
    return make_attribute({
      t: att.type,
      a: att.actions,
      p: att.location,
      speed: att.speed,
      health: newHealth,
      isDead: (newHealth <= 0),
      hasShield: att.hasShield
    });
  },
  freeze : (b : boolean) => {
    return make_attribute({
      t: att.type,
      a: att.actions,
      p: att.location,
      speed: b ? {x:0,y:0} : speed(att.type),
      health: att.health,
      isDead: att.isDead,
      hasShield: att.hasShield
    });
  },
  changeLocation : (pos:Position) =>{
    return make_attribute({
      t: att.type,
      a: att.actions,
      p: positionSum(att.location!,pos),
      speed: att.speed,
      health: att.health,
      isDead: att.isDead,
      hasShield: att.hasShield
    });
  },
};
return att;
}


export{
actorType,
Position,
Actions,
Attributes,
health,
make_attribute,
speed,
};
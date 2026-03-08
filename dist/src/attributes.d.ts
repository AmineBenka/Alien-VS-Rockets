declare enum actorType {
    PLAYER = "Player",
    STONE = "Stone",
    SHOOTER = "Shooter",
    PLAYERBULLET = "PlayerBullet",
    SHOOTERBULLET = "ShooterBullet",
    BOSS = "Boss",
    BOSSBODY = "BossBody",
    BOSSBULLET = "BossBullet",
    BOSSBOMB = "BossBomb",
    POWERUP = "Powerup",
    SHIELD = "Shield",
    FREEZE = "Freeze",
    SCORE = "Score",
    ANY = "Any"
}
type Position = {
    x: number;
    y: number;
};
type Speed = {
    x: number;
    y: number;
};
type Actions<A> = {
    [key: string]: (a: A, ...rest: any) => A;
};
type Attributes<A> = {
    location?: Position;
    type: actorType;
    speed?: Speed;
    actions: Actions<A>;
    health?: number;
    isDead?: boolean;
    hasShield?: boolean;
    score?: number;
    icon: string;
    kill: () => Attributes<A>;
    shield: (v: boolean) => Attributes<A>;
    incScore: () => Attributes<A>;
    changeHealth: (n: number) => Attributes<A>;
    changeLocation: (pos: Position) => Attributes<A>;
    freeze: (b: boolean) => Attributes<A>;
};
declare function speed(t: actorType): Speed;
declare function health(t: actorType): number;
declare function make_attribute<A>(params: {
    t: actorType;
    a: Actions<A>;
    p?: Position;
    speed?: Speed;
    health?: number;
    isDead?: boolean;
    hasShield?: boolean;
    score?: number;
}): Attributes<A>;
export { actorType, Position, Actions, Attributes, health, make_attribute, speed, };

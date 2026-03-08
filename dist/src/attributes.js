// Enum for actor types
var actorType;
(function (actorType) {
    actorType["PLAYER"] = "Player";
    actorType["STONE"] = "Stone";
    actorType["SHOOTER"] = "Shooter";
    actorType["PLAYERBULLET"] = "PlayerBullet";
    actorType["SHOOTERBULLET"] = "ShooterBullet";
    actorType["BOSS"] = "Boss";
    actorType["BOSSBODY"] = "BossBody";
    actorType["BOSSBULLET"] = "BossBullet";
    actorType["BOSSBOMB"] = "BossBomb";
    actorType["POWERUP"] = "Powerup";
    actorType["SHIELD"] = "Shield";
    actorType["FREEZE"] = "Freeze";
    actorType["SCORE"] = "Score";
    actorType["ANY"] = "Any";
})(actorType || (actorType = {}));
function positionSum(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}
function icon(t) {
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
function speed(t) {
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
function health(t) {
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
function make_attribute(params) {
    const att = {
        type: params.t, actions: params.a,
        location: params.p,
        speed: params.speed,
        health: params.health,
        isDead: params.isDead,
        hasShield: params.hasShield,
        score: params.score,
        icon: icon(params.t),
        kill: () => {
            return make_attribute({
                t: att.type,
                a: att.actions,
                p: att.location,
                speed: att.speed,
                health: att.health,
                isDead: true,
                hasShield: att.hasShield
            });
        },
        shield: (b) => {
            return make_attribute({
                t: att.type,
                a: att.actions,
                p: att.location,
                health: att.health,
                isDead: att.isDead,
                hasShield: b
            });
        },
        incScore: () => {
            return make_attribute({
                t: att.type,
                a: att.actions,
                score: (att.score ?? 0) + 1
            });
        },
        changeHealth: (n) => {
            const newHealth = (att.health ?? 0) + n;
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
        freeze: (b) => {
            return make_attribute({
                t: att.type,
                a: att.actions,
                p: att.location,
                speed: b ? { x: 0, y: 0 } : speed(att.type),
                health: att.health,
                isDead: att.isDead,
                hasShield: att.hasShield
            });
        },
        changeLocation: (pos) => {
            return make_attribute({
                t: att.type,
                a: att.actions,
                p: positionSum(att.location, pos),
                speed: att.speed,
                health: att.health,
                isDead: att.isDead,
                hasShield: att.hasShield
            });
        },
    };
    return att;
}
export { actorType, health, make_attribute, speed, };
//# sourceMappingURL=attributes.js.map
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const terminalKit = require('terminal-kit');
const terminal = terminalKit.terminal;
type Timeout = ReturnType<typeof setTimeout>;

import * as At from '#src/attributes.js';
import * as Ac from '#src/actor.js';
import * as W from '#src/runtime.js';
import * as C from '#src/caracters.js';
import * as S from '#src/snapshot.js';

// Core game state structure
type GameState = {
    readonly world: W.world;
    readonly gameHistory: S.snapshot;
    readonly oldHealth: number;
    readonly hits: number;
    readonly heal: number;
    readonly warningTime: number;
    readonly healTime: number;
    readonly level: number;
    readonly shieldActive: boolean;
    readonly shieldStartTime: number | null;
    readonly freezeActive: boolean;
    readonly freezeTimeout: Timeout | null;
    readonly isBossMode: boolean;
    readonly gridWidth: number;
    readonly gridHeight: number;
    readonly stoneSpawnRate: number;
    readonly shooterSpawnRate: number;
};

const GRID_WIDTH = 70;
const SHIELD_DURATION = 20000;
const FREEZE_DURATION = 5000;

// Calculate playable area based on terminal dimensions
const getTerminalSize = () => {
    return {
        width: GRID_WIDTH,
        height: Math.max(20, terminal.height - 10)
    };
};

// Terminal setup/cleanup
const initializeTerminal = () => {
    terminal.clear();
    terminal.grabInput(true);

    return () => {
        terminal.grabInput(false);
        terminal.clear();
    };
};

// Initial game configuration
const createInitialState = (): GameState => {
    const terminalSize = getTerminalSize();
    const player = C.make_player({
        x: Math.floor(terminalSize.width / 2),
        y: Math.floor(terminalSize.height - 2)
    });
    const score = C.make_score(0);
    const world = W.make_world(player, [], score);

    return {
        world,
        gameHistory: S.make_snapshot(world),
        oldHealth: 10,
        hits: 0,
        heal: 0,
        warningTime: 0,
        healTime: 0,
        level: 0,
        shieldActive: false,
        shieldStartTime: null,
        freezeActive: false,
        freezeTimeout: null,
        isBossMode: false,
        gridWidth: terminalSize.width,
        gridHeight: terminalSize.height,
        stoneSpawnRate: 1500,
        shooterSpawnRate: 1500
    };
};

// Border generation utilities
const generateBorder = (width: number, height: number): string =>
    [
        `╔${'═'.repeat(width - 1)}╗`,
        ...Array.from({ length: height - 1 }, () => `║${' '.repeat(width - 1)}║`),
        `╚${'═'.repeat(width - 1)}╝`
    ].join('\n');

const printBorder = (width: number, height: number): void => {
    terminal.moveTo(0, 0).white(generateBorder(width, height));
};

// Health bar rendering with color coding
const renderHealthBar = (health: number, maxHealth: number = 10, width: number = 10): string => {
    const filledCells = Math.max(0, Math.ceil((health / maxHealth) * width));
    const emptyCells = width - filledCells;
    const healthPercent = health / maxHealth;

    const color = healthPercent > 0.75 ? '\x1b[42m' :
        healthPercent > 0.5 ? '\x1b[43m' :
            healthPercent > 0.25 ? '\x1b[45m' :
                '\x1b[41m';

    const filledPart = filledCells > 0 ? `${color}${'█'.repeat(filledCells)}\x1b[0m` : '';
    const emptyPart = emptyCells > 0 ? `\x1b[40m${'▒'.repeat(emptyCells)}\x1b[0m` : '';

    return filledPart + emptyPart;
};

// Main rendering logic
const renderWorld = (state: GameState): void => {
    const { world, warningTime, healTime, gridWidth, gridHeight } = state;

    terminal.clear();
    printBorder(gridWidth, gridHeight);

    if (!world.player.attributes.location) throw new Error('player w/ location.');
    if (world.player.attributes.health === undefined) throw new Error('player w/ health.');
    if (world.score.attributes.score === undefined) throw new Error("actor type 'score' w/ score.");

    // Player rendering with shield indicator
    if (world.player.attributes.hasShield) {
        terminal.moveTo(world.player.attributes.location.x, world.player.attributes.location.y - 1).blue('🛡️');
    }
    terminal.moveTo(world.player.attributes.location.x, world.player.attributes.location.y).green('🚀');

    // Actor rendering
    world.actors.forEach(actor => {
        // Only render actors that have a location and are within the visible area
        if (actor.attributes.location !== undefined &&
            actor.attributes.location.x >= 1 && actor.attributes.location.x <= gridWidth &&
            actor.attributes.location.y >= 1 && actor.attributes.location.y <= gridHeight) {
            terminal.moveTo(actor.attributes.location.x, actor.attributes.location.y).white(actor.attributes.icon);
        }
    });

    // Health bar rendering
    const healthBar = renderHealthBar(world.player.attributes.health);

    let statusEffects = '';
    if (warningTime > 0) {
        statusEffects = ` \x1b[41m\x1b[37mHIT!\x1b[0m`;
    } else if (healTime > 0) {
        statusEffects = ` \x1b[42m\x1b[37mHEAL!\x1b[0m`;
    }

    const uiStartY = gridHeight + 2;
    const uiLeftColumn = 1;
    const uiRightColumn = Math.floor(gridWidth / 2);

    // Left UI: Controls
    terminal.moveTo(uiLeftColumn, uiStartY).green('╔══════════════════════════╗');
    terminal.moveTo(uiLeftColumn, uiStartY + 1).green('║  Use ← → to move         ║');
    terminal.moveTo(uiLeftColumn, uiStartY + 2).green('║  SPACE to shoot          ║');
    terminal.moveTo(uiLeftColumn, uiStartY + 3).green('║  Q to quit               ║');
    terminal.moveTo(uiLeftColumn, uiStartY + 4).green('╚══════════════════════════╝');

    // Right UI: Game stats
    terminal.moveTo(uiRightColumn, uiStartY).red('╔═════════════════════════════╗');
    terminal.moveTo(uiRightColumn, uiStartY + 1).red(`║  Health: ${world.player.attributes.health}/${10} ${statusEffects}`);
    terminal.moveTo(uiRightColumn + 30, uiStartY + 1).red('║');
    terminal.moveTo(uiRightColumn, uiStartY + 2).red(`║  Health Bar : ${healthBar}`);
    terminal.moveTo(uiRightColumn + 30, uiStartY + 2).red('║');
    terminal.moveTo(uiRightColumn, uiStartY + 3).red(`║  level: ${state.level}`);
    terminal.moveTo(uiRightColumn + 30, uiStartY + 3).red('║');
    terminal.moveTo(uiRightColumn, uiStartY + 4).red('║                             ║');
    terminal.moveTo(uiRightColumn, uiStartY + 5).red(`║  Score: ${Math.floor(world.score.attributes.score!)}`);
    terminal.moveTo(uiRightColumn + 30, uiStartY + 5).red('║');
    terminal.moveTo(uiRightColumn, uiStartY + 6).red('╚═════════════════════════════╝');

    if (world.player.attributes.hasShield) {
        terminal.moveTo(uiRightColumn, uiStartY + 4).red('║  Shield:');
        terminal.moveTo(uiRightColumn + 11, uiStartY + 4).green('ACTIVE');
    } else {
        terminal.moveTo(uiRightColumn, uiStartY + 4).red('║  Shield: INACTIVE           ║');
    }

    if (world.score.attributes.score! > 2000) {
        const Boss = world.actors.find(actor => actor.attributes.type === At.actorType.BOSS);
        if (Boss) {
            if (!Boss.attributes.health) throw new Error("Boss w/ health.");
            const bossHealthBar = renderHealthBar(Boss.attributes.health, 100, 15);
            terminal.moveTo(uiRightColumn, uiStartY + 8).red(`Boss health: ${bossHealthBar}`);
        }
    }
};

// Entity movement constraints
const constrainToGrid = (world: W.world, gridWidth: number, gridHeight: number): W.world => {
    const constrained = world.actors.map((actor: Ac.Actor) => {
        if (actor.attributes.type !== At.actorType.SCORE) {
            if (actor.attributes.location === undefined) throw new Error("actor, which isn't of type score, w/location");

            if (
                (actor.attributes.type === At.actorType.PLAYERBULLET && actor.attributes.location.y <= 2) ||
                actor.attributes.location.y > gridHeight
            ) {
                return Ac.make_actor(actor.attributes.kill(), actor.oldVersion);
            }

            const x = actor.attributes.location.x;
            const shiftX = (x < 2) ? (2 - x) : (x > gridWidth - 1) ? (gridWidth - 1 - x) : 0;
            const shiftPos = { x: shiftX, y: 0 };
            return Ac.make_actor(actor.attributes.changeLocation(shiftPos), actor.oldVersion, actor.update);
        }
        return actor;
    });

    if (world.player.attributes.location === undefined) throw new Error("player w/ locations.");
    const x = world.player.attributes.location.x;
    const shiftX = (x < 2) ? (3 - x) : (x > gridWidth - 1) ? (gridWidth - 2 - x) : 0;
    const shiftPos = { x: shiftX, y: 0 };
    const constrainedPlayer = Ac.make_actor(world.player.attributes.changeLocation(shiftPos), world.player.oldVersion, world.player.update);

    return W.make_world(constrainedPlayer, [...constrained, ...world.added], world.score);
};

// Entity generators
const generateStone = (world: W.world): W.world => {
    const X = world.player.attributes.location!.x + Math.floor(Math.random() * 19) - 9;
    const Y = Math.floor(2);
    const newStone = C.make_stone({ x: X, y: Y });
    const newWorld = { ...world };
    newWorld.include([newStone]);
    return newWorld;
};

const generateShooter = (world: W.world): W.world => {
    const X = world.player.attributes.location!.x + Math.floor(Math.random() * 25) - 10;
    const Y = Math.floor(2) + 5;
    const newShooter = C.make_foe({ x: X, y: Y }, At.actorType.SHOOTER);
    const newWorld = { ...world };
    newWorld.include([newShooter]);
    return newWorld;
};

const generateShooterBullet = (world: W.world): W.world => {
    const newWorld = { ...world };
    world.actors.forEach(actor => {
        if (actor.attributes.type === At.actorType.SHOOTER) {
            if (!actor.attributes.location) throw new Error("Shooter w/location.");
            const bulletPos = { x: actor.attributes.location.x, y: actor.attributes.location.y + 1 };
            const bullet = C.make_bullet(bulletPos, At.actorType.SHOOTERBULLET);
            actor.send({ key: "shoot", params: [bullet] });
        }
    });
    return newWorld;
};

const generatePotion = (world: W.world, type: At.actorType, gridWidth: number): W.world => {
    const X = Math.floor(Math.random() * gridWidth) + 1;
    const Y = Math.floor(2);
    const potion = C.make_potion({ x: X, y: Y }, type);
    const newWorld = { ...world };
    newWorld.include([potion]);
    return newWorld;
};

const generateBoss = (world: W.world, gridWidth: number): W.world => {
    const X = gridWidth / 2;
    const Y = 2;
    const boss = C.make_foe({ x: X, y: Y }, At.actorType.BOSS);

    // Adjust boss body parts based on terminal width
    const maxBodyParts = Math.min(10, Math.floor(gridWidth / 2) - 5);
    const bodyParts = [];

    for (let i = 1; i <= maxBodyParts / 2; i++) {
        bodyParts.push(C.make_foe({ x: X + i, y: Y }, At.actorType.BOSSBODY));
        bodyParts.push(C.make_foe({ x: X - i, y: Y }, At.actorType.BOSSBODY));
    }

    const newWorld = { ...world };
    newWorld.include([boss, ...bodyParts]);
    return newWorld;
};

const generateBossBullet = (world: W.world, gridWidth: number): W.world => {
    const newWorld = { ...world };

    world.actors.forEach(actor => {
        if (actor.attributes.type === At.actorType.BOSS) {
            const bullet1Pos = { x: actor.attributes.location!.x, y: actor.attributes.location!.y + 1 };
            const bullet1 = C.make_bullet(bullet1Pos, At.actorType.BOSSBULLET);

            // Only add side bullets if there's enough screen width
            const bullets = [bullet1];

            if (gridWidth >= 30) {
                const bullet2Pos = { x: actor.attributes.location!.x + 3, y: actor.attributes.location!.y + 1 };
                const bullet2 = C.make_bullet(bullet2Pos, At.actorType.BOSSBULLET);
                const bullet3Pos = { x: actor.attributes.location!.x - 3, y: actor.attributes.location!.y + 1 };
                const bullet3 = C.make_bullet(bullet3Pos, At.actorType.BOSSBULLET);
                bullets.push(bullet2, bullet3);
            }

            bullets.forEach((b) => actor.send({ key: "shoot", params: [b] }));
            return;
        }
    });

    return newWorld;
};

const generateBossBomb = (world: W.world): W.world => {
    const newWorld = { ...world };

    world.actors.forEach(actor => {
        if (actor.attributes.type === At.actorType.BOSS) {
            const bombPos = { x: actor.attributes.location!.x, y: actor.attributes.location!.y + 1 };
            const Bomb = C.make_bullet(bombPos, At.actorType.BOSSBOMB);
            actor.send({ key: "shoot", params: [Bomb] });
        }
    });

    return newWorld;
};

const moveBoss = (world: W.world, gridWidth: number): W.world => {
    const player_pos = world.player.attributes.location!;
    const boss = world.actors.find(actor => actor.attributes.type === At.actorType.BOSS);

    if (!boss) return world;

    const boss_pos = boss.attributes.location!;
    const X = boss_pos.x - player_pos.x;

    const rightEdge = gridWidth - 6;
    const leftEdge = 6;

    const newWorld = { ...world };

    if (X < 0.6) {
        if (boss_pos.x >= rightEdge) return world;

        world.actors.forEach(actor => {
            if (actor.attributes.type === At.actorType.BOSS || actor.attributes.type === At.actorType.BOSSBODY) {
                actor.send({ key: 'move', params: [0.2, 0] });
            }
        });
    } else if (X > 0) {
        if (boss_pos.x <= leftEdge) return world;

        world.actors.forEach(actor => {
            if (actor.attributes.type === At.actorType.BOSS || actor.attributes.type === At.actorType.BOSSBODY) {
                actor.send({ key: 'move', params: [-0.2, 0] });
            }
        });
    }

    return newWorld;
};

const countType = (actors: Ac.Actor[], type: At.actorType): number => {
    const actorsOfType = actors.filter((x) => x.attributes.type === type);
    return actorsOfType.length;
};

const calculateStoneSpawnRate = (score: number): number => {
    if (score > 1000) return 500;
    if (score > 500) return 700;
    if (score > 200) return 1000;
    return 1500;
};

// Input handling
const handleKeyInput = (name: string, state: GameState): GameState => {
    const { world } = state;

    if (name === 'CTRL_C' || name === 'q') {
        terminal.grabInput(false);
        terminal.clear();
        terminal.red.bold('\nGAME OVER !\n\n');
        process.exit();
        return state;
    }

    let newWorld = world;

    if (name === 'LEFT') {
        world.player.send({ key: 'move', params: [-1, 0] });
    }

    if (name === 'RIGHT') {
        world.player.send({ key: 'move', params: [1, 0] });
    }

    if (name === 'SPACE' || name === ' ') {
        const bullet = C.make_bullet(
            { x: world.player.attributes.location!.x, y: world.player.attributes.location!.y - 1 },
            At.actorType.PLAYERBULLET
        );
        world.player.send({ key: "shoot", params: [bullet] });
    }

    if (name === 't' || name === 'T') {
        newWorld = state.gameHistory.revert(5);
    }

    return {
        ...state,
        world: newWorld
    };
};

// Core game loop logic
const updateGameState = (state: GameState): GameState => {
    const { world, oldHealth, gridWidth, gridHeight } = state;

    const worldConstrained = constrainToGrid(world, gridWidth, gridHeight);

    const currentHealth = worldConstrained.player.attributes.health!;
    const healthDiff = currentHealth - oldHealth;

    const newHits = healthDiff < 0 ? state.hits + Math.abs(healthDiff) : state.hits;
    const newHeal = healthDiff > 0 ? state.heal + healthDiff : state.heal;

    const newWarningTime = healthDiff < 0 ? 10 : state.warningTime > 0 ? state.warningTime - 1 : 0;
    const newHealTime = healthDiff > 0 ? 10 : state.healTime > 0 ? state.healTime - 1 : 0;

    const score = worldConstrained.score.attributes.score!;
    const newStoneSpawnRate = calculateStoneSpawnRate(score);

    const worldTicked = worldConstrained.tick();
    const gameHistory = state.gameHistory.save(worldTicked);

    const isBossMode = score > 2000;

    return {
        ...state,
        world: worldTicked,
        gameHistory,
        oldHealth: currentHealth,
        hits: newHits,
        heal: newHeal,
        warningTime: newWarningTime,
        healTime: newHealTime,
        stoneSpawnRate: newStoneSpawnRate,
        isBossMode
    };
};

// Power-up systems
const handleShield = (state: GameState): GameState => {
    const { world, shieldActive, shieldStartTime } = state;

    // Activate shield if picked up
    if (world.player.attributes.hasShield && !shieldActive) {
        return {
            ...state,
            shieldActive: true,
            shieldStartTime: Date.now(),
        };
    }

    // Deactivate shield after duration
    if (shieldActive && shieldStartTime !== null) {
        const currentTime = Date.now();
        if (currentTime - shieldStartTime >= SHIELD_DURATION) {
            // Update player attributes to disable shield
            const updatedAttributes = {
                ...world.player.attributes,
                hasShield: false
            };
            const updatedPlayer = Ac.make_actor(updatedAttributes, world.player.oldVersion, world.player.update);
            const updatedWorld = W.make_world(updatedPlayer, world.actors, world.score);

            return {
                ...state,
                world: updatedWorld,
                shieldActive: false,
                shieldStartTime: null,
            };
        }
    }

    return state;
};


// Spawner systems
const setupStoneSpawner = (updateState: (stateUpdater: (currentState: GameState) => GameState) => void) => {
    const spawnStones = (state: GameState) => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.isBossMode) return currentState;

                const maxStones = Math.max(3, Math.floor(currentState.gridWidth / 8));
                const stoneCount = countType(currentState.world.actors, At.actorType.STONE);

                let newWorld = currentState.world;
                if (stoneCount < maxStones) {
                    newWorld = generateStone(newWorld);
                }

                return { ...currentState, world: newWorld };
            });

            updateState((currentState) => {
                spawnStones(currentState);
                return currentState;
            });

        }, state.stoneSpawnRate);
    };

    updateState((state) => {
        spawnStones(state);
        return state;
    });
};

const setupShooterSpawner = (updateState: (stateUpdater: (currentState: GameState) => GameState) => void) => {
    const spawnShooters = (state: GameState) => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.isBossMode || currentState.world.score.attributes.score! <= 500) {
                    return currentState;
                }

                const maxShooters = Math.max(1, Math.floor(currentState.gridWidth / 20));
                const shooterCount = countType(currentState.world.actors, At.actorType.SHOOTER);

                let newWorld = currentState.world;
                if (shooterCount < maxShooters) {
                    newWorld = generateShooter(newWorld);
                }

                const newShooterSpawnRate =
                    currentState.world.score.attributes.score! > 1000 ? 1000 : currentState.shooterSpawnRate;

                return {
                    ...currentState,
                    world: newWorld,
                    shooterSpawnRate: newShooterSpawnRate
                };
            });

            updateState((currentState) => {
                spawnShooters(currentState);
                return currentState;
            });

        }, state.shooterSpawnRate);
    };

    updateState((state) => {
        spawnShooters(state);
        return state;
    });
};

const setupShooterBulletSpawner = (updateState: (stateUpdater: (currentState: GameState) => GameState) => void) => {
    const spawnShooterBullets = () => {
        setTimeout(() => {
            updateState((currentState) => {
                const newWorld = generateShooterBullet(currentState.world);
                return { ...currentState, world: newWorld };
            });

            spawnShooterBullets();
        }, 800);
    };

    spawnShooterBullets();
};

const setupPotionSpawner = (updateState: (stateUpdater: (currentState: GameState) => GameState) => void) => {
    const spawnMagicPotions = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.isBossMode) return currentState;

                const magicPotionCount = countType(currentState.world.actors, At.actorType.POWERUP);
                let newWorld = currentState.world;

                if (magicPotionCount < 1) {
                    newWorld = generatePotion(newWorld, At.actorType.POWERUP, currentState.gridWidth);
                }

                return { ...currentState, world: newWorld };
            });

            spawnMagicPotions();
        }, 10000);
    };

    const spawnShieldPotions = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.isBossMode) return currentState;

                const shieldCount = countType(currentState.world.actors, At.actorType.SHIELD);
                let newWorld = currentState.world;

                if (shieldCount < 1) {
                    newWorld = generatePotion(newWorld, At.actorType.SHIELD, currentState.gridWidth);
                }

                return { ...currentState, world: newWorld };
            });

            spawnShieldPotions();
        }, 20000);
    };

    const spawnFreezePotions = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.isBossMode) return currentState;

                const freezeCount = countType(currentState.world.actors, At.actorType.FREEZE);
                let newWorld = currentState.world;

                if (freezeCount < 1) {
                    newWorld = generatePotion(newWorld, At.actorType.FREEZE, currentState.gridWidth);
                }

                return { ...currentState, world: newWorld };
            });

            spawnFreezePotions();
        }, 15000);
    };

    spawnMagicPotions();
    spawnShieldPotions();
    spawnFreezePotions();
};

const setupBossMode = (updateState: (stateUpdater: (currentState: GameState) => GameState) => void) => {
    const spawnBossBullets = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (!currentState.isBossMode) return currentState;

                const newWorld = generateBossBullet(currentState.world, currentState.gridWidth);
                return { ...currentState, world: newWorld };
            });

            spawnBossBullets();
        }, 5000);
    };

    const spawnBossBomb = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (!currentState.isBossMode) return currentState;

                const bombCount = countType(currentState.world.actors, At.actorType.BOSSBOMB);
                let newWorld = currentState.world;

                if (bombCount < 1) {
                    newWorld = generateBossBomb(currentState.world);
                }

                return { ...currentState, world: newWorld };
            });

            spawnBossBomb();
        }, 5000);
    };

    const updateBossPosition = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (!currentState.isBossMode) return currentState;

                const newWorld = moveBoss(currentState.world, currentState.gridWidth);
                return { ...currentState, world: newWorld };
            });

            updateBossPosition();
        }, 50);
    };

    const checkBossMode = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.isBossMode) {
                    const hasBoss = currentState.world.actors.some(actor => actor.attributes.type === At.actorType.BOSS);

                    if (!hasBoss) {
                        const newWorld = generateBoss(currentState.world, currentState.gridWidth);

                        const cleanedWorld = { ...newWorld };
                        cleanedWorld.actors = cleanedWorld.actors.filter(actor =>
                            actor.attributes.type === At.actorType.BOSS ||
                            actor.attributes.type === At.actorType.BOSSBODY ||
                            actor.attributes.type === At.actorType.BOSSBOMB
                        );

                        return { ...currentState, world: cleanedWorld };
                    }
                }

                return currentState;
            });

            checkBossMode();
        }, 1000);
    };

    const checkBossDefeat = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (!currentState.isBossMode) return currentState;

                const boss = currentState.world.actors.find(actor => actor.attributes.type === At.actorType.BOSS);

                if (boss && boss.attributes.health === 0) {
                    terminal.clear();
                    const bigMessage = [
                        ' **_**___ * *** **______ __ _',
                        ' \\ \\ / / ** \\| | | | \\ \\ / / / ** \\ | \\ | |',
                        ' \\ \\_/ / | | | | | | \\ \\ __ / / | | | | | \\ | |',
                        ' \\ /| | | | | | | \\ \\ / \\ / / | | | | | | |\\ \\ | |',
                        ' | | | |__| | |__| | \\ \\/ /\\ \\/ / | |__| | | | \\ \\| |',
                        ' |_| \\____/ \\____/ \\__/ \\__/ \\______/ |_| \\___|',
                        ' ',
                        ' 🎉 YOU WON! 🎉 '
                    ];

                    bigMessage.forEach((line, index) => {
                        terminal.moveTo(1, index + 5).cyan.bold(line);
                    });

                    terminal.cyan.bold('\n');
                    process.exit();
                }

                return currentState;
            });

            checkBossDefeat();
        }, 500);
    };

    spawnBossBullets();
    spawnBossBomb();
    updateBossPosition();
    checkBossMode();
    checkBossDefeat();
};

const setupFreezeSystem = (updateState: (stateUpdater: (currentState: GameState) => GameState) => void) => {
    const monitorFreezeEffect = () => {
        setTimeout(() => {
            updateState((currentState) => {
                if (currentState.freezeActive) {
                    return currentState;
                }

                const hasFreezeContact = currentState.world.actors.some(actor =>
                    actor.attributes.type === At.actorType.FREEZE &&
                    actor.attributes.location &&
                    currentState.world.player.attributes.location &&
                    Math.abs(actor.attributes.location.x - currentState.world.player.attributes.location.x) < 2 &&
                    Math.abs(actor.attributes.location.y - currentState.world.player.attributes.location.y) < 2
                );

                if (hasFreezeContact) {
                    const newWorld = { ...currentState.world };

                    const frozen = newWorld.actors.filter(actor => actor.attributes.type === At.actorType.SHOOTER || actor.attributes.type === At.actorType.STONE );
                    newWorld.player.contact({ key: "freeze", params: [true] }, frozen);

                    if (currentState.freezeTimeout) {
                        clearTimeout(currentState.freezeTimeout);
                    }

                    const newFreezeTimeout = setTimeout(() => {
                        updateState((freezeState) => {
                            const frozen = freezeState.world.actors.filter(actor => actor.attributes.type === At.actorType.SHOOTER || actor.attributes.type === At.actorType.STONE );
                            freezeState.world.player.contact({ key: "freeze", params: [false] }, frozen);
                            return { ...freezeState, freezeActive: false };
                        });
                    }, FREEZE_DURATION);

                    return {
                        ...currentState,
                        world: newWorld,
                        freezeActive: true,
                        freezeTimeout: newFreezeTimeout
                    };
                }

                return currentState;
            });

            monitorFreezeEffect();
        }, 100);
    };

    monitorFreezeEffect();
};

const startGame = () => {
    const cleanup = initializeTerminal();

    let gameState = createInitialState();

    const updateState = (stateUpdater: (currentState: GameState) => GameState) => {
        gameState = stateUpdater(gameState);
    };

    setupStoneSpawner(updateState);
    setupShooterSpawner(updateState);
    setupShooterBulletSpawner(updateState);
    setupPotionSpawner(updateState);
    setupBossMode(updateState);
    setupFreezeSystem(updateState);

    const gameLoop = () => {
        updateState((currentState) => {
            if (currentState.world.player.attributes.isDead === true) {
                cleanup();
                terminal.red.bold('\nGAME OVER !\n');
                terminal.green.bold(`Your score: ${currentState.world.score.attributes.score}\n\n`);
                process.exit();
                return currentState;
            }

            const updatedState = updateGameState(currentState);

            const shieldHandledState = handleShield(updatedState);

            renderWorld(shieldHandledState);

            return shieldHandledState;
        });

        setTimeout(gameLoop, 50);
    };

    gameLoop();

    terminal.on('key', (name: string) => {
        updateState((currentState) => handleKeyInput(name, currentState));
    });

    process.on('exit', cleanup);
    process.on('SIGINT', () => {
        cleanup();
        process.exit();
    });
};

startGame();

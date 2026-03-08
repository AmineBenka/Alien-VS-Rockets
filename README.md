# 🚀 Rocket vs Alien

> A terminal-based shoot 'em up built with TypeScript and a functional actor model.

The player pilots a rocket through increasingly hostile waves of aliens, rocks, and chaos — surviving as long as possible while collecting power-ups and racking up score. The project is also a demonstration of how **functional programming principles** can power a real-time interactive game.

---

## Gameplay

| Entity | Role |
|--------|------|
| 🚀 Rocket | Player-controlled ship |
| 👾 Aliens | Enemies that shoot back |
| 🪨 Rocks | Environmental hazards |
| 💥 Bullets | Projectiles (yours and theirs) |
| 🧪 Potions | Health recovery |
| ⚡ Power-ups | Temporary boosts |

**Objective:** Dodge rocks and enemy fire, shoot aliens, grab power-ups, and survive as long as possible. Difficulty scales over time.

**Controls:** Arrow keys to move, `SPACE` to shoot.

---

## Installation & Usage

```bash
npm install   # Install dependencies
make          # Compile TypeScript
make run  # Launch the game
```

---

## Architecture

### Actor Model

Every game entity is an **actor** — a self-contained unit that holds its own state and reacts to messages.

```ts
type Actor = {
  update:    (actor: Actor) => Actor
  send:      (message: Message) => Actor | void
  create:    (actor: Actor) => void
  contact:   (message: Message, actors: Actor[]) => void
  oldVersion: Actor | null
  attributes: Attributes<Actor>
}
```

At each game tick, actors:
1. Receive incoming messages
2. Update their internal state (returning a new actor, never mutating)
3. Optionally emit messages to other actors or spawn new ones

Message processing is deferred to the end of each tick, guaranteeing **deterministic, reproducible behavior**.

---

### World Runtime

The `World` is the top-level coordinator for the entire game state:

```ts
type World = {
  player:   Actor
  actors:   Actor[]
  score:    Actor
  added:    Actor[]
  tick:       () => World
  transmit:   (messages: Message[]) => void
  include:    (newActors: Actor[]) => void
}
```

Each call to `tick()` returns a **new World** — the previous state is never modified. The runtime handles:

- Actor updates and message dispatch
- Collision detection and resolution
- Movement and position tracking
- Spawning new actors
- Score management

---

### Collision System

Two collision modes are supported:

- **Static** — two actors occupy the same cell at the same tick
- **Dynamic** — two actors cross paths *between* ticks (prevents tunneling)

On collision, both actors receive a `collide` message and respond independently.

---

### Rendering

Terminal rendering is powered by [Terminal-kit](https://github.com/cronvel/terminal-kit), with async keyboard input:

```ts
// Draw an enemy
terminal.moveTo(enemy.x, enemy.y)
terminal.red('X')

// Handle input
terminal.on('key', (name) => {
  if (name === 'LEFT')  moveLeft()
  if (name === 'SPACE') shoot()
})
```

---

## Functional Programming Principles

| Principle | Application |
|-----------|-------------|
| **Immutability** | Every `update()` returns a new actor/world; nothing is mutated in place |
| **Pure functions** | Game logic has no hidden dependencies on global state |
| **Isolated side effects** | Terminal I/O and keyboard input are handled at the edges, not scattered through business logic |

---

## Project Structure

```
rocket-vs-alien/
├── src/
│   ├── actors/       # Actor definitions (rocket, alien, bullet…)
│   ├── actions/      # Behaviors and state transitions
│   ├── attributes/   # Actor properties (position, health, speed…)
│   ├── runtime/      # World engine and tick loop
│   ├── world/        # World initialization and management
│   └── rendering/    # Terminal display layer
├── Makefile
└── package.json
```

---

## Concepts Demonstrated

- Actor model architecture in a real-time context
- Immutable state management without a framework
- Message-driven inter-entity communication
- Deterministic collision detection (static + dynamic)
- Functional programming applied to game development
- Terminal-based rendering and async input handling
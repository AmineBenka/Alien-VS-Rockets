import * as W from '#src/runtime.js';

type snapshot = {
    worlds: W.world[];
    current: number;
    save: (w: W.world) => snapshot;
    revert: (steps?: number) => W.world;
}

function make_snapshot(initialWorld: W.world): snapshot {
    const snap: snapshot = {
        worlds: [initialWorld],
        current: 0,

        save: (w: W.world): snapshot => {
            if (snap.current < snap.worlds.length - 1) {
                snap.worlds = snap.worlds.slice(0, snap.current + 1);
            }

            snap.worlds.push(w);

            snap.current = snap.worlds.length - 1;

            return snap;
        },

        revert: (steps: number = 1): W.world => {
            const newIndex = Math.max(0, snap.current - steps);
            snap.current = newIndex;

            return snap.worlds[newIndex];
        }
    };

    return snap;
}

export {
    snapshot,
    make_snapshot,
};
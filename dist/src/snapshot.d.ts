import * as W from '#src/runtime.js';
type snapshot = {
    worlds: W.world[];
    current: number;
    save: (w: W.world) => snapshot;
    revert: (steps?: number) => W.world;
};
declare function make_snapshot(initialWorld: W.world): snapshot;
export { snapshot, make_snapshot, };

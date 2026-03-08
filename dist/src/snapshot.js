function make_snapshot(initialWorld) {
    const snap = {
        worlds: [initialWorld],
        current: 0,
        save: (w) => {
            if (snap.current < snap.worlds.length - 1) {
                snap.worlds = snap.worlds.slice(0, snap.current + 1);
            }
            snap.worlds.push(w);
            snap.current = snap.worlds.length - 1;
            return snap;
        },
        revert: (steps = 1) => {
            const newIndex = Math.max(0, snap.current - steps);
            snap.current = newIndex;
            return snap.worlds[newIndex];
        }
    };
    return snap;
}
export { make_snapshot, };
//# sourceMappingURL=snapshot.js.map
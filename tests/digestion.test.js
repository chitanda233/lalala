import test from "node:test";
import assert from "node:assert/strict";

import { getOutcomePool } from "../src/game/outcome-pool.js";
import { createAimingSession, lockSessionForce, restoreSession } from "../src/game/session.js";
import { normalizeSelection } from "../src/game/selection.js";

const meal = { foodIds: ["rice", "enoki"], force: 50 };

test("digestion time is saved but does not override an exact food, drink and force recipe", () => {
  const expected = getOutcomePool({ ...meal, digestionTime: "4" });
  for (const digestionTime of ["2", "8", "random"])
    assert.deepEqual(getOutcomePool({ ...meal, digestionTime }), expected);
  assert.equal(normalizeSelection({ digestionTime: "unknown" }).digestionTime, "4");
});

test("random preview is the exact equal mixture of all three digestion pools", () => {
  const expected = new Map();
  for (const digestionTime of ["2", "4", "8"])
    for (const entry of getOutcomePool({ ...meal, digestionTime }))
      expected.set(
        entry.specimenId,
        (expected.get(entry.specimenId) || 0) + entry.probability / 3,
      );
  const pool = getOutcomePool({ ...meal, digestionTime: "random" });
  assert.ok(
    Math.abs(pool.reduce((sum, entry) => sum + entry.probability, 0) - 1) <
      1e-12,
  );
  for (const entry of pool)
    assert.ok(
      Math.abs(entry.probability - expected.get(entry.specimenId)) < 1e-12,
    );
  assert.ok(
    pool
      .filter((entry) => entry.special)
      .reduce((sum, entry) => sum + entry.probability, 0) <=
      0.02 + 1e-12,
  );
});

test("random digestion is drawn once on start, restored, and never adds a result delay", () => {
  for (const [draw, choice] of [
    [0, "2"],
    [0.5, "4"],
    [0.999, "8"],
  ]) {
    let draws = 0;
    const session = createAimingSession(
      { ...meal, digestionTime: "random" },
      {
        now: 1000,
        random: () => {
          draws++;
          return draw;
        },
      },
    );
    assert.equal(draws, 1);
    assert.equal(session.digestionTime, choice);
    assert.equal(session.outcome, null);
    assert.deepEqual(
      restoreSession(JSON.parse(JSON.stringify(session))),
      session,
    );
    lockSessionForce(session, {
      now: 1750,
      random: () => {
        draws++;
        return 0.5;
      },
    });
    assert.equal(draws, 3);
    assert.equal(session.digestionTime, choice);
    assert.equal(session.endsAt - session.lockedAt, 400);
    assert.ok(session.outcome.marks.includes("enoki"));
    assert.deepEqual(restoreSession(session), session);
  }
});

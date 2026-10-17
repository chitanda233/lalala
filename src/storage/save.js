import { gameConfig } from "../config/game.js";
import { settleSession, lockSessionForce } from "../game/session.js";
import { normalizeSave } from "./model.js";

export function createSaveStore(getStorage = () => globalThis.localStorage) {
  let memory = normalizeSave();
  let available = true;
  function read() {
    try {
      const raw = getStorage().getItem(gameConfig.storageKey);
      memory = normalizeSave(raw ? JSON.parse(raw) : {});
    } catch {
      available = false;
    }
    return structuredClone(memory);
  }
  function write(save) {
    memory = structuredClone(save);
    try {
      getStorage().setItem(gameConfig.storageKey, JSON.stringify(save));
    } catch {
      available = false;
    }
    return available;
  }
  async function settle(expectedId, now = Date.now()) {
    const commit = () => {
      const save = available ? read() : structuredClone(memory);
      if (save.session?.id !== expectedId) return { save, result: null };
      const result = settleSession(save, now);
      write(save);
      return { save, result };
    };
    // Browser locks serialize settlements from multiple open tabs.
    return globalThis.navigator?.locks
      ? navigator.locks.request(`${gameConfig.storageKey}:settle`, commit)
      : commit();
  }
  async function lockForce(expectedId, now = Date.now()) {
    const commit = () => {
      const save = available ? read() : structuredClone(memory);
      if (save.session?.id !== expectedId) return { save, locked: false };
      const locked = lockSessionForce(save.session, { now });
      if (locked) write(save);
      return { save, locked };
    };
    return globalThis.navigator?.locks
      ? navigator.locks.request(`${gameConfig.storageKey}:settle`, commit)
      : commit();
  }
  return {
    read,
    write,
    settle,
    lockForce,
    get available() {
      return available;
    },
  };
}

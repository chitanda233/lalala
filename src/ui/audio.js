import { $ } from "./dom.js";
import { rareRevealTheme } from "./rare-reveal.js";

export function createAudio(isEnabled) {
  let audioContext;
  const activeNotes = new Set();
  const resultNotes = new Set();
  function stop(notes = activeNotes) {
    for (const oscillator of [...notes]) {
      try {
        oscillator.stop();
      } catch {
        // A note may already have ended between the UI event and cleanup.
      }
      activeNotes.delete(oscillator);
      resultNotes.delete(oscillator);
    }
  }
  function sound(
    notes = [390, 520],
    length = 0.1,
    voice = "sine",
    result = false,
  ) {
    if (!isEnabled()) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended")
        audioContext.resume().catch(() => {});
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = voice;
        oscillator.frequency.value = frequency;
        const at = audioContext.currentTime + index * length;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.05, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, at + length);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        activeNotes.add(oscillator);
        if (result) resultNotes.add(oscillator);
        oscillator.onended = () => {
          activeNotes.delete(oscillator);
          resultNotes.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(at);
        oscillator.stop(at + length + 0.02);
      });
    } catch {
      /* Audio is optional; the game also runs without an audio device. */
    }
  }

  function render() {
    if (!isEnabled()) stop();
    $("#sound-button").innerHTML =
      `<svg class="icon"><use href="#i-${isEnabled() ? "sound" : "mute"}"/></svg><span>音效${isEnabled() ? "开" : "关"}</span>`;
    $("#sound-button").setAttribute("aria-pressed", isEnabled());
    $("#sound-button").setAttribute(
      "aria-label",
      `${isEnabled() ? "关闭" : "开启"}音效`,
    );
  }

  function playResult(character) {
    stop(resultNotes);
    const theme = rareRevealTheme(character);
    if (theme) sound(theme.notes, 0.15, "triangle", true);
    else sound([523.25, 659.25, 783.99, 1046.5], 0.13, "sine", true);
  }

  return {
    play: sound,
    playResult,
    stop: () => stop(),
    stopResult: () => stop(resultNotes),
    render,
  };
}

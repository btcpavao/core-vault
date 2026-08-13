# Audio and motion

Audio is off by default. The walkthrough asks separately for consent; skipping the walkthrough does not enable sound.

- Interaction sound is a short locally synthesized Web Audio tone.
- Ambient sound is a very quiet locally synthesized oscillator.
- No audio file, microphone permission, telemetry, or network request is used.
- Mute is always available in the status rail.
- Ambient, interaction, volume, and mute preferences contain no wallet data.

Motion respects the operating-system `prefers-reduced-motion` setting on first use and can be overridden in Settings. Reduced motion collapses transitions and stops decorative animation while preserving every state change and control.

# WhackASuh

## Team Members

- Aariv Modi
- Arya Santosh
- Trafim Nosko

## Project Description

WhackASuh is a mobile twist on the classic whack-a-mole arcade game. Instead of a mole, players tap on pop-up images of our friend Andrew Suh as he appears in randomized positions across the screen. The goal is to "whack" as many Andrews as possible within a time limit to rack up the highest score.

### Goals

- Deliver a polished, entertaining mobile game as a final project submission.
- Faithfully recreate the core whack-a-mole loop — timing, scoring, and increasing difficulty — in a mobile-friendly format.
- Make it personal and fun by featuring Andrew Suh as the sole target character.

### Features

- **Timed Rounds** — Players compete against a countdown timer to score as many hits as possible.
- **Progressive Difficulty** — Andrew appears faster and stays visible for shorter durations as the game advances.
- **Score Tracking** — A running score display during gameplay with a final summary screen at the end of each round.
- **Hit/Miss Feedback** — Visual and/or haptic feedback on successful whacks and misses.
- **High Score Persistence** — Local storage of the player's best score across sessions.

## Architecture

WhackASuh is built with **React Native** and **Expo**, written in **TypeScript**.

### Layer Overview

```
┌─────────────────────────────────┐
│           Screens               │  Home, Game, Game Over
├─────────────────────────────────┤
│         Game Engine             │  Spawn logic, timer, difficulty ramp
├─────────────────────────────────┤
│        Components               │  Mole (Andrew), ScoreBoard, Timer
├─────────────────────────────────┤
│       State Management          │  React Context / useReducer
├─────────────────────────────────┤
│     Expo APIs & Storage         │  Haptics, AsyncStorage, Assets
└─────────────────────────────────┘
```

**Screens** — Three primary screens manage navigation: a Home/Start screen, the main Game screen, and a Game Over screen that shows the final score and high score.

**Game Engine** — A lightweight loop driven by `useEffect` timers controls when and where Andrew appears. Spawn intervals and visibility durations shorten over time to ramp up difficulty.

**Components** — Reusable UI pieces include the mole target (Andrew's image), a live scoreboard, and a countdown timer. The mole component handles its own pop-up animation and registers tap events.

**State Management** — Game state (score, time remaining, difficulty level, active mole positions) is managed through React's built-in `useReducer` paired with a context provider, keeping data flow predictable without external libraries.

**Expo APIs & Storage** — Expo's `expo-haptics` module provides tactile feedback on taps. `AsyncStorage` persists high scores locally. Static assets (Andrew's image) are bundled with `expo-asset`.

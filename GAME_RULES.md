# Lunar Command: Game Rules

This document explains how the **current HTML prototype** works. It is written as a guide so we can understand the game before changing or rebuilding it.

If we change a rule later, update this document too.

## 1. The mission in one minute

- One mission lasts up to **8 shifts**.
- The player chooses one action per shift.
- The player starts with crew supplies and battery power.
- The player must prepare shelter before the radiation storm.
- The player can earn science stars by doing experiments.
- The mission ends with a result and a score.

The aim for the best outcome is to get through all eight shifts, protect the crew during every storm shift and earn at least four science stars.

## 2. The four resources

| Resource       |           Starting amount |                       Limit | What it means                                                  |
| -------------- | ------------------------: | --------------------------: | -------------------------------------------------------------- |
| Battery power  | 5 (or 7 with Big Battery) | 10 (or 14 with Big Battery) | Power available to the base.                                   |
| Crew supplies  |                         6 |                          10 | A made-up combined supply for air, water and food.             |
| Shelter layers |                         0 |                           6 | A game value for how much protection has been built.           |
| Science stars  |                         0 |                           6 | Stars earned from experiments. The mission goal is at least 4. |

These are **game units**, not real engineering measurements. In particular, shelter layers do not represent a real radiation dose or a real thickness of Moon-base walls.

## 3. What happens at the start of each shift?

The current engine uses this order:

1. The Sun adds power to the battery.
2. The base uses 2 power to keep running.
3. The player's chosen action uses its power cost, if it has one.
4. A garden harvest is added if it is due.
5. The crew uses 1 supply.
6. If it is a storm shift, the game checks whether the shelter meets that event's requirement.
7. The game records the shift and moves to the next one, unless the mission has ended.

### Power

- Normal sunlight adds **3 power** each shift.
- During the event's hill-shadow shifts, sunlight adds **2 power** instead.
- The base uses **2 power** every shift.
- The chosen action may use extra power.
- The battery cannot go above its capacity.

A simple example: if the battery starts at 5, the Sun adds 3, the base uses 2, and the action costs 2, the battery ends at 4.

### Crew supplies

- The crew uses **1 supply every shift**, whatever action is chosen.
- Crew supplies cannot go above 10.
- Recycling adds 3 supplies before the normal 1 supply is used.
- An experiment uses 1 extra supply.
- Planting food uses 1 extra supply.
- A harvest adds 4 supplies before the normal 1 supply is used.

## 4. The six actions

| Action                  |                       Power cost | Extra supply effect | What happens                                                              |
| ----------------------- | -------------------------------: | ------------------: | ------------------------------------------------------------------------- |
| Do an experiment        | 2 (or 1 with Speedy Science Lab) |        Uses 1 extra | Adds 2 science stars, up to 6. Not allowed during a storm.                |
| Recycle supplies        |                                2 |              Adds 3 | Restores supplies. The crew still uses its normal 1 supply that shift.    |
| Plant food              |       2 (or 1 with Garden Lamps) |        Uses 1 extra | Food is ready after 3 shifts and adds 4 supplies.                         |
| Build a storm shelter   |                                2 |     No extra change | Adds 2 layers, or 3 with Thick Walls Kit.                                 |
| Ask Earth about the Sun |                                1 |     No extra change | Sends one message. The reply becomes available on the next shift.         |
| Rest                    |                                0 |     No extra change | No extra job is done. Normal base power and crew supply use still happen. |

### Extra action details

**Experiment:** The player earns two stars, up to the maximum of six. The action is blocked during a radiation storm. It also uses one extra crew supply, on top of the crew's normal shift use.

**Recycle:** Adds three crew supplies, then the crew uses one. The net change is usually +2, unless the supply limit of 10 is reached.

**Plant food:** The player can only have one garden growing at a time. The garden takes three shifts to grow. The player cannot plant if the harvest would happen after the final shift. Planting uses one extra supply now. When the harvest is due, it adds four supplies before the crew's normal use.

**Shelter:** A normal shelter action adds two layers. With Thick Walls Kit, it adds three. The maximum is six layers.

**Message Earth:** Only one message can be sent. The game reveals the storm's exact shift range on the following shift. The one-shift wait is the Earth team taking time to study the information; it is **not** the real radio travel time from the Moon.

**Rest:** Rest is not a free pass from normal costs. The base still uses power and the crew still uses one supply.

## 5. The four gadgets

The player has four credits and must choose exactly two different gadgets. Each gadget costs two credits.

| Gadget             | Starting battery | Battery limit | Special effect                                        |
| ------------------ | ---------------: | ------------: | ----------------------------------------------------- |
| Big Battery        |                7 |            14 | More power at the start and more room in the battery. |
| Thick Walls Kit    |                5 |            10 | Each shelter action adds 3 layers instead of 2.       |
| Speedy Science Lab |                5 |            10 | Experiments cost 1 power instead of 2.                |
| Garden Lamps       |                5 |            10 | Planting food costs 1 power instead of 2.             |

The starting battery and limit shown above are for choosing that gadget alone. If Big Battery is one of the two selected gadgets, its battery change applies alongside the other gadget's effect.

## 6. The three event choices

The current prototype stores these event details:

| Event shown to player | NOAA S-level shown | Storm shifts in the game | Shelter needed in the game | Hill-shadow shifts |
| --------------------- | -----------------: | ------------------------ | -------------------------: | ------------------ |
| March 23, 2024        |                 S2 | 5–6                      |                          2 | 3–4                |
| September 10, 2017    |                 S3 | 4–5                      |                          3 | 6–7                |
| January 19, 2026      |                 S4 | 5–7                      |                          4 | 2                  |

The first two event cards also show flare information: X1.1 for March 2024 and X8.2 for September 2017. The January 2026 card does not use a flare value in the prototype.

**Important:** The historical event date and S-level are presented as real-record information. The shift timing, shelter requirement and hill-shadow timing are made up for the game. The game does not calculate real radiation exposure from the NOAA S-level.

## 7. How the storm check works

On every shift covered by the game's storm schedule:

- The game compares the player's shelter layers with the event's shelter requirement.
- If the shelter is equal to or higher than the requirement, that shift counts as protected.
- If the shelter is lower, that shift counts as an unprotected exposure in the game.

The player should build the shelter before the storm arrives. Experiments cannot be selected during storm shifts.

The game records how many storm shifts were protected and how many were not.

## 8. How the mission ends

The mission can end early if the base cannot cover its normal power use or if crew supplies run out.

At the end of shift 8, the game checks the final outcome:

- **Mission success:** no unprotected storm shifts, every storm shift was protected, and the player earned at least four science stars.
- **Survival success:** the mission reached the end, but one or more of those success conditions were missed.
- **Critical failure:** the mission stopped early because the base could not keep going.

The game uses the word “survival” as a game outcome. It is not a real prediction about astronaut health.

## 9. How the score works

The score is out of 100:

| Score section        | Maximum points | How it is worked out                                                |
| -------------------- | -------------: | ------------------------------------------------------------------- |
| Crew survival        |             25 | 25 if the mission did not end in critical failure; otherwise 0.     |
| Radiation protection |             25 | Based on the share of storm shifts protected.                       |
| Crew supplies        |             20 | Based on supplies remaining at the end, out of the 10-supply limit. |
| Battery power        |             10 | Based on battery remaining compared with its capacity.              |
| Science              |             20 | Based on science stars earned, up to the maximum of 6.              |

The total is rounded to a whole number.

The score and the mission outcome are related, but they are not exactly the same thing. For example, the player can survive but miss the science goal.

## 10. Pip's help

During the mission, Pip can:

- Give a general hint about the current situation.
- Explain what happened after the last action.
- Answer four science questions:
  - What is radiation?
  - Flare or radiation storm?
  - Why a shelter?
  - Are the numbers real?

Pip's explanations should stay friendly and simple. If we add new science facts, we should add reliable sources for them too.

## 11. Science accuracy reminders for the team

Please keep these points clear in the app and in any future updates:

- A solar flare and a solar radiation storm are different events.
- Flare classes such as X1.1 and X8.2 are not radiation-dose measurements.
- NOAA S-levels are space-weather scales, not a direct measurement of the dose an astronaut would receive on the Moon.
- The game uses simplified fictional numbers for power, supplies, shelter, storm timing and scoring.
- Do not describe the game as a real mission simulator or a tool for calculating astronaut safety.

When in doubt, keep the explanation simple and check the source before adding a science claim.

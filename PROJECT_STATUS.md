# 📋 Project status

This page is our shared checklist. Update it as we work so everyone knows what is finished, what is being worked on and what still needs attention.

**Last updated:** 14 November 2026  
**Project stage:** React conversion done and checked against the original HTML prototype (now in `legacy/index.html`).

## ✅ Already in the original HTML prototype

- [x] Welcome screen.
- [x] Mission briefing.
- [x] Three event choices.
- [x] Choose two gadgets.
- [x] Eight-shift mission.
- [x] Battery, crew supplies, shelter and science resources.
- [x] Six player actions.
- [x] Pip's hints and explanations.
- [x] Science question section.
- [x] Storm warnings.
- [x] Hill-shadow power changes.
- [x] Garden growth and harvest.
- [x] Mission results and score breakdown.
- [x] Replay option.
- [x] Science/source links included in the prototype.

## 🧱 React conversion work

These are tasks for the React version. Do not tick them off until they are actually done and checked.

- [x] Create the React + TypeScript + Vite project.
- [x] Confirm `npm install` works.
- [x] Confirm the development server starts.
- [x] Move the game engine into its own file.
- [x] Move scenario information into its own file.
- [x] Move science facts and source links into their own file.
- [x] Build the welcome and briefing screens.
- [x] Build event selection.
- [x] Build gadget selection.
- [x] Build the mission screen.
- [x] Build the results screen.
- [x] Create reusable Pip and resource components.
- [x] Recreate the Moon base scene.
- [x] Connect all buttons and game state.
- [x] Preserve the current game rules unless the team agrees to change them.

## 🧪 Testing checklist

- [x] App builds successfully.
- [x] No major browser console errors.
- [x] All screens can be reached.
- [x] Exactly two different gadgets can be selected.
- [x] Each of the six actions works as expected.
- [x] Battery calculations checked.
- [x] Crew supply calculations checked.
- [x] Garden timing checked.
- [x] Storm protection checked for all three events.
- [x] Experiments are blocked during storms.
- [x] Scores checked.
- [x] Replay works.
- [x] Layout checked on a phone-sized screen.
- [x] Layout checked on a desktop screen.
- [ ] Keyboard navigation checked.
- [ ] Reduced-motion setting checked.

## 🌱 Improvements to consider

These are ideas to discuss, not promises that are already built:

- [ ] Make the instructions even easier for ages 7–12.
- [ ] Reduce the amount of information shown at once during the mission.
- [ ] Review whether all six actions are needed for the younger target audience.
- [ ] Make Pip's hints more helpful and shorter.
- [ ] Add sources for the general science facts Pip shares.
- [ ] Recheck the historical event references and wording.
- [ ] Ask a few people in the target age range to try the game, with appropriate adult/guardian involvement.
- [ ] Prepare a final project demo and presentation.

## 📝 Notes:

- The original HTML file (`legacy/index.html`) is the reference for the current game.
- "Checked" in the testing list means the React version gives exactly the same results as the original (see `npm test`). It does not mean the original rules themselves have been reviewed: that is a separate task.
- The React version is not complete until it runs and the main game flow has been tested.
- Do not mark something as finished just because code has been written. Run it and check it.
- If we change a game rule, update `GAME_RULES.md` and this page.

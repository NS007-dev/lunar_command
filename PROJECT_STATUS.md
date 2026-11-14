# 📋 Project status

This page is our shared checklist. Update it as we work so everyone knows what is finished, what is being worked on and what still needs attention.

**Last updated:** 13 November 2026  
**Project stage:** Original HTML prototype exists; React conversion is planned/in progress.

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

- [ ] Create the React + TypeScript + Vite project.
- [ ] Confirm `npm install` works.
- [ ] Confirm the development server starts.
- [ ] Move the game engine into its own file.
- [ ] Move scenario information into its own file.
- [ ] Move science facts and source links into their own file.
- [ ] Build the welcome and briefing screens.
- [ ] Build event selection.
- [ ] Build gadget selection.
- [ ] Build the mission screen.
- [ ] Build the results screen.
- [ ] Create reusable Pip and resource components.
- [ ] Recreate the Moon base scene.
- [ ] Connect all buttons and game state.
- [ ] Preserve the current game rules unless the team agrees to change them.

## 🧪 Testing checklist

- [ ] App builds successfully.
- [ ] No major browser console errors.
- [ ] All screens can be reached.
- [ ] Exactly two different gadgets can be selected.
- [ ] Each of the six actions works as expected.
- [ ] Battery calculations checked.
- [ ] Crew supply calculations checked.
- [ ] Garden timing checked.
- [ ] Storm protection checked for all three events.
- [ ] Experiments are blocked during storms.
- [ ] Scores checked.
- [ ] Replay works.
- [ ] Layout checked on a phone-sized screen.
- [ ] Layout checked on a desktop screen.
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

- The original HTML file is the reference for the current game.
- The React version is not complete until it runs and the main game flow has been tested.
- Do not mark something as finished just because code has been written. Run it and check it.
- If we change a game rule, update `GAME_RULES.md` and this page.

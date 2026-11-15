import type { ActionId, Gadget, ScenarioId } from '../game/scenarios';
import type { IconName } from '../components/Icon';

/** Gadget descriptions shown on the gadget-selection screen. Each one says what changes compared with no gadget. */
export const UPD: Record<Gadget, string> = {
  battery: 'Holds 14 power instead of 10, and starts with 7 instead of 5.',
  walls: 'Each shelter job adds 3 layers instead of 2.',
  lab: 'Experiments cost 1 power instead of 2.',
  garden: 'Planting food costs 1 power instead of 2.',
};

export const ICO: Record<Gadget, IconName> = { battery: 'battery', walls: 'shield', lab: 'flask', garden: 'sprout' };

/** Action buttons: [title, description, icon]. The shelter button adds its layer count itself (it depends on the gadgets). */
export const ACT: Record<ActionId, [string, string, IconName]> = {
  science: ['Do an experiment', 'The crew goes outside to explore. Win 2 stars. Uses power and 1 supply. Not allowed during a radiation storm!', 'flask'],
  recycle: ['Recycle supplies', 'Cleans used air and water so the crew can use them again. +3 supplies.', 'recycle'],
  grow: ['Plant food', 'Uses power and a little water now (−1 supply). Ready to eat in 3 shifts: +4 supplies!', 'sprout'],
  shelter: ['Build storm shelter', 'Stack thick layers around the crew. More layers block more radiation.', 'shield'],
  message: ['Ask Earth about the Sun', 'Earth scientists will tell you exactly which shifts the radiation storm covers. Their reply comes next shift.', 'radio'],
  rest: ['Rest', 'This job costs nothing. The sun still charges the battery.', 'moon'],
};

/** Pip's fun fact after each action. */
export const FACT: Record<ActionId, string> = {
  science: 'Real astronauts do experiments too. NOAA says going outside in a strong radiation storm is risky, so experiments wait.',
  recycle: 'Recycling cleans used air and water so crews can use them again. That means carrying less from Earth.',
  grow: 'Astronauts have grown plants on the International Space Station. Plants need light, water and time.',
  shelter: 'Thick layers between you and radiation can block some of it. In strong storms, real crews move to better-protected areas. Our shelter layers are just a game way to count this.',
  message: 'A radio message from the Moon reaches Earth in about 1.3 seconds. From Mars, it takes minutes! In our game, the reply takes a whole shift because Earth scientists need time to study the Sun.',
  rest: 'Saving power is a real skill. Crews plan their energy carefully.',
};

/** Real-record descriptions of each event. */
export const EVT: Record<ScenarioId, { flare: string; storm: string }> = {
  mar24: {
    flare: 'The Sun gave off an X1.1 flare on March 23, 2024. A flare is a super-bright flash of light and X-rays.',
    storm: 'After it, NOAA saw fast particles reach S2 (moderate) levels. NOAA said the storm was expected to last into the next day.',
  },
  sep17: {
    flare: 'The Sun gave off an X8.2 flare on September 10, 2017.',
    storm: 'Fast particles then reached S3 (strong) levels. NOAA data show them peaking near 1,040 pfu and staying high into the next day. (pfu is the unit scientists use to count how many fast particles rush past.)',
  },
  jan26: {
    flare: 'Our game does not include a flare for this event. We only use its radiation storm.',
    storm: 'On January 19, 2026, NOAA reported an S4 (severe) radiation storm. NOAA said it was the biggest in over 20 years.',
  },
};

/** NOAA S-level words. */
export const SLV: Record<number, string> = { 2: 'moderate', 3: 'strong', 4: 'severe' };

/** "Ask Pip" science questions. */
export const SCI: { q: string; a: string }[] = [
  { q: 'What is radiation?', a: 'Radiation is energy that zooms through space. Some kinds, like tiny fast bits from the Sun, can harm living things. That is why astronauts need protection!' },
  { q: 'Flare or radiation storm?', a: 'A solar flare is a super-bright flash of light and X-rays. A radiation storm is different: it is a shower of tiny fast bits called protons. Scientists measure them in different ways. Flares get letter grades like X. NOAA grades radiation storms from S1 (minor) to S5 (extreme).' },
  { q: 'Why a shelter?', a: 'Thick walls between you and radiation block some of it. On Earth, our thick air and an invisible magnetic shield (the magnetic field) protect us. The Moon does not have that protection, so real crews move to better-protected places in strong storms.' },
  { q: 'Are the numbers real?', a: 'No! Battery power, supplies and shelter layers are made-up game numbers. The dates and NOAA storm levels are real records. Nothing in the game measures real radiation.' },
];

/** Source links shown in the "What is real in this game?" fold-out. */
export const SOURCES: { url: string; text: string }[] = [
  { url: 'https://www.swpc.noaa.gov/sites/default/files/images/NOAAscales.pdf', text: 'NOAA SWPC: Space Weather Scales (S-scale and astronaut notes)' },
  { url: 'https://www.swpc.noaa.gov/phenomena/solar-radiation-storm', text: 'NOAA SWPC: Solar Radiation Storm' },
  { url: 'https://www.spaceweather.gov/node/1131', text: 'NOAA SWPC: S1-S2 storms, March 23, 2024' },
  { url: 'https://www.spaceweather.gov/node/697', text: 'NOAA SWPC: X8.2 flare and S3 storm, Sept. 10, 2017' },
  { url: 'https://repository.library.noaa.gov/view/noaa/21802', text: 'NOAA: September 2017 space weather overview (Redmon et al., 2018)' },
  { url: 'https://watchers.news/2017/09/11/s3-strong-solar-radiation-storm-september-11-2017/', text: 'The Watchers (news site, reports NOAA data): 1,040 pfu peak' },
  { url: 'https://www.cp24.com/news/world/2026/01/19/sun-releases-the-largest-solar-radiation-storm-in-over-20-years-forecasters-say', text: 'News report quoting NOAA SWPC: S4 storm, Jan. 19, 2026' },
  { url: 'https://www.nasa.gov/moonbase-systems/', text: 'NASA: Moon Base Systems (research on power for a Moon base)' },
];

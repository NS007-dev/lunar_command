import type { ActionId, Gadget, ScenarioId } from '../game/scenarios';
import type { IconName } from '../components/Icon';

/** Gadget descriptions shown on the gadget-selection screen. */
export const UPD: Record<Gadget, string> = {
  battery: 'Holds 14 power and starts with 7.',
  walls: 'Each shelter job adds 3 layers instead of 2.',
  lab: 'Experiments cost 1 power instead of 2.',
  garden: 'Planting food costs 1 power instead of 2.',
};

export const ICO: Record<Gadget, IconName> = { battery: 'battery', walls: 'shield', lab: 'flask', garden: 'sprout' };

/** Action buttons: [title, description, icon] */
export const ACT: Record<ActionId, [string, string, IconName]> = {
  science: ['Do an experiment', 'Win 2 stars. Uses power and 1 supply. Not allowed in a radiation storm: stay inside!', 'flask'],
  recycle: ['Recycle supplies', 'Cleans used air and water so the crew can use them again. +3 supplies.', 'recycle'],
  grow: ['Plant food', 'Uses power and a little water now (−1 supply). Harvest in 3 shifts: +4 supplies!', 'sprout'],
  shelter: ['Build storm shelter', 'Stack thick layers around the crew area. More layers block more radiation.', 'shield'],
  message: ['Ask Earth about the Sun', 'The Earth team studies the Sun. Their reply comes next shift.', 'radio'],
  rest: ['Rest', 'Costs nothing. The sun still charges the battery.', 'moon'],
};

/** Pip's fun fact after each action. */
export const FACT: Record<ActionId, string> = {
  science: 'Real astronauts do experiments too. NOAA says going outside in a strong radiation storm is risky, so experiments wait.',
  recycle: 'Recycling cleans used air and water so crews can use them again. That means carrying less from Earth.',
  grow: 'Astronauts have grown plants on the International Space Station. Plants need light, water and time.',
  shelter: 'Thick layers between you and radiation can block some of it. Real crews move to better-protected areas in strong storms. Our shelter points are just a game way to count layers.',
  message: 'A radio signal from the Moon reaches Earth in about 1.3 seconds. Mars is much farther: messages take minutes. In our game the reply takes a whole shift because the Earth team needs time to study the Sun, not because of radio delay.',
  rest: 'Saving power is a real skill. Crews plan their energy carefully.',
};

/** Real-record descriptions of each event. */
export const EVT: Record<ScenarioId, { flare: string; storm: string }> = {
  mar24: {
    flare: 'The Sun gave off an X1.1 flare on March 23, 2024. A flare is a flash of light and X-rays.',
    storm: 'After it, NOAA saw fast particles reach S2 (moderate) levels. NOAA said the storm was expected to last into the next day.',
  },
  sep17: {
    flare: 'The Sun gave off an X8.2 flare on Sept. 10, 2017.',
    storm: 'Fast particles then reached S3 (strong) levels. NOAA data show them peaking near 1,040 pfu and staying high into the next day.',
  },
  jan26: {
    flare: 'We did not use a flare for this event.',
    storm: 'On Jan. 19, 2026, NOAA reported an S4 (severe) radiation storm. NOAA said it was the biggest in over 20 years.',
  },
};

/** NOAA S-level words. */
export const SLV: Record<number, string> = { 2: 'moderate', 3: 'strong', 4: 'severe' };

/** "Ask Pip" science questions. */
export const SCI: { q: string; a: string }[] = [
  { q: 'What is radiation?', a: 'Radiation is energy that travels through space. Some kinds, like fast tiny particles from the Sun, can harm living things. Astronauts need protection from them.' },
  { q: 'Flare or radiation storm?', a: 'A solar flare is a flash of light and X-rays. A radiation storm is different: it is fast particles called protons. Scientists measure them separately. X is a flare grade. NOAA grades radiation storms S1 (minor) to S5 (extreme).' },
  { q: 'Why a shelter?', a: 'Thick material between you and radiation blocks some of it. On Earth, our air and magnetic field protect us. On the Moon, crews need other protection, so real crews move to better-protected places in strong storms.' },
  { q: 'Are the numbers real?', a: 'No! Power, supplies and shelter points are made-up game numbers. The dates and NOAA storm levels are real records. Nothing here measures a real radiation dose.' },
];

/** Source links shown in "Science & sources: what is real?" */
export const SOURCES: { url: string; text: string }[] = [
  { url: 'https://www.swpc.noaa.gov/sites/default/files/images/NOAAscales.pdf', text: 'NOAA SWPC: Space Weather Scales (S-scale and astronaut notes)' },
  { url: 'https://www.swpc.noaa.gov/phenomena/solar-radiation-storm', text: 'NOAA SWPC: Solar Radiation Storm' },
  { url: 'https://www.spaceweather.gov/node/1131', text: 'NOAA SWPC: S1-S2 storms, March 23, 2024' },
  { url: 'https://www.spaceweather.gov/node/697', text: 'NOAA SWPC: X8.2 flare and S3 storm, Sept. 10, 2017' },
  { url: 'https://repository.library.noaa.gov/view/noaa/21802', text: 'NOAA: September 2017 space weather overview (Redmon et al., 2018)' },
  { url: 'https://watchers.news/2017/09/11/s3-strong-solar-radiation-storm-september-11-2017/', text: 'The Watchers (news site, reports NOAA data): 1,040 pfu peak' },
  { url: 'https://www.cp24.com/news/world/2026/01/19/sun-releases-the-largest-solar-radiation-storm-in-over-20-years-forecasters-say', text: 'News report quoting NOAA SWPC: S4 storm, Jan. 19, 2026' },
];

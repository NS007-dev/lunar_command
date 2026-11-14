# 🌙 Lunar Command: The Last Sunlight

**A little Moon base. A big mission. Your decisions matter.**

Lunar Command: The Last Sunlight is a small space-learning game made for the NASA International Space Apps Challenge. You take charge of a Moon base and try to keep its crew safe while a solar radiation storm is on the way.

You do not need to know loads about space to play. Your friendly robot guide, Pip, helps explain what is happening as you go.

> **The big idea:** learn a little about life on the Moon by making choices yourself.

## 🚀 What is the project?

We chose the challenge **Build a Junior Astronaut Mission Trainer**. We wanted to make something that feels more like a game than a lesson or a science worksheet.

In the game, you have eight shifts to look after a Moon base. You need to manage battery power, crew supplies, build a shelter, and complete science experiments. You cannot do everything, so you have to plan ahead.

Our target audience is children aged **7–12**. That means the game should be welcoming, easy to follow, colourful and fun. We are aiming for clear explanations rather than lots of difficult space words.

## 🎮 How do you play?

The mission has a few steps:

1. Meet Pip and read the mission briefing.
2. Choose one of the three historical space-weather events.
3. Pick two gadgets to help with your mission.
4. Play through eight shifts. Choose one action each shift.
5. See how your mission went and what you learned.

### The four things you look after

| Game resource | In simple words |
| --- | --- |
| 🔋 Battery power | The electricity the Moon base needs to run. |
| 💧 Crew supplies | A simplified mix of air, water and food for the crew. |
| 🛡️ Crew protection | Shelter layers that represent protection from radiation in this game. |
| ⭐ Science stars | Points earned by doing experiments. |

### What can you do on a shift?

The current HTML version has six actions:

- **Do an experiment:** earn two science stars. It uses power and one extra crew supply. Experiments are not allowed during a radiation storm.
- **Recycle supplies:** restore three supplies before the crew's normal supply use for that shift.
- **Plant food:** use power and one extra supply now. If there is enough time, the garden gives four supplies after three shifts.
- **Build a storm shelter:** add protective layers. A normal shelter action adds two; the Thick Walls Kit adds three.
- **Ask Earth about the Sun:** send one message. The Earth team's reply is available on the next shift. This action uses one power.
- **Rest:** do not spend power on an extra job. The base still uses its normal power and the crew still uses supplies.

### Choose two gadgets

Before the mission, you choose exactly two gadgets. Each one costs two credits, and you have four credits.

| Gadget | What it changes |
| --- | --- |
| Big Battery | Start with 7 power instead of 5, and have a battery limit of 14 instead of 10. |
| Thick Walls Kit | Each shelter action adds 3 layers instead of 2. |
| Speedy Science Lab | Experiments cost 1 power instead of 2. |
| Garden Lamps | Planting food costs 1 power instead of 2. |

## 🤖 Meet Pip

Pip is the robot who guides you through the mission. Pip gives hints, explains what happened after an action, and answers a few science questions.

Pip should sound encouraging and helpful. Players should never feel silly for not knowing something.

## ☀️ The real space-weather events

The current prototype includes three events with dates and storm levels shown as historical records:

- **March 23, 2024:** S2 radiation storm.
- **September 10, 2017:** S3 radiation storm.
- **January 19, 2026:** S4 radiation storm.

The game also displays flare information for the first two events. A flare and a radiation storm are different things:

- A **solar flare** is a burst of light and X-rays from the Sun.
- A **solar radiation storm** involves fast particles, including protons.

They are measured in different ways. An X-class flare number is **not** a radiation dose.

The event records are used as inspiration for the game. The timing of the storm inside the eight-shift mission, the shelter requirement, the hill-shadow shifts and all resource numbers are simplified game rules. They are not a real forecast or a model of the radiation dose an astronaut would receive.

## 🧪 How does the mission end?

The current game has three possible outcomes:

- **Mission success:** the crew survives, stays protected during every storm shift, and earns at least four science stars.
- **Survival success:** the mission reaches the end, but one or more success goals were missed.
- **Critical failure:** the base cannot keep going because it runs out of the resources needed to continue.

The results screen gives a score out of 100. It looks at crew survival, storm protection, supplies left, battery power left and science progress. The exact points are explained in [`GAME_RULES.md`](GAME_RULES.md).

## 🛠️ Current version and technology

The working reference version is currently a **single HTML file** using HTML, CSS and JavaScript. It includes the game engine, screens, styling, SVG artwork and interactions in that file.

We are planning to move it into a more organised React application. The intended tools are:

- React
- TypeScript
- Vite
- CSS (or Tailwind CSS if the team agrees)
- Vitest or another test tool for checking the game rules

There is no need for a server, account system, database or paid API for the current game concept.

**Please do not assume the React conversion is finished just because this README describes the planned setup.** Update this section when the React app is actually in the repository and has been tested.

## 👥 Working as a team

We are building this together and learning as we go. Contributions can be code, design, testing, science research or documentation.

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making changes.
- Read [`GAME_RULES.md`](GAME_RULES.md) to understand the current game mechanics.
- Check [`PROJECT_STATUS.md`](PROJECT_STATUS.md) to see what is done and what still needs work.

If you spot something confusing, write it down or open an issue. You do not need to solve everything alone.

## 📚 Sources used in the current prototype

These are the links included in the original HTML prototype. They should be checked again before the final project submission, especially the details about the January 2026 event.

- [NOAA Space Weather Scales](https://www.swpc.noaa.gov/sites/default/files/images/NOAAscales.pdf)
- [NOAA: Solar Radiation Storm](https://www.swpc.noaa.gov/phenomena/solar-radiation-storm)
- [NOAA event page: March 23, 2024](https://www.spaceweather.gov/node/1131)
- [NOAA event page: September 10, 2017](https://www.spaceweather.gov/node/697)
- [NOAA: September 2017 space-weather overview](https://repository.library.noaa.gov/view/noaa/21802)
- [The Watchers report on the September 2017 storm](https://watchers.news/2017/09/11/s3-strong-solar-radiation-storm-september-11-2017/)
- [CP24 report on the January 19, 2026 storm](https://www.cp24.com/news/world/2026/01/19/sun-releases-the-largest-solar-radiation-storm-in-over-20-years-forecasters-say/)

The prototype says that some general facts Pip shares (for example, about plants on the International Space Station, recycling and radio delays) are not linked to a source yet. We should add reliable sources for those before final submission.

---

**Made with curiosity, teamwork and a little help from Pip. 🌙**

# 🤝 How to contribute to Lunar Command

Hey! Welcome to the project.

This guide is here so that anyone can understand what we are making and how to help. You do **not** need to be a space expert or an experienced developer. We are students building this together, and it is completely fine to ask questions.

## 1. First, understand the game

Please read the main [`README.md`](README.md) first. It explains the idea and the player experience.

Then have a look at [`GAME_RULES.md`](GAME_RULES.md). It explains what happens during a shift, what each action does and how the score works.

The original HTML prototype is our reference for the current version. It is important because it contains the existing game rules and interactions. The React version should keep those rules unless we agree as a team to change them.

## 2. What we are trying to build

We want to move the current single-file HTML game into a properly organised React app.

The planned tools are:

- **React** – lets us build the screen from smaller reusable pieces.
- **TypeScript** – helps us catch mistakes in our code.
- **Vite** – runs the app locally while we work on it.
- **CSS or Tailwind CSS** – controls how the app looks.
- **Vitest** – can be used to test the game calculations.

The app should still work without a backend, database, login or paid API.

## 3. Suggested order of work

Try to work through these steps in order:

1. **Get the project running.** Set up React and Vite and make sure the starter app opens.
2. **Move the game rules.** Put the game calculations and scenario information into separate files.
3. **Build the screens.** Create the welcome, briefing, event choice, gadget choice, mission and results screens.
4. **Build reusable parts.** For example, Pip, resource displays, action buttons and the Moon scene.
5. **Connect everything.** Make sure buttons and screens use the same game state.
6. **Check the design.** Make it work on phones, tablets and computers.
7. **Test the whole mission.** Play through different events and gadget choices.
8. **Update the docs.** Keep the README and project status honest and up to date.

The folder layout below is just a suggestion. It can change if there is a clearer way to organise the app.

```text
lunar-command/
├── public/
│   └── images/
├── src/
│   ├── components/
│   │   ├── Pip.tsx
│   │   ├── ResourceDisplay.tsx
│   │   ├── ActionButton.tsx
│   │   └── MoonScene.tsx
│   ├── screens/
│   │   ├── Welcome.tsx
│   │   ├── Briefing.tsx
│   │   ├── EventSelection.tsx
│   │   ├── GadgetSelection.tsx
│   │   ├── Mission.tsx
│   │   └── Results.tsx
│   ├── game/
│   │   ├── engine.ts
│   │   ├── scenarios.ts
│   │   └── scoring.ts
│   ├── data/
│   │   └── scienceFacts.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── tests/
├── package.json
├── README.md
├── CONTRIBUTING.md
├── GAME_RULES.md
└── PROJECT_STATUS.md
```

## 4. Features to keep from the original version

Please compare the React app with the HTML prototype as you work. The current version includes:

- A welcome screen and mission briefing.
- Three historical space-weather event choices.
- A choice of exactly two gadgets.
- An eight-shift mission.
- Four resources: battery, crew supplies, shelter protection and science stars.
- Six actions: experiment, recycle, plant food, build shelter, message Earth and rest.
- Pip's hints, explanations and science questions.
- A Moon base scene that changes as the mission changes.
- Storm warnings and hill-shadow effects.
- A results screen with outcomes, score and a shift-by-shift summary.
- A way to play again.

Do not remove a feature just because it is awkward to convert. If something should change, discuss it first and write down why.

## 5. Design goals

Our target audience is children aged **7–12**.

Please aim for a design that is:

- Friendly, playful and colourful.
- Easy to understand without a space background.
- Clear on both small and large screens.
- Consistent from one screen to the next.
- Not overloaded with numbers or long paragraphs.

Keep Pip encouraging. Explain new words in everyday language. Use short instructions and make it clear what a button will do.

The original look uses a deep blue space background, warm yellow, coral, mint and sky blue, rounded cards, playful headings and a cartoon Moon base. We would like to keep that general personality while improving the layout.

## 6. Things to test

Before saying a task is finished, check it yourself.

- Can the app start and build without errors?
- Can the player move through every screen?
- Can the player choose exactly two different gadgets?
- Do all six actions work?
- Does the battery change correctly?
- Do crew supplies change correctly?
- Does the garden give food at the right time?
- Does shelter protection work during every storm shift?
- Are experiments blocked during a storm?
- Does the score add up to 100 possible points?
- Can the player replay the game?
- Does it work at phone and desktop widths?
- Can the main controls be used with a keyboard?

If you cannot test something, say so. It is better to be honest than to mark something complete when it has not been checked.

## 7. Working with GitHub

A simple way to work is:

1. Make sure you have the latest version of the project.
2. Create a new branch for the task you are working on.
3. Make one clear change at a time.
4. Run the app and test your change.
5. Commit your work with a message that explains what changed.
6. Push your branch and open a pull request so we can review it together.

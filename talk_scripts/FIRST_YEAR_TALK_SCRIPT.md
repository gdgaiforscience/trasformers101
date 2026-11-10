# Inside the Black Box: Presenter Script for First-Year University Students

**Accompanying Deck:** [`index.html`](index.html)  
**Target Audience:** First-year university undergraduates (any discipline) who have used tools like the **Gemini Web App** to chat, summarise readings, or debug code, but have never looked under the hood of AI.  
**Target Presenter:** Written so that **a complete AI novice** can read and deliver this talk verbatim with confidence, clarity, and stage presence.  
**Total Runtime:** ~50–55 minutes + Q&A (40 slides)

---

## 0 · Novice Presenter’s Quick-Start Guide (Read 15 Minutes Before Talking)

### Setting Up Your Screen
1. Open `index.html` in **Google Chrome** or **Microsoft Edge** (no internet is required except for an optional live 3D website on Slide 32).
2. Press **`P`** to pop open the **Presenter Window** (drag this onto your laptop screen while the main browser window goes on the lecture-hall projector).
3. Click back on the projected window and press **`F`** for fullscreen. Press **`T`** if you also want a small timer in the corner.

### Essential Controls
| Key / Action | What It Does |
|---|---|
| **`→`** or **`Space`** or **Clicker Forward** | Reveals the **next step** on the current slide, OR moves to the **next slide** once all steps are done. |
| **`←`** or **Clicker Back** | Undoes the last step, or goes back one slide. (Everything is safely reversible!) |
| **`K`** / **`J`** | **Pause/Play** (`K`) or **Restart** (`J`) the animation video on the current slide. |
| **`O`** / **`Esc`** | Open (`O`) or close (`Esc`) the 40-slide visual grid overview. |
| **`B`** | Black out the screen temporarily if you want all eyes on you. |

> **⚠️ Crucial Tip for Novice Speakers:**  
> Most slides advance animations when you press **`→`**. However, **5 interactive slides (Slides 14, 15, 17, 32, and 37) have ZERO `→` steps**—all interaction on those five slides is done with your **mouse** (dragging sliders or clicking on-screen buttons). If you press `→` early on those five slides, you will jump to the next slide! Don’t worry: every single one of those slides is clearly marked with a **🛑 NO ARROW STEPS** warning in this script, and if you ever press `→` by accident, just press **`←`** once to come right back.

### How to Read Cues in This Script
* **Plain text** = Words you read aloud to the students.
* ***Italicised words*** = Natural vocal emphasis (stress that word slightly).
* **`[PRESS → (Step 1 of 4)]`** = Press the Right Arrow key (or Space / clicker) at that exact moment.
* **`[MOUSE: ...]`** = Use your mouse/trackpad on the projected slide to click a button, hover, or drag a slider.
* **`[PAUSE]`** = Take a two-second breath and let the visual sink in.
* **`💡 Coach’s Note`** = Behind-the-scenes reassurance for you, the speaker (don’t read these aloud).

### Pronunciation & Symbol Cheat Sheet
You do **not** need a maths degree to say the equations out loud. Whenever a symbol appears on screen, the script spells out what to say—and here is your quick reference:

| Symbol / Term on Screen | How to Say It Out Loud | Plain-English Meaning |
|---|---|---|
| **`ŷ`** | *"y-hat"* | The AI’s **predicted answer** (the little hat always means "estimate" or "guess" in statistics). |
| **`σ`** | *"sigma"* | A **squashing function** (specifically the *sigmoid* curve) that squeezes any number neatly between `0` and `1`. |
| **`w`** / **`W`** (yellow) | *"w"* / *"capital W"* | **Weights**—the adjustable "importance knobs" inside the AI. |
| **`x`** (blue) | *"x"* | The **input numbers** going into the AI (like pixel brightness or word IDs). |
| **`b`** (teal) | *"b"* | **Bias**—a baseline offset knob controlling how easily a neuron activates. |
| **`î`** and **`ĵ`** | *"i-hat and j-hat"* | Two unit arrows pointing **1 step East** (`î`) and **1 step North** (`ĵ`) on a 2D grid. |
| **`L`** (red) | *"capital L"* (Loss) | The **Loss**—a single score measuring *how wrong* the AI currently is (`0` = perfection). |
| **`η`** (orange) | *"eta"* (*AY-tuh* or *EE-tuh*) | The **learning rate**—how big a step the AI takes downhill each time it learns from a mistake. |
| **`∂L / ∂w`** (green) | *"the slope of L with respect to w"* (or *"partial L over partial w"*) | How sensitive the error `L` is when you wiggle knob `w` slightly. |
| **FLOP / FLOPs** | *"flop / flops"* | **Floating-Point Operations**—one basic decimal addition or multiplication (`3.2 × 1.5`) done by a chip. |
| **ReLU / GELU** | *"REH-loo"* / *"JEH-loo"* | Names of two simple "bends" (activation functions) used between neural network layers. |
| **t-SNE** | *"TEE-snee"* | A visualisation method that flattens a 640-dimensional cloud of words onto a 2D map. |
| **TPU** | *"T-P-U"* | **Tensor Processing Unit**—Google’s custom-built AI supercomputer chip. |
| **Gemma** | *"JEM-uh"* | Google’s small, **open-weight** sibling to Gemini whose brain numbers we can inspect freely. |
| **GNoME** | *"nome"* (silent G) | DeepMind’s materials-discovery AI (*Graph Networks for Materials Exploration*). |

---

# OPENING

---

## Slide 1 / 40 · Title Slide (`#title`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS: Glowing 3D network of nodes and travelling light pulses loops in the background.]`**

*(Let the animation play for a few seconds as students settle in. Smile and look out at the room.)*

Welcome, everyone! Whether you’re in your first semester of biology, physics, computer science, engineering, or arts—thank you for being here tonight.

Have a look at the animation glowing behind me. Every little sphere on that screen is an **artificial neuron**, and every pulse of light racing along a wire is simply **a number** being multiplied and passed along.

Right now, for almost all of us, Artificial Intelligence feels like magic—or a mysterious "black box." You open the **Gemini Web App** at 11 p.m. before a tutorial, type in a messy question about lecture three, and half a second later, fluent, confident English streams onto your laptop screen.

Tonight, we are going to pry that black box wide open. You don't need any background in AI or advanced maths to follow along. Every time an equation appears tonight, you will see the **picture** first, and the symbols second. By the time we walk out of here in an hour, you won't just know *what* happens when you message Gemini—you’ll understand the **six core equations** that power modern AI, and how they are transforming science.

**`[PRESS → to go to Slide 2]`**

---

## Slide 2 / 40 · I Typed “hi” (`#hook`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `4`

Let’s start with the simplest possible experiment. Imagine opening the Gemini Web App right now, typing the two letters **"hi"**, and hitting Enter.

What actually happens on the other side of that chat bubble before the first word comes back?

We can’t peek directly inside the full Gemini model running on Google’s servers because its internal numbers are proprietary—locked away. *However*, Google also releases an open-source sibling family called **Gemma**, built with the exact same architecture and dictionary. Because Gemma is open, we can freeze time right after pressing Enter and look directly inside its brain.

**`[PRESS → (Step 1 of 4 — Right-hand panel appears with Gemma 3's probability bars)]`**

Here is what **Gemma 3** *actually* computed in that split second.

First, look at that row of little boxes at the top right: `<bos>`, `<start_of_turn>`, `user`, `hi`, `<end_of_turn>`, `<start_of_turn>`, `model`. Notice that AI models don't read raw letters the way we do—they chop text into chunks called **tokens**, which are words, punctuation marks, or pieces of words, each with its own ID number. *(We’ll look closely at how that chopping works in Chapters 3 and 4.)*

Second, notice what the model outputs! It does **not** output a single pre-written greeting. Instead, it calculates a **probability**—a percentage vote—for what the *very next word piece* should be:
* **"Hi"** gets **93.3%** of the vote.
* **"Hello"** gets **6.3%**.
* **"How"** gets **0.4%**.

Down below the bars, there’s an orange slider called **Temperature**, marked ***T***. Think of Temperature as an "adventurousness dial." *(We’ll see the exact formula behind Temperature in Chapter 6, when we talk about choosing words.)* Watch what happens if I slide Temperature up—

**`[MOUSE: Drag the orange "temperature T" slider up to around 2.0, pause a beat so students see "Hi" shrink and "Hello"/"How"/"Hey" grow, then drag it back to 1.00. Optionally click "🎲 Sample a token" once or twice.]`**

When Temperature is low, the AI plays it safe and almost always picks the top bar, *"Hi"*. When Temperature is high, the bars flatten out and the AI takes wilder creative risks! When we roll the dice—what AI engineers call **sampling**—it picks one winning token.

**`[PRESS → (Step 2 of 4 — Counter rolls up from 0 to 262,144)]`**

And it didn't just weigh those six words on the screen. Just to pick its *very first word*, the model scored and ranked **262,144** possible tokens in its vocabulary—everything from English words to Python code, Mandarin characters, and emojis!

**`[PRESS → (Step 3 of 4 — AI chat bubble types out "Hi there! How can I help you today?")]`**

Once it picks *"Hi"*, it glues *"Hi"* onto the end of your message, runs the whole calculation *again* to pick *" there"*, then *"!"*, then *" How"*, one token at a time, until you see: *"Hi there! How can I help you today?"*

**`[PRESS → (Step 4 of 4 — Big question appears)]`**

Which leaves us with the central mystery of the night:

**How on earth does a giant pile of numbers *decide* that?**

**`[PRESS → to go to Slide 3]`**

---

## Slide 3 / 40 · Tonight’s Journey (`#roadmap`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`

Here is our roadmap to answer that question.

In **Chapters 1, 2, and 3**, we’ll get our bearings: what all the AI buzzwords actually mean in late 2026, the rollercoaster 80-year history of how we got here, and the physical hardware—from power plants to subsea cables—that carries your *"hi"* to Google and back in one second.

Then, notice **Chapters 4 and 5** glowing in yellow. That is the beating heart of tonight’s talk. We are going to build an **artificial neural network** from a single neuron, and then watch a machine **learn a law of physics from scratch** right in front of our eyes.

In **Chapter 6**, we’ll scale that tiny network up into **Gemini**, and in **Chapter 7**, we’ll see how the exact same maths is predicting 3D proteins, discovering new battery crystals, and forecasting the weather—plus which tools *you* should actually use in your university labs.

Let’s dive in.

**`[PRESS → to go to Slide 4]`**

---

# CHAPTER 1 · WHAT IS AI TODAY?

---

## Slide 4 / 40 · What Do We Mean by “AI”? (`#zoo`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `3`

People throw around terms like *AI*, *Machine Learning*, *Deep Learning*, and *Generative AI* as if they’re synonyms. The easiest way to keep them straight is to picture four nested **Russian nesting dolls**—each circle sitting inside the one before it.

Right now, the outer grey circle is highlighted: **Artificial Intelligence**, coined back in **1956**. AI is simply the umbrella term for *any* technique that makes a computer do something we’d call "intelligent" if a human did it. Believe it or not, an old-fashioned chess program from the 1990s or Google Maps finding the fastest bus route to campus is AI—even when a human programmer typed every single `if-then` rule by hand!

**`[PRESS → (Step 1 of 3 — Highlights blue ring: Machine learning)]`**

Inside AI sits **Machine Learning**, starting around **1959**. Here, we flip the philosophy of programming upside down. Suppose you want to filter spam emails—or classify galaxy shapes in a physics lab. Try writing `if-then` rules by hand for what makes a photo a cat versus a dog: *"If pointy ears and whiskers..."*—well, a fox has pointy ears too! Instead of writing rules by hand, in Machine Learning we **show the computer thousands of examples and let it learn the statistical rules from the data itself**.

**`[PRESS → (Step 2 of 3 — Highlights teal ring: Deep learning)]`**

Step inside again and we hit **Deep Learning**, which sparked a revolution in **2012**. Deep Learning is a specific kind of Machine Learning built out of **artificial neural networks stacked many layers deep**—loosely inspired by neurons in the brain, though much simpler mathematically. *(We’ll open up these layers one by one in Chapter 4.)* Deep learning is what finally let computers recognise speech, read X-rays, and fold proteins.

**`[PRESS → (Step 3 of 3 — Highlights inner yellow ring: Foundation models & generative AI)]`**

And right in the bullseye sits what you interact with in the Gemini Web App: **Foundation Models and Generative AI**, born around **2017**. Earlier deep-learning models were narrow specialists—one model only spotted tumours, another only translated French to English, and neither could generate anything new. A **Foundation Model** is a gigantic neural network **pre-trained** once on a vast ocean of text, code, images, and audio, which can then **generate** brand-new essays, Python scripts, images, music, or even candidate drug molecules.

Keep those outer rings in mind, though! Spoiler for Chapter 7: if you’re analysing a small lab spreadsheet of 300 rows for a biology assignment, the classic Machine Learning ring actually *beats* giant deep-learning models almost every time.

**`[PRESS → to go to Slide 5]`**

---

## Slide 5 / 40 · The State of Play: October 2026 (`#now`)
* **Planned time:** 2.5 min | **Arrow steps on this slide:** `7`

If your main experience of AI is typing text into Gemini and getting text back, it’s easy to think modern AI is "just a smart chatbot." Let’s take two minutes to look at six huge shifts defining where frontier AI stands right now, in **October 2026**.

**`[PRESS → (Step 1 of 7 — Card 1: Multimodal in & out)]`**

First: **Multimodal in and out**. *Modality* is just a fancy word for a type of information—text, sight, or sound. Early chatbots were text-only. Today, a single flagship model natively reads text, photos, spoken audio, and video all at once—you can snap a photo of a handwritten whiteboard circuit diagram and ask about it out loud. And specialised models generate media right back: **Nano Banana** for images, **Veo** for video with synchronised sound, **Lyria** for music, and **Genie 4**, which generates interactive 3D worlds you can actually walk around inside.

**`[PRESS → (Step 2 of 7 — Card 2: Models that "think")]`**

Second: **Models that "think" before they speak**. Notice the quotation marks around *"think"*! Until recently, chatbots blurted out their answer immediately, one word after another, whether you asked *"What’s 2 + 2?"* or asked a brutal olympiad maths proof. Starting around 2024 and 2025, researchers used **reinforcement learning**—training by trial-and-error with rewards when a verifiable answer checks out, which we’ll revisit in Chapter 6—to let models spend extra seconds or minutes working through scratchpad steps *before* answering. In July 2025, Gemini Deep Think hit **gold-medal standard** at the International Mathematical Olympiad!

**`[PRESS → (Step 3 of 7 — Card 3: Agents)]`**

Third: **Agents**. A chatbot *talks*; an **agent** *uses tools and takes actions*. You give an agent a goal, and it can search the web, write a Python script, run that script in a terminal, read the error message when it crashes, fix its own bug, and keep going—powering coding assistants like **Antigravity**, **Deep Research** tools that read hundreds of papers for you, and physical robots.

**`[PRESS → (Step 4 of 7 — Card 4: Long context)]`**

Fourth: **Long context**. An AI’s **context window** is its "working desk"—how much information it can hold in active view during a single conversation. Early models forgot the top of your essay by the time they reached the bottom! Today’s Gemini holds **1,048,576 tokens** at once—roughly **ten full-length novels**, an entire software codebase, or hours of lecture video in one prompt.

**`[PRESS → (Step 5 of 7 — Card 5: Open models)]`**

Fifth: **Open-weight models**. Remember those internal numbers—the **weights**—we mentioned earlier? Open-weight models like **Gemma 4** let you download all of those numbers for free and run the AI completely offline on your own laptop or phone, keeping sensitive medical or research data 100% private.

**`[PRESS → (Step 6 of 7 — Card 6: AI for science)]`**

And sixth: **AI for science**—from over **200 million** predicted protein shapes to millions of new crystal materials, sharper weather forecasts, and AI "co-scientists." We’ll tour these in Chapter 7.

**`[PRESS → (Step 7 of 7 — Footer line: Flagship Gemini 4 Argon)]`**

Look at that summary line at the bottom: Google’s flagship reasoning model today is **Gemini 4 Argon**, described on its model card as a *"sparse mixture-of-experts Transformer."* If that sounds like Star Trek technobabble right now—don't panic! **Transformer** is the neural network blueprint we’ll unpack in Chapter 6, and **sparse mixture-of-experts** simply means instead of lighting up the *entire* brain for every single word, the model acts like a university with specialist departments, waking up only the relevant experts for each word to save energy and run faster.

So—how did humanity get from zero to *that*?

**`[PRESS → to go to Slide 6]`**

---

# CHAPTER 2 · HOW WE GOT HERE

---

## Slide 6 / 40 · 80 Years of AI in 3 Minutes (`#timeline`)
* **Planned time:** 3.0 min | **Arrow steps on this slide:** `8`

AI often feels like it fell out of the sky in 2022. In reality, it is an **80-year story** of brilliant ideas, overblown promises, funding crashes, and stubborn comebacks. The yellow line we’re about to trace isn't a strict measurement—think of it as the *emotional and financial temperature* of AI: hype and funding!

Right here at the start, in **1943**, neurophysiologist Warren McCulloch and teenage logician Walter Pitts wrote down the first mathematical sketch of a brain cell—an artificial neuron with inputs, weights, and a firing threshold.

**`[PRESS → (Step 1 of 8 — Curve climbs to 1960)]`**

In **1950**, Alan Turing famously asked *"Can machines think?"* In **1956**, a summer workshop at Dartmouth College coined the phrase **Artificial Intelligence**. And in **1958**, Frank Rosenblatt wired up the **Perceptron**—a physical cabinet of motors and dials that could actually *learn* its own weights from examples to tell simple shapes apart! *(We’ll play with a live Perceptron in Chapter 4.)* Newspapers went wild; Rosenblatt predicted machines would soon walk, talk, and be conscious.

**`[PRESS → (Step 2 of 8 — Curve plunges into First AI Winter, 1975)]`**

Then came the reality check. In **1969**, Marvin Minsky and Seymour Papert published a book proving mathematically that a *single* layer of Perceptrons couldn't even solve tiny logic puzzles—and nobody knew a practical way to train *multiple* layers yet. In **1973**, the UK’s Lighthill Report declared AI had failed to deliver on its grand promises. Governments slashed research budgets overnight. That icy blue band is the **First AI Winter**.

**`[PRESS → (Step 3 of 8 — Curve rises through 1980s and dips toward 1990)]`**

In the **1980s**, hype roared back around hand-coded "expert systems" for corporations. Meanwhile, quietly in **1986**, Rumelhart, Geoffrey Hinton, and Williams popularised **backpropagation**—the mathematical recipe that finally let multi-layer neural networks learn from their mistakes! *(Backpropagation is the star of Chapter 5.)* By **1989**, Yann LeCun used it so post offices could automatically read handwritten zip codes on envelopes. Yet computers were still millions of times too slow, hand-coded expert systems proved brittle and expensive to maintain, and by the late 80s the field froze into a **Second AI Winter**. For years, "AI" was practically a taboo word on grant applications!

**`[PRESS → (Step 4 of 8 — Curve crosses 1990s–2009)]`**

Through the 90s and 2000s, patient researchers rebuilt the foundations. In **1997**, IBM’s **Deep Blue** beat world chess champion Garry Kasparov—though by brute-force board search, *not* neural networks! Then, in **2009**, Fei-Fei Li and colleagues assembled **ImageNet**: **14 million** internet photos painstakingly labelled by hand. For the first time, AI had enough rich data to study from.

**`[PRESS → (Step 5 of 8 — Steep climb to 2016.5)]`**

And in **2012**, lightning struck. Two grad students and Geoffrey Hinton trained a deep neural network called **AlexNet** on **two video-game graphics cards**—GPUs—and *obliterated* the ImageNet competition, cutting the error rate nearly in half overnight (`15.3%` vs `26.2%`). Deep learning was suddenly undeniable. Four years later, in **2016**, DeepMind’s **AlphaGo** defeated legendary champion Lee Sedol 4–1 at Go—a board game with more possible positions than atoms in the observable universe.

**`[PRESS → (Step 6 of 8 — Climbs to 2021)]`**

Then in **June 2017**, eight researchers at Google published a landmark paper titled *"Attention Is All You Need,"* inventing **the Transformer**—an architecture that could process whole pages of words in parallel instead of reading painfully word-by-word. *(We’ll see how Attention works in Chapter 6.)* By **2020**, scaling up Transformers gave us OpenAI’s **GPT-3** in language, while DeepMind’s **AlphaFold 2** cracked the 50-year grand challenge of predicting 3D protein structures.

**`[PRESS → (Step 7 of 8 — Rockets to 2024.6)]`**

In **November 2022**, **ChatGPT** put a chat box in front of a language model and brought AI to hundreds of millions of students and workers overnight. Google launched **Gemini 1.0** natively across text, images, and audio in **2023**, and in **2024**—

**`[PRESS → (Step 8 of 8 — Reaches 2026.9)]`**

—AI pioneers won **two Nobel Prizes**, reasoning models arrived in **2025**, and today we sit at **Gemini 4 Argon**.

Notice something wild about that timeline: neurons are from **1943**, and backpropagation is from **1986**. Why didn't this happen forty years ago?

**`[PRESS → to go to Slide 7]`**

---

## Slide 7 / 40 · Why Now? Compute Exploded (`#whynow`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `1`

Three ingredients finally collided at the same time: **Data** from the internet, clever **Algorithms** *(don't worry about names like ReLU, Adam, or Attention on that third card yet—we’re about to meet them!)*, and above all, a jaw-dropping explosion in **Compute**—raw calculating power.

Look at the chart on the left. Each yellow dot is a famous AI model from 2012 to 2026. The vertical axis measures **training FLOPs**—short for *Floating-Point Operations*. One FLOP is just one basic decimal calculation, like multiplying `0.42 × 1.7`. Look at the little equation in the bottom-right card: **`C ≈ 6 N D`**. Training an AI takes roughly **6 basic calculations** per internal knob (`N` parameters) for every word piece (`D` tokens) it reads. For GPT-3, `6 × 175 billion knobs × 300 billion tokens` came out to **`3 × 10²³`**—three hundred sextillion calculations!

Now look carefully at the numbers up the left side of the chart: `10¹⁷`, `10¹⁸`, `10¹⁹`... up to `10²⁶`. That is a **logarithmic scale**: every single horizontal gridline is **ten times bigger** than the line below it! Since 2010, the compute used to train frontier AI has multiplied by **4 to 5 times every single year**—roughly **10 billion times** in fifteen years.

Human brains are terrible at feeling logarithmic charts because a straight diagonal line looks calm and gentle. So let’s switch to a normal **linear scale**—where equal height means equal calculations. Watch the dots before 2020:

**`[PRESS → (Step 1 of 1 — Chart morphs from log scale to linear scale 😱)]`**

**`[PAUSE for reaction]`**

Everything built before 2022—AlexNet, AlphaGo, even GPT-3—gets pancaked completely flat onto the floor! *That* is what exponential growth looks like, and *that* is why AI suddenly feels like a tidal wave in your first year of uni.

**`[PRESS → to go to Slide 8]`**

---

## Slide 8 / 40 · 2024: AI Wins Two Nobel Prizes (`#nobel`)
* **Planned time:** 1.0 min | **Arrow steps on this slide:** `1`

In October 2024, the scientific establishment made it official: AI won not one, but **two** Nobel Prizes in the same week.

The **Nobel Prize in Physics** went to **John Hopfield** and **Geoffrey Hinton**—the same Geoffrey Hinton from that 1986 backpropagation paper—for borrowing ideas from statistical physics to make artificial neural networks learn.

Two days later, the **Nobel Prize in Chemistry** went to **David Baker** for designing brand-new proteins on a computer, and to Google DeepMind’s **Demis Hassabis and John Jumper** for **AlphaFold**, which predicts the exact 3D shape of almost every known protein—the tiny molecular machines that digest your food, carry oxygen in your blood, and fight off viruses. *(We’ll spin a real protein in 3D in Chapter 7.)*

**`[PRESS → (Step 1 of 1 — Bottom callout appears)]`**

For all of you starting university right now, that sentence at the bottom is the takeaway: **AI is no longer just a convenient study app *around* science—it has become a fundamental part of how science itself is done.**

**`[PRESS → to go to Slide 9]`**

---

# CHAPTER 3 · THE TECHNOLOGY STACK

---

## Slide 9 / 40 · The AI Technology Stack (`#stack`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `6`

Before we zoom into a single neuron, let’s connect the cloud back to the ground. When you open the Gemini Web App on campus Wi-Fi, you are only seeing the penthouse of a **seven-storey skyscraper**—what engineers call the **AI Technology Stack**. Let’s ride the elevator from the basement to the roof.

At **Floor 1: Energy & data centres**, AI isn't weightless—"the cloud" is giant warehouse buildings humming with megawatts of electricity and chilled-water cooling loops.

**`[PRESS → (Step 1 of 6 — Layer 2: Chips; systolic-array chip animation auto-plays)]`**

**Floor 2: Chips.** Standard laptop processors (CPUs) are great at doing complicated tasks *one step after another*. AI needs the exact opposite: doing *billions of simple multiplications all at once*. That’s why AI runs on **GPUs** (originally invented for 3D video games) and Google’s custom **TPUs** (*Tensor Processing Units*). Look at that animation of a TPU’s core—called a **systolic array**, from the Greek word for your heartbeat! Instead of constantly fetching numbers back and forth from memory, blue inputs pump in from the left and yellow weights sit in a grid of tiny calculators, pulsing partial sums rhythmically neighbour-to-neighbour in diagonal waves every billionth of a second. Gemini 2.5 was trained on supercomputer pods linking **8,960** of those TPU chips together!

**`[PRESS → (Step 2 of 6 — Layer 3: Systems software)]`**

**Floor 3: Systems software**—frameworks like **JAX**, **PyTorch**, and **Keras** that slice one giant mathematical brain across thousands of chips without you having to wire them by hand. Fun fact: the exact same JAX and PyTorch libraries used to train Gemini are free for you to `pip install` in a first-year Python notebook tonight.

**`[PRESS → (Step 3 of 6 — Layer 4: Models)]`**

**Floor 4: Models.** Remember this sentence for the rest of your degree: **An AI model is just a big file of learned numbers—its weights.** Everything *below* Floor 4 exists purely to multiply those numbers fast; everything *above* Floor 4 exists to train them and make them useful to humans.

**`[PRESS → (Step 4 of 6 — Layer 5: Data & training)]`**

**Floor 5: Data & training**—where those numbers are learned over weeks of reading trillions of tokens, and then polished with human feedback *(which we’ll unpack in Chapter 6)*.

**`[PRESS → (Step 5 of 6 — Layer 6: Serving)]`**

**Floor 6: Serving.** Training a model happens once; **inference**—the technical word for *running* the trained model every time someone sends a message—happens millions of times a minute. This layer juggles thousands of users at once, runs safety checks, and embeds **SynthID**—an imperceptible statistical watermark in AI-generated text, images, and audio so AI outputs can be identified later.

**`[PRESS → (Step 6 of 6 — Layer 7: Apps & agents)]`**

And finally, **Floor 7: Apps & agents**—the **Gemini Web App** in your browser tab, **NotebookLM** for your study PDFs, and coding agents.

**`[PRESS → to go to Slide 10]`**

---

## Slide 10 / 40 · The 1-Second Journey of “hi” (`#journey`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `8`

Let’s trace your two-letter message **"hi"** across that stack in real time—nine stops in less than a second!

At **Stop 1: Your device**, pressing `h` and `i` turns keystrokes into standard computer character codes: `0x68` and `0x69`.

**`[PRESS → (Step 1 of 8 — Stop 2: The internet)]`**

**Stop 2: The internet.** Your laptop looks up Google’s address, locks your message inside **TLS encryption** so nobody on campus Wi-Fi can snoop on it, and shoots pulses of laser light down fibre-optic cables—possibly under the ocean!

**`[PRESS → (Step 2 of 8 — Stop 3: Google front door)]`**

**Stop 3: Google’s front door** checks your login and routes your request to an available data centre with spare TPUs.

**`[PRESS → (Step 3 of 8 — Stop 4: The Gemini app)]`**

**Stop 4: The Gemini app** wraps your bare `"hi"` inside a **chat template**—invisible stage directions telling the model *"the user just spoke; now it is the AI assistant’s turn to reply,"* along with any earlier messages in your chat thread.

**`[PRESS → (Step 4 of 8 — Stop 5: Tokenizer)]`**

**Stop 5: The Tokenizer.** Here, English disappears! A lookup dictionary translates `"hi"` into token ID **`#2202`**, and with the invisible chat wrapper around it, your prompt enters the model as a list of **10 integer IDs**.

**`[PRESS → (Step 5 of 8 — Stop 6: Transformer on TPUs)]`**

**Stop 6: The Transformer on TPUs.** Those 10 token IDs turn into lists of **640 decimal numbers each** and cascade through layer after layer of neural network maths.

**`[PRESS → (Step 6 of 8 — Stop 7: Decoding)]`**

**Stop 7: Decoding.** Out pop **262,144 scores**, which get converted into probabilities—**"Hi" at 93%**—and the model generates its reply one token at a time.

**`[PRESS → (Step 7 of 8 — Stop 8: Guardrails)]`**

**Stop 8: Guardrails** check safety and apply the invisible SynthID watermark—

**`[PRESS → (Step 8 of 8 — Stop 9: Back to you)]`**

—and at **Stop 9**, *"Hi there! How can I help you today?"* streams onto your screen!

Stops 1 to 4 and 8 to 9 are classic internet engineering. **Stops 5, 6, and 7**—turning everything into numbers, flowing through a neural network, and turning numbers back into choices—are the Black Box. Let’s step inside **Chapter 4** and build one from scratch!

**`[PRESS → to go to Slide 11]`**

---

# CHAPTER 4 · INSIDE A NEURAL NETWORK

---

## Slide 11 / 40 · Step 0: Everything Is Numbers (`#tensors`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `3`

Before a neural network can see a face, read a poem, or fold a protein, we have to face **Step 0** of computing: **a computer chip has never seen an eye, heard a voice, or read a word.** All a computer can ever hold is **numbers**.

On the left is a portrait of **Rear Admiral Grace Hopper**, one of the great pioneers of computer science who invented the first compiler. To your human eyes, that’s a face, uniform, and collar. Let’s see what the computer actually sees when we zoom into her eye:

**`[MOUSE: Click the blue button "🔍 zoom into the eye" below the portrait. Wait ~2 seconds as the camera zooms in and RGB numbers appear inside every pixel square! Move your mouse over a couple of squares to show the readout underneath changing.]`**

Look at that! The face completely dissolves into a checkerboard of squares—**pixels**—and sitting inside every single square is a trio of numbers from `0` to `255`: how much **Red**, how much **Green**, and how much **Blue** light to mix together. Even this tiny, low-resolution `64 × 75` portrait is nothing more and nothing less than **14,400 numbers**!

Now watch what happens across the rest of human knowledge and science:

**`[PRESS → (Step 1 of 3 — Card 2 appears: Brain signal / EEG)]`**

A hospital **brainwave recording (EEG)**? Just 4 wires measuring tiny voltages 800 times a second—a table of `3,200` numbers.

**`[PRESS → (Step 2 of 3 — Card 3 appears: Text = token IDs)]`**

A sentence of **text**—*"The wombat crossed the road because it was hungry."*? Chopped into tokens and replaced by dictionary ID numbers: `"The"` is `818`. Look at `"wombat"`—because *"wombat"* isn't super common globally, the tokenizer splits it into two pieces: `" wom"` (`#2221`) plus `"bat"` (`#12511`)!

**`[PRESS → (Step 3 of 3 — Card 4 appears: A protein = amino acid IDs)]`**

Even **a living protein** inside a cell is a chain of 20 possible building blocks called amino acids (`A, C, D, E...`), which immediately translates into a sequence of numbers from `0` to `19`!

Pause on how profound that is. Because photos, brainwaves, essays, and DNA *all* turn into grids and lists of numbers, **the exact same mathematical engine can learn patterns in all of them.**

**`[PRESS → to go to Slide 12]`**

---

## Slide 12 / 40 · Tensors: Numbers Stacked in Boxes (`#tensors2`)
* **Planned time:** 1.0 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS & LOOPS: 3D Blender cubes building from 1 cube → a row → a flat grid → a 3D RGB block → a 4D row of 3D blocks.]`**

In AI, you’ll constantly hear the word **tensor**—as in Google’s **TensorFlow** library or **Tensor Processing Units**. "Tensor" sounds like intimidating third-year physics, so let’s demystify it in thirty seconds using the animation on the left and the table on the right:

* **One lone number**—say, today’s temperature `22.5`—is called a **scalar**.
* Stack numbers into a **1D list**—say, 640 numbers describing one word—and mathematicians call it a **vector**.
* Arrange numbers into a **2D flat grid** of rows and columns—like an Excel sheet—and we call it a **matrix**.
* Stack three 2D grids behind one another—Red, Green, and Blue for Grace Hopper’s photo—and you have a **3D tensor**.
* Put 32 colour photos into a folder together to process all at once, and you have a **4D tensor**!

That’s *all* a tensor is: **a neatly organised box of numbers with as many dimensions as you need.** And a neural network is simply a machine where tensors flow in one end, get transformed step by step, and flow out the other—literally **Tensor-Flow**!

So what is the tiniest building block that transforms those numbers? Let’s watch a 16-second animation of **one artificial neuron**.

**`[PRESS → to go to Slide 13]`**

---

## Slide 13 / 40 · ▶ Animation: One Artificial Neuron (`#v-neuron`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~16s, plays once and holds on summary frame): `m01_neuron.mp4`]`**

*(Narrate briskly in sync with the 16-second animation:)*

Here come three input numbers on the left: `0.9`, `0.2`, and `0.6`.
Each connecting wire has a **weight**—blue is positive (votes *yes*), red is negative (votes *no*).
First, each input gets **multiplied by its weight**.
Second, the neuron **adds them all up**, plus a baseline number called the **bias** (`-0.20`), giving `z = 1.02`.
Finally, an S-shaped curve called the **sigmoid** squashes `1.02` neatly between zero and one, outputting **`0.73`**—about a 73% "yes" vote!

**A neuron is just a weighted vote.** Now let’s put our hands on one live!

**`[PRESS → to go to Slide 14]`**

---

## Slide 14 / 40 · Live Demo: One Artificial Neuron (`#neuron`)
* **Planned time:** 2.5 min | **🛑 NO ARROW STEPS (`0` steps — use your MOUSE until ready for Slide 15!)**

> **💡 Coach’s Note:** Do **not** press `→` until you finish playing with the sliders and buttons on this slide!

Let’s give our single neuron a real job from biology! On the left are **100 real iris flowers** measured in 1936 by botanist and statistician Ronald Fisher. Each dot is one flower:
* Across the bottom (`x₁`) is **petal length** in centimetres.
* Up the side (`x₂`) is **petal width** in centimetres.
* **Blue dots** are one species (*Iris setosa*, target `0`), and **orange dots** are another (*Iris versicolor*, target `1`).

Look at our neuron diagram and live equation on the right:
**"y-hat equals sigma of w-one times x-one, plus w-two times x-two, plus b."**
Remember: blue `x₁` and `x₂` are the flower’s measurements; yellow `w₁` and `w₂` are our **weights** (*how much the neuron cares about length vs width*); and teal `b` is the **bias** (*how easily the neuron fires*). Wherever the total equals zero, the sigmoid outputs `0.5`—a 50:50 tie—drawn as that **glowing yellow boundary line**.

Right now, I started the knobs deliberately terrible (`b = -8.0`): the yellow line is way off in the top-right corner, so the neuron calls *every single flower* blue! Look under the plot: `correct: 50 / 100`, with red error rings around every orange dot.

Let’s be the learning algorithm ourselves! Watch the yellow line as I drag the **bias `b`** slider up from `-8.0` to around **`-4.5`**:

**`[MOUSE: Drag the teal "b bias" slider smoothly right until it reads roughly -4.5. Watch the yellow line sweep between the blue and orange clusters and the score turn green: "correct: 100 / 100 flowers"!]`**

Boom—**100 out of 100 flowers** classified with *three numbers*! Now watch what the **weights** `w₁` and `w₂` do when I wiggle them:

**`[MOUSE: Drag "w₁ petal length" slightly (e.g. from 1.00 to 1.60, then back near 1.00) so the yellow line tilts.]`**

Changing the weights **tilts** the angle of the line, while changing the bias **slides** the line! Notice that little yellow arrow `w` sticking perpendicular out of the line—it points toward the orange zone where the neuron’s confidence grows toward `1.0`. You can even hover over any individual flower dot to see its exact numbers flow through the neuron!

**`[MOUSE: Hover briefly over one blue dot and one orange dot, then click the segmented toggle "versicolor vs virginica" in the controls.]`**

Now, what if nature isn't so tidy? I just switched to a harder pair of iris species—*versicolor* versus *virginica*. Look at the middle: the blue and orange dots overlap! No straight line on earth can get 100 out of 100 here. And instead of guessing knobs by hand, let’s click **"⚙️ let it learn"** as a sneak preview of Chapter 5:

**`[MOUSE: Click the green button "⚙️ let it learn". Wait ~3 seconds as the line automatically slides and tilts into place, reaching "94 / 100"!]`**

All by itself, the neuron adjusted `w₁`, `w₂`, and `b` to score **94 out of 100**!

Hold that visual in your head: **one artificial neuron draws one straight boundary line.** That raises an obvious question: what if your data isn't separated by a straight line? And why did we bother squashing the sum with that S-shaped `σ` curve?

**`[PRESS → to go to Slide 15]`**

---

## Slide 15 / 40 · Why Bend? Activation Functions (`#activation`)
* **Planned time:** 1.0 min | **🛑 NO ARROW STEPS (`0` steps — use your MOUSE until ready for Slide 16!)**

> **💡 Coach’s Note:** Use your mouse to click the five function buttons beneath the plot; press `→` only when ready to move on.

That squashing step at the end of a neuron has a name: an **activation function**, or more intuitively, **a bend**. Let’s click through the five famous bends in AI history!

Right now we’re looking at **sigmoid** (in blue)—the smooth S-curve that squashes any input between `0` and `1`, great when you want a probability at the end.

**`[MOUSE: Click "step (1943)" beneath the plot.]`**

Back in 1943, the original Perceptron used a sharp **step function**: zero on the left, sudden jump to one on the right. Why did AI abandon it? Look how flat that horizontal line is everywhere! In Chapter 5, we’ll see that machines learn by feeling the *slope* of the curve—and on a flat cliff, there is zero slope to guide you!

**`[MOUSE: Click "tanh", pause 1 second, then click "ReLU".]`**

**Tanh** (teal) is just a sigmoid centred at zero (`-1` to `+1`). And **ReLU**—*Rectified Linear Unit* (orange)—was the hero of the 2012 deep-learning boom! Look at its formula on the right: `max(0, z)`. If the number is negative, output zero; if it’s positive, pass it straight through! It’s embarrassingly simple—just a straight line with a sharp hinge at zero—and chips compute it almost instantly.

**`[MOUSE: Click "GELU".]`**

And modern Transformers like Gemma and Gemini use **GELU** (yellow)—simply a smoothed-out cousin of ReLU with a gentle curve right at the corner so the slope never jumps abruptly.

Now look at the red warning card on the bottom right: **"Without a bend, depth is useless."** Why? It’s pure high-school algebra: if you multiply by one straight-line rule and immediately multiply by a second straight-line rule *without bending in between*, the two rules collapse into **one single straight-line rule**! Even a thousand-layer network without bends could still only ever draw a single straight line. **The bend is what gives deep learning its superpower.**

**`[PRESS → to go to Slide 16]`**

---

## Slide 16 / 40 · ▶ Animation: A Whole Layer Is One Matrix (`#v-layer`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~20s): `m02_layer_matrix.mp4`]`**

*(Narrate alongside the animation:)*

Now, one neuron only asks *one* question about the input. What if we line up **four neurons side by side** into a **layer**, all looking at the same three inputs? That’s `3 × 4 = 12` wires!

Watch what happens when we peel the weights off each neuron’s wires and stack them neatly into rows: Neuron 1’s three weights become **Row 1**, Neuron 2’s weights become **Row 2**, and so on, forming a `4 × 3` grid—a **weight matrix `W`**!

Multiply that grid `W` by the input column `x`, add the biases `b`, and apply `σ`—Notice Row 1 gives **`0.73`**, the exact neuron we just watched! **An entire layer of neurons is just one single matrix multiplication.**

**`[PRESS → to go to Slide 17]`**

---

## Slide 17 / 40 · Live Demo: A Whole Layer = One Matrix Multiplication (`#layer`)
* **Planned time:** 1.5 min | **🛑 NO ARROW STEPS (`0` steps — use your MOUSE until ready for Slide 18!)**

> **💡 Coach’s Note:** Click `"next neuron ▸"` on screen with your mouse (6 clicks total) rather than pressing `→`!

Let’s slow that down for thirty seconds so nobody feels intimidated by the phrase *"matrix multiplication."* If you haven't seen matrices yet in first-year linear algebra, a matrix multiplication is literally just **doing that weighted vote we already learned, once per row**!

Watch as I click **"next neuron ▸"** four times:

**`[MOUSE: Click the blue "next neuron ▸" button ONCE (highlights Row 1 / Neuron 1).]`**

**Row 1** holds Neuron 1’s three yellow weights: `1.2`, `-0.8`, `0.5`. Multiply them pair-by-pair with our three blue inputs (`0.9`, `0.2`, `0.6`) and add them up: **`1.22`**.

**`[MOUSE: Click "next neuron ▸" THREE MORE TIMES (about 1 second apart) to compute Neurons 2, 3, and 4.]`**

**Row 2** gives Neuron 2’s vote (`0.28`). **Row 3** gives Neuron 3’s (`-0.11`). **Row 4** gives Neuron 4’s (`-0.41`). Every single number in that `W` box corresponds to one physical wire on the left!

**`[MOUSE: Click "next neuron ▸" ONCE MORE (adds bias b), then ONCE MORE (applies σ → outputs 0.73, 0.58, 0.57, 0.33).]`**

Click five adds each neuron’s teal **bias `b`**, and click six squashes all four numbers with **`σ`**, giving our layer’s four final outputs: `0.73`, `0.58`, `0.57`, `0.33`!

Look at the compact equation at the bottom: **`a = σ(W x + b)`**. That tiny equation—*multiply by `W`, shift by `b`, bend with `σ`*—can describe 4 neurons, or **4,000 neurons** firing in parallel on a TPU!

Now here comes the coolest visual intuition in all of machine learning: **what does `σ(W x + b)` actually *look like* geometrically?** Let’s watch!

**`[PRESS → to go to Slide 18]`**

---

## Slide 18 / 40 · ▶ Animation: Layers Warp Space (`#v-warp`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~21s): `m03_grid_warp.mp4`]`**

*(Narrate alongside the animation:)*

Look at those blue and orange crescents—tangled together so no straight line can ever separate them.
Instead of trying to draw a wiggly boundary line, watch what a neural network does to the **entire sheet of graph paper**!
Layer 1 **stretches and rotates** space (`W`), **shifts** it (`b`), and **bends** it (`tanh`).
Layer 2 stretches, shifts, and bends it *again*—pulling the tangled crescents apart like rubber—until at the end, **a single straight line slices cleanly right between them!**

**`[PRESS → to go to Slide 19]`**

---

## Slide 19 / 40 · Live Demo: A Layer Warps Space (`#warp`)
* **Planned time:** 2.5 min | **Arrow steps on this slide:** `4`

Let’s test-drive that rubber sheet ourselves so you can *feel* what each piece of `tanh(W x + b)` is doing!

On the left is a 2D coordinate grid with our tangled blue and orange moons sitting on it. Notice the two glowing unit arrows starting at the origin `(0, 0)`:
* Green **i-hat (`î`)** points 1 unit to the right `(1, 0)`—look at the green first column of our `2 × 2` matrix on the right!
* Red **j-hat (`ĵ`)** points 1 unit straight up `(0, 1)`—look at the red second column of our matrix!

Here is the entire secret of first-year linear algebra in one sentence: **Wherever a matrix sends `î` and `ĵ`, the rest of the entire universe stretches evenly along with them, keeping parallel gridlines parallel!**

Watch as we step through the three parts of one neural network layer:

**`[PRESS → (Step 1 of 4 — Action: rotate)]`**

First, **multiply by `W`**, part one: **rotation**! `î` and `ĵ` swing counter-clockwise together, spinning the entire plane. Notice gridlines are still straight and evenly spaced.

**`[PRESS → (Step 2 of 4 — Action: shear)]`**

Or `W` can **shear** and stretch space—tilting red `ĵ` sideways like a deck of cards pushed from the top! *(Watch what happens if I click the little `"squash"` preset button for one second—)*

**`[MOUSE: Click the small "squash" button in the preset row, pause 2 seconds so students see the plane collapse onto a single diagonal line and red "area × 0.00 (det W)" appear at the bottom-left, then click "shear" to restore.]`**

Did you see that?! When `î` and `ĵ` line up on the *same* diagonal, the whole 2D sheet collapses flat onto a 1D line (`area × 0.00`), permanently crushing blue and orange dots on top of each other! That’s why good weights have to stretch useful directions without squashing crucial information flat.

**`[PRESS → (Step 3 of 4 — Action: shift)]`**

Second, **add the bias `+ b`**: `b₁ = 0.60, b₂ = -0.40`. That simply grabs the entire sheet of graph paper and **slides** the origin down and to the right! Still, notice: straight lines are *still* straight lines.

**`[PRESS → (Step 4 of 4 — Action: bend with tanh)]`**

Third, turn on the activation function—**`tanh`**! Suddenly the gridlines **curve**, folding the entire infinite plane smoothly inside that yellow dashed `(-1, 1)` square!

A layer in Gemma with **640 inputs** is doing *this exact dance*—**stretch, rotate, shift, bend**—not on a flat 2D sheet, but in **640-dimensional space**!

**`[PRESS → to go to Slide 20]`**

---

## Slide 20 / 40 · Deep Learning = Warp, Warp, Warp… (`#deep`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `1`

Now put **three** of those layers in a row! That is literally why "Deep Learning" has the word **deep** in its name: `f₃( f₂( f₁(x) ) )`—passing the output of Layer 1 into Layer 2, and Layer 2 into Layer 3.

On screen is a real, trained `2-2-2-2` network containing only **21 learned numbers** in total. Right now we are at Stage `0/9`: two interlocking moons that no single neuron could ever separate. Let’s press play and watch all 9 sub-steps unfold:

**`[PRESS → (Step 1 of 1 — Plays all 9 stages automatically over ~14 seconds)]`**

*(Narrate as the stages play out on screen:)*
* **Layer 1** stretches (`W`), shifts (`b`), and bends (`tanh`)—folding the moons into an S-ribbon...
* **Layer 2** grabs that ribbon, rotates it, shifts it, and bends it again to peel the two hooks apart...
* **Layer 3** stretches, shifts, and bends one final time—pushing all the **blue dots** into one corner and all the **orange dots** into the opposite corner, where a **single yellow straight line** slices between them at **100% accuracy**!

If you remember only *one* picture from tonight about how neural networks work, make it this one: **each layer untangles a messy problem just a little bit, until at the very end, a simple straight line is enough.**

**`[PRESS → to go to Slide 21]`**

---

## Slide 21 / 40 · Weights: The Knobs (`#weights`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `1`

In our flower demo, we had **3** weight knobs. In our moon-untangling demo, we had **21**. How many knobs are inside a real language model?

Look at the ladder on the right—plotted on a logarithmic scale again:
* 1998 zip-code reader (**LeNet-5**): `60,000` knobs.
* 2012 ImageNet winner (**AlexNet**): `60 million`.
* **Gemma 3 270M** (highlighted in yellow—the compact model powering tonight’s live demos): **`268,098,176`** numbers!
* Climb higher to **GPT-3** (`175 billion`), **Llama 3.1** (`405 billion`), **DeepSeek-V3** (`671 billion`), and **Gemini 4 Argon**, whose exact count isn't publicly disclosed.

On the left, you are looking at an actual X-ray of **Gemma 3’s real brain**: all `655,360` weights of Layer 0’s query matrix, drawn one pixel per number—blue for positive, red for negative. Notice that tiny yellow target square near the top left? Let’s zoom all the way into it:

**`[PRESS → (Step 1 of 1 — Smoothly zooms 2.2s into the 16×16 patch to reveal individual decimals)]`**

Look at those decimals: `-0.516`, `+0.867`, `0.022`, `-0.135`.

**This is what "knowledge" looks like inside an AI.** There isn't a miniature Wikipedia encyclopaedia hidden inside Gemini, and no human engineer typed a single one of those `268 million` decimals by hand! When a model is born, every single one of those numbers starts out as **random static**.

Which brings us to **Chapter 5**—the million-dollar question: **How on earth do you automatically tune 268 million knobs from random noise into intelligence?**

**`[PRESS → to go to Slide 22]`**

---

# CHAPTER 5 · HOW MACHINES LEARN

---

## Slide 22 / 40 · Learning Step 1: Measure How Wrong You Are (`#loss`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `2`

All machine learning—from fitting a line in first-year physics to training Gemini 4—comes down to a **three-step recipe**.

**Step 1: Invent a single number that measures *how wrong* your current knobs are.** We call that number the **Loss**, written as a red capital **`L`**. If `L` is huge, your AI is terrible. If `L` is close to zero, your AI is spot-on.

Let’s watch a machine rediscover a famous law of the solar system purely by shrinking `L`! On the left are the **eight planets**, from Mercury out to Neptune:
* Horizontal axis `x`: distance from the Sun (on a log₁₀ scale).
* Vertical axis `y`: how long it takes the planet to orbit the Sun once (also log₁₀).

Our tiny model is a straight line with just two knobs: slope **`w`** and intercept **`b`**. Right now (`w = 0.60, b = 0.40`), our yellow guess line misses almost every planet! Look at the vertical red bars connecting each planet to our line: that vertical gap is the prediction error `(prediction − truth)`. Why do we *square* each error in the equation on the right? Two reasons: squaring makes negative misses positive so errors don't cancel each other out, *and* it punishes giant blunders heavily! Here, each squared error is literally drawn as a **red geometrical square**, and our Loss **`L = 0.4494`** is simply the **average area of those eight red squares**.

*(Watch what happens if I grab one of the yellow handles on the line—)*

**`[MOUSE: Drag the right-hand yellow circle handle on the line slightly up and down so students see the red squares inflate and shrink and red "L" change live.]`**

Learning means **making the red squares vanish**! Let’s jump to the mathematical minimum:

**`[PRESS → (Step 1 of 2 — Line snaps to best fit; green Kepler card lights up)]`**

Look at that: the red squares disappear (`L ≈ 0.0000`), the intercept `b` hits `0.00`, and the slope `w` lands on **`1.50`**—three-halves! Remember from logarithms that `log T = (3/2) log a` means **`T²` is proportional to `a³`**. In 1619, Johannes Kepler spent *years* of gruelling hand arithmetic on Tycho Brahe’s star tables to discover **Kepler’s Third Law of Planetary Motion**. Our two-knob machine just rediscovered it in a millisecond by minimising a Loss number!

**`[PRESS → (Step 2 of 2 — Switches from log–log axes to raw AU vs Years axes)]`**

And when we switch back from logarithmic axes to normal distance in Astronomical Units versus Earth years, our straight line becomes that gorgeous astronomical curve sweeping cleanly through Mercury, Earth, Jupiter, Saturn, Uranus, and Neptune!

Of course, with 2 knobs we could eyeball the best line—with 268 million knobs, you’re flying blind. How does the computer find the bottom of `L` automatically?

**`[PRESS → to go to Slide 23]`**

---

## Slide 23 / 40 · ▶ Animation: Gradient Descent (`#v-descent`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~15s): `m04_gradient_descent.mp4`]`**

*(Narrate alongside the animation:)*

Imagine standing blindfolded on a foggy mountain at night, trying to reach the lowest valley. What do you do? You feel the **slope under your feet** and take a step **downhill**!

In calculus, the slope is the derivative `dL/dw`, and our step-size knob is orange **eta (`η`)**, the **learning rate**.
Watch the orange ball first when **`η` is too big**: it leaps right across the valley and bounces wildly!
Now watch when **`η` is just right**: as the valley flattens out, the steps automatically get smaller and gentler until the ball settles right into the minimum. That algorithm is called **Gradient Descent**.

**`[PRESS → to go to Slide 24]`**

---

## Slide 24 / 40 · Live Demo: Rolling Downhill (`#descent`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `3`

Let’s try **Learning Step 2: Gradient Descent** live on our Kepler planet problem!

Look at the colorful contour map on the left. This is the **Loss Landscape**:
* Horizontal axis is every possible choice of slope **`w`**.
* Vertical axis is every possible choice of intercept **`b`**.
* Colour shows how *wrong* that `(w, b)` pair is: dark navy blue around the edges is high error (the mountain peaks), and that bright golden bullseye around `(w = 1.50, b = 0.00)` is the valley floor where Kepler’s Law lives!

Our orange ball starts up on the blue hillside at `(w = 0.2, b = 1.2)`. That glowing green arrow is the **negative gradient**—pointing straight down the steepest slope from where the ball is standing right now. Look at the update equation on the top right:
**"New `w` equals old `w` minus learning-rate `η` times the slope."** *(Why minus? Because the slope points uphill, so subtracting it steps downhill!)*

Let’s let the ball roll with a sensible learning rate, **`η = 0.10`**:

**`[PRESS → (Step 1 of 3 — Ball rolls smoothly into the golden valley minimum)]`**

Look at the three panels working together: on the map, the ball curves gracefully down the valley into `(1.498, 0.000)`; on the middle-right mini-plot, the yellow line locks onto the eight planets; and on the bottom-right graph, the red Loss plunges down four orders of magnitude!

Now, you might wonder: *"Why take 180 tiny steps? Why not crank the learning rate `η` up so it finishes faster?"* Let’s try **`η = 0.60`**:

**`[PRESS → (Step 2 of 3 — Ball zig-zags violently across the canyon walls at η = 0.60)]`**

Whoa! It gets there in 27 steps, alright—by slamming back and forth off opposite canyon walls like a pinball! What if we push our luck just a *tiny* bit further, to **`η = 0.80`**?

**`[PRESS → (Step 3 of 3 — Ball bounces wider and wider and explodes: "💥 diverged: learning rate too big!")]`**

** Kaboom—diverged!** Every step overshoots onto a *higher* part of the opposite wall, where the slope is even steeper, flinging the ball into outer space (`Loss = ∞`)! Choosing the right learning rate—and using smart modern optimisers like **Adam** that adapt step sizes automatically—is one of the biggest practical crafts in training real AI.

**`[PRESS → to go to Slide 25]`**

---

## Slide 25 / 40 · ▶ Real Loss Landscapes in High Dimensions (`#landscape`)
* **Planned time:** 0.75 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS & LOOPS: 3D Blender terrain `b03_loss_landscape.mp4` with a glowing ball rolling past local valleys into the deep global basin.]`**

In our Kepler example, we only had **2 knobs**, so we could draw the Loss Landscape as a 3D terrain of hills and valleys—and real neural network landscapes aren't simple bowls; they have ridges, saddle points, and shallow side-pockets called **local minima** that momentum helps the ball swing right through, just like in this animation.

Now stretch your imagination: **Gemma 3 270M has 268 million knobs.** That means its Loss Landscape is a mountain range in **268-million-dimensional space**!

Neither you nor I can picture 268 million dimensions—three dimensions already gives most of us a headache! **Here is the miracle of calculus:** Gradient Descent doesn't need to *visualise* the landscape. It just needs a list of 268 million slopes—one slope for each knob, telling that knob *"turn slightly up"* or *"turn slightly down."*

Wait a second, though. How do you calculate **268 million slopes** without testing each knob one at a time (which would take thousands of years)? That brings us to **Learning Step 3**—the 1986 breakthrough that won Geoffrey Hinton a Nobel Prize.

**`[PRESS → to go to Slide 26]`**

---

## Slide 26 / 40 · ▶ Animation: Backpropagation (`#v-backprop`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~21s): `m05_backprop.mp4`]`**

*(Narrate alongside the animation:)*

Meet **Backpropagation**—short for *backward propagation of errors*, or simply **assigning the blame**.
First, in the **forward pass**, numbers flow *left to right* through each operation box to make a prediction `ŷ = 0.731` and measure the Loss `L = 0.0723`.
Then, in the **backward pass**, green pulses carry **blame** *right to left*, multiplying each box’s simple local slope together!
If you’ve seen the **Chain Rule** in high-school or first-year calculus—*if `w` nudges `z`, `z` nudges `ŷ`, and `ŷ` nudges `L`, you just multiply the three sensitivities together*—**that is all backpropagation is!**

**`[PRESS → to go to Slide 27]`**

---

## Slide 27 / 40 · Live Demo: Backpropagation Assigns the Blame (`#backprop`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `4`

Let’s walk through that exact blame game step-by-step so you see why it’s so fast.

Here is a tiny one-neuron assembly line: input `x = 2.0`, starting weight `w = 0.500`, bias `b = 0.000`, and we *want* the network to output `y = 1.0`.

**`[PRESS → (Step 1 of 4 — Blue pulses run left → right: Forward Pass)]`**

**Pass 1: Forward (blue pulses).**
* `2.0 × 0.500` gives `1.00`.
* Plus `0` gives `z = 1.00`.
* Sigmoid squashes `1.00` into our prediction **`ŷ = 0.731`** (too low—we wanted `1.0`!).
* Squared error `(0.731 − 1.0)²` gives Loss **`L = 0.0723`**.

Now: how should we adjust yellow `w`? Watch the green pulses flow *backward* from `L`:

**`[PRESS → (Step 2 of 4 — Green pulses run right → left: Backward Pass)]`**

**Pass 2: Backward (green pulses).** Look at the magic here: **nobody in this chain needs to understand the whole network!** Each little circle only knows its own tiny, local rule—and passes the multiplied message one step left:
* The Loss box says: *"Hey `ŷ`, if you went UP, the error would go DOWN (`-0.538`)."*
* The Sigmoid box multiplies by its own curve slope (`0.197`) and passes the message to `+`.
* The Multiply box multiplies by `x` (`2.0`) and hands yellow `w` its exact gradient: **`∂L/∂w = -0.2115`**! Because that slope is *negative*, increasing `w` will *shrink* the error!

**`[PRESS → (Step 3 of 4 — Nudges w and b; Loss drops from 0.0723 to 0.0366)]`**

**Step 3: Nudge the weights!** `w` steps uphill from `0.500` to `0.712`, and look at the Loss box on the right—`L` immediately drops in half from `0.0723` to **`0.0366`**! Now let’s repeat that *forward → backward → nudge* loop 20 times in a row:

**`[PRESS → (Step 4 of 4 — Runs 20 training steps rapidly; sparkline plunges toward 0)]`**

Watch `w` climb past `1.4`, watch `ŷ` climb past `0.95` toward `1.0`, and look at that red Loss sparkline in the top-right corner—plummeting toward zero!

Because of the Chain Rule, **one forward pass plus one backward pass gives you the exact slope for all 268 million weights in a single sweep**—taking roughly only twice as much work as running the model forward!

**`[PRESS → to go to Slide 28]`**

---

## Slide 28 / 40 · Put It Together: Watch a Network Learn Live (`#train`)
* **Planned time:** 2.5 min | **Arrow steps on this slide:** `1`

Now let’s put Chapters 4 and 5 together into a real, multi-layer neural network running live inside this browser tab—about 50 lines of plain JavaScript maths, zero external libraries!

Look at the puzzle on the left: **two intertwined spirals** of blue and orange dots—one of the toughest 2D tests for a small network. On the right is our brain: `2` inputs, **`2` hidden layers of `6` neurons each**, and `1` output (**55 weights** in total). Notice that every neuron is drawn as a **tiny square map** showing what *that* specific neuron votes across the whole 2D square! Right now, the weights are random, so it’s guessing blindly (~50% accuracy).

Let’s hit train—running *forward → loss → backward → update* hundreds of times a second:

**`[PRESS → (Step 1 of 1 — Starts live training on the spiral! Let it run for ~5 seconds until accuracy climbs past 95%.)]`**

*(Point out what’s happening live on screen!)*
Look at that! In less than five seconds—around 700–1,000 training epochs—accuracy shoots past **95%**, and the background carves out a glowing blue-and-orange spiral!

Even better, look at the little square thumbnails inside the network on the right:
1. Every neuron in **Hidden Layer 1** only knows how to draw **one straight colour slant** at a different angle—just like our Iris flower neuron!
2. Every neuron in **Hidden Layer 2** combines those six straight slants into **arches, corners, and loops**.
3. And the **Output neuron** combines those loops into a **full spiral**!

Let’s do one quick 15-second history experiment—remember how Minsky & Papert caused the First AI Winter in 1969 by showing what one neuron *can’t* do? That famous puzzle is called **XOR** (opposite corners are the same colour):

**`[MOUSE: Click "⏸ pause", click "XOR" in the dataset bar, click "1 hidden layer", drag "neurons/layer" slider all the way left to "1", and click "▶ train". Wait 3 seconds.]`**

With **1 hidden neuron**, it’s trapped! It tries desperately to slice a single band, stalling forever around **63–75%** because opposite corners cannot be separated by one line. Now watch when I drag `neurons/layer` from `1` up to **`4`**:

**`[MOUSE: Drag "neurons/layer" slider to "4" (and click "▶ train" if paused). Wait 2 seconds as it hits 100% accuracy!]`**

**100% accuracy in two seconds!** Four neurons team up to fold the corners together.

*Forward → Loss → Backward → Update. Repeat.* **That loop is all of deep learning.** Now, in **Chapter 6**, let’s take that exact loop and turn it into **Gemini**!

**`[PRESS → to go to Slide 29]`**

---

# CHAPTER 6 · FROM NETWORKS TO GEMINI

---

## Slide 29 / 40 · Words Become Vectors: A Map of Meaning (`#embed`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `1`

How do we go from classifying 2D dots to chatting in English in the Gemini Web App?

Earlier we saw that a tokenizer gives every word a dictionary ID number—like `"Jupiter"` is `#52895` and `"Saturn"` is `#56949`. But an ID number by itself is arbitrary, like your student ID number: two students whose ID numbers are next to each other aren't necessarily best friends!

So the very first table inside a language model turns each token ID into a **learned vector of 640 decimal numbers**—called a **word embedding**. Think of those 640 numbers as **GPS coordinates in a 640-dimensional "Map of Meaning."** During training, backpropagation nudges those coordinates too, so words that appear in similar contexts naturally drift toward the same neighbourhood!

On the left, we took ~250 real words out of **Gemma 3’s** 640-dimensional map and squashed them onto a flat 2D screen using a technique called **t-SNE**. Nobody ever gave Gemma a science textbook list of categories—yet look at the clusters it organised all by itself: **planets & space** in yellow, **chemical elements** in teal, **animals** in green, **emotions** in pink, **sciences** in purple!

Let’s look up **"Jupiter"** across all 262,144 tokens in Gemma’s entire vocabulary:

**`[PRESS → (Step 1 of 1 — Highlights "Jupiter" on the map and lists its 8 true nearest neighbours in 640D)]`**

Look at the right-hand readout for **Jupiter**: out of a quarter of a million tokens, its closest neighbours in 640-dimensional space are **`Saturn`, `Venus`, `Neptune`, `Mars`, `Titan`, `Pluto`, `Uranus`... and `Zeus`**—its twin king of the gods from Greek mythology!

Even wilder, look at the **Vector Arithmetic** box on the bottom right. Because directions in this map capture *relationships*, you can literally add and subtract words like coordinates!
* Take the 640 numbers for **`king`**, subtract **`man`**, add **`woman`**, and the closest word in Gemma’s vocabulary is **`queen`**!
* **`Paris` − `France` + `Japan`** lands on **`Tokyo`**.
* **`sodium` − `Na` + `K`** lands on **`potassium`**!
*(And in the spirit of scientific honesty, we left two real misses in red at the bottom too—in this tiny 270M model, `Au − gold + silver` guessed `Cu` (copper) instead of `Ag`!)*

Still, a word’s dictionary coordinate is *fixed*—`"bank"` has the same starting coordinates whether you mean a *river bank* or a *Commonwealth Bank*! How does a model figure out what words mean **in context**? That brings us to Google’s 2017 superpower: **Attention**.

**`[PRESS → to go to Slide 30]`**

---

## Slide 30 / 40 · ▶ Animation: Attention (`#v-attention`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~19s): `m07_attention.mp4`]`**

*(Narrate alongside the animation:)*

Read this sentence: *"The wombat crossed the road because **it** was hungry."* As a human, you instantly know **"it"** means the *wombat*, not the *road*! How does a Transformer figure that out?

Every token produces three short vectors:
1. A **Query (`Q`)**: *"What am I looking for?"* (For *"it"*: *"I’m a pronoun looking for a hungry creature!"*)
2. A **Key (`K`)**: *"What label do I advertise to others?"* (*"Wombat"* advertises: *"I’m an animal noun!"*)
3. A **Value (`V`)**: *"What information will I hand over if you match with me?"*

*"It"* compares its **Query** against every earlier word’s **Key**; `"wombat"` wins the highest match score; and `"wombat"`’s **Value** flows right into `"it"`, updating `"it"`’s meaning in context!

**`[PRESS → to go to Slide 31]`**

---

## Slide 31 / 40 · Live Demo: Attention—Words Look at Other Words (`#attention`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `2`

That clip used simplified numbers; what you’re looking at *now* is **100% real attention extracted from Gemma 3**, mathematically verified layer-by-layer against the model itself!

Inside Gemma 3, there are **18 layers**, and each layer runs **4 Attention Heads** side by side—`72` little spotlights in total, each learning its own specialist reading habit during training.

Right now, we’ve tuned into **Layer 9, Head 2** on a classic linguistics test sentence:
*"`<bos>` The trophy did not fit in the suitcase because **it** was too big ."*

In English, *"it"* is ambiguous unless you understand physical size—what was too big, the trophy or the suitcase? Look at the purple arches rising out of yellow **`it`**:
* **51%** of Head 2’s attention locks straight onto **`trophy`**!
* Only **8%** goes to **`suitcase`**.
Without a single grammar rule programmed by a human, Layer 9 Head 2 evolved into a **pronoun-resolver**! *(Look at the purple grid on the bottom right, too—notice the dark black triangle in the upper-right half? That’s called a **causal mask**: when generating text left-to-right, a word is only allowed to look at **earlier** words, never peek into the future!)*

Let’s look at two other specialist heads Gemma grew on its own:

**`[PRESS → (Step 1 of 2 — Switches to Layer 2, Head 3: previous-token head)]`**

Here is **Layer 2, Head 3**: look at that crisp bright diagonal stripe in the heatmap! This head has one simple job: **always look one word back** (for instance, `"it"` puts **78%** of its attention on `"because"` right before it), gluing adjacent word pairs together.

**`[PRESS → (Step 2 of 2 — Switches to Layer 17, Head 3: attention sink)]`**

And here is a quirky discovery AI researchers call an **Attention Sink** (**Layer 17, Head 3**). Because every row of percentages *must* add up to 100%, what does a spotlight do when there’s *nothing* useful for it to look at in a sentence? It parks **95%** of its attention harmlessly on **`<bos>`**—the invisible *"Beginning of Sequence"* marker at the very start of the line—using it as a mathematical "parking lot"!

**`[PRESS → to go to Slide 32]`**

---

## Slide 32 / 40 · The Whole Transformer in 3D (`#llm3d`)
* **Planned time:** 1.0 min | **🛑 NO ARROW STEPS (`0` steps — optional mouse click if online, then `→` to Slide 33)**

> **💡 Coach’s Note:** If you have lecture-hall Wi-Fi and spare time, you can click `"Load bbycroft.net/llm (internet)"` to fly around a 3D blueprint for 30 seconds. If you are **offline** (or keeping tight time), leave the cover card as-is—the script below works seamlessly either way!

Now zoom back and picture the **entire Transformer** assembled together. Look at that one-line recipe at the bottom of the card:

**Embeddings → `(Attention + Neural Network Layer) × N layers` → Probabilities over the vocabulary.**

Think of those two steps inside each layer as a study group:
1. **Attention** is when the words **talk to each other** across the table to gather context (*"Hey, 'it' means 'trophy'!"*).
2. The **MLP** (*Multi-Layer Perceptron*—the exact `σ(W x + b)` neural network layers we built in Chapter 4!) is where each word **sits quietly and processes** what it just learned, recalling facts stored in its weights!

Stack that *talk → process → talk → process* block 18 times in tiny Gemma (or dozens of times in Gemini), and out the very top pops one final list of **262,144 raw scores**—one score for every token in the dictionary!

Let’s watch a 18-second clip of the final piece of maths that turns those raw scores into percentages: **Softmax**.

**`[PRESS → to go to Slide 33]`**

---

## Slide 33 / 40 · ▶ Animation: Softmax & Temperature (`#v-softmax`)
* **Planned time:** 0.5 min | **Arrow steps on this slide:** `0`
* **`[VIDEO AUTO-PLAYS (~18s): `m06_softmax.mp4`]`**

*(Narrate alongside the animation:)*

The raw scores coming out of the final layer—called **logits**—can be positive, negative, anything at all, and they don't add up to 100%.
So **Softmax** does two simple things:
1. Raise `e` (`2.718...`) to the power of each score—making every number strictly positive and amplifying the leaders!
2. Divide each one by the grand total so all 262,144 bars **sum to exactly 1 (100%)**!

And remember our **Temperature `T`** slider from Slide 2? Look where orange `T` sits in the formula: it simply **divides the raw scores** right before exponentiating! Small `T` (`0.3`) exaggerates gaps so #1 dominates; big `T` (`2.5`) shrinks gaps toward a uniform coin-toss!

**`[PRESS → to go to Slide 34]`**

---

## Slide 34 / 40 · Live Demo: Next-Token Prediction & Hallucination (`#predict`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `2`

Now we have come full circle back to Slide 2—except **nothing in that Softmax equation on the right is a mystery anymore**!

Here is **Gemma 3 270M (pretrained)** completing real science & geography sentences. For *"The Great Barrier Reef is located off the coast of"*, it gives **" Australia"** **49%** and **" Queensland"** **34%**, continuing smoothly: *"Australia, and is the largest coral reef system in the world..."*

**`[PRESS → (Step 1 of 2 — Switches prompt to "The chemical symbol for gold is")]`**

Ask *"The chemical symbol for gold is"*, and at `T = 1.0`, **" Au"** leads at **32.4%** ahead of `" gold"` (**23.2%**). Watch what happens if I slide Temperature `T` down to **`0.30`**:

**`[MOUSE: Drag orange "temperature T" slider left to 0.30, pause 2 seconds as " Au" shoots to 75.0%, then reset T back to 1.00.]`**

**" Au"** shoots straight up to **75%**! That’s why when you use AI for coding or factual science, low temperature keeps it focused, whereas for creative writing, higher temperature adds variety.

Now—watch closely, because this next step explains the single biggest trap students fall into when using AI for assignments! Let’s ask this tiny 270M raw model: *"The largest planet in our solar system is..."*

**`[PRESS → (Step 2 of 2 — Switches prompt to "The largest planet in our solar system is")]`**

Look at the bars! Top choice: **`" the"` (15.8%)**, **`" a"` (11.0%)**, **`" home"` (3.6%)**, **`" Earth"` (2.8%)**... Where is **"Jupiter"**?! Buried way down in 25th place at **0.85%**! And look at the yellow continuation at the bottom:
*"The largest planet in our solar system is **the largest planet in the solar system. It is the largest planet in the solar system...**"*

You just witnessed a live **hallucination and repetition loop**! Why did that happen? Two crucial lessons:
1. A language model does **not** look up facts in a verified encyclopaedia; it predicts **plausible-sounding next words**! On the internet, sentences often continue *"The largest planet in our solar system is home to the Great Red Spot..."*, so raw autocomplete happily picks `" the"` or `" home"`!
2. Notice I said this is the **raw pre-trained** model—it has only ever played "autocomplete the internet," *not* "be a helpful Q&A assistant"! How do you turn raw internet autocomplete into the helpful **Gemini Web App**? Next slide!

**`[PRESS → to go to Slide 35]`**

---

## Slide 35 / 40 · Training a Giant: Predict, Align, Think & Scale (`#scale`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `2`

Training a frontier model like **Gemini 4** actually happens in **three distinct stages**, shown on the left:

1. **① Pre-training (Learn the world):** For weeks, thousands of TPUs play "predict the next token" across *trillions* of tokens of books, papers, code, images, and audio. Every time the model gives the true next word a low probability, cross-entropy Loss (`−log p`) punishes it, and backpropagation nudges billions of weights. Out comes a brilliant—but unruly—internet autocompleter.
2. **② Post-training (Learn to be helpful & safe):** Next, engineers fine-tune the model on curated Q&A examples, followed by **Reinforcement Learning from Human (and AI) Feedback (RLHF)**—where raters score which of two answers is clearer, more honest, and safer. *This* is the stage that teaches Gemini to answer *"Hi there! How can I help you?"* instead of autocompleting your `"hi"` like a messy Reddit thread!
3. **③ Thinking (Learn to reason):** Finally, using Reinforcement Learning on problems where a computer can *automatically check* the final answer—like tough maths proofs and unit-tested code—the model is rewarded when generating step-by-step scratchpad reasoning leads to the right solution!

And on the right is one of the most astonishing graphs in modern science: the **Chinchilla Scaling Law** (discovered at DeepMind in 2022). As you spend more compute `C`, the model’s error `L` drops along a **remarkably smooth, predictable power law**—*provided* you balance model size **`N`** (parameters) and training data **`D`** (tokens) at the green sweet spot of roughly **20 tokens of reading per parameter knob**! Look at the orange dot for **GPT-3**: `175 billion` knobs trained on only `300 billion` tokens (~1.7 tokens per knob)—it was an oversized brain that hadn't read enough books! **Chinchilla** (`70B` knobs on `1.4 trillion` tokens) used a *smaller* brain with *more* reading and beat GPT-3 soundly.

**`[PRESS → (Step 1 of 2 — Slides compute budget down to 10²¹ FLOP)]`**

With a small budget (`10²¹` FLOP), the law prescribes a ~`2.8B`-parameter model;

**`[PRESS → (Step 2 of 2 — Slides compute budget up to frontier 3.2 × 10²⁵ FLOP)]`**

and at frontier budgets (`3.2 × 10²⁵` FLOP), scaling both `N` and `D` drives the loss steadily, predictably lower—letting engineers forecast how smart a `$100 million` training run will be *before* flipping the power switch!

**`[PRESS → to go to Slide 36]`**

---

# CHAPTER 7 · AI FOR SCIENCE

---

## Slide 36 / 40 · AI for Science: Beyond Chatbots (`#science`)
* **Planned time:** 2.0 min | **Arrow steps on this slide:** `6`

Now here is my favourite part of the talk—especially for those of you studying science, medicine, maths, or engineering. What happens when you take this **exact same toolkit**—embeddings, attention, neural network layers, and gradient descent—and point it not at English chat, but at **the language of nature**?

Spinning in 3D on the left is a real molecule: **Green Fluorescent Protein (GFP)** from a crystal jellyfish (`225` amino acids). Look at how those 11 yellow ribbons form a protective cylinder—a "beta-barrel"—around a glowing core in the middle; biologists attach GFP like a microscopic neon lantern to watch processes inside living cells! For fifty years, figuring out the 3D shape of *one* protein in a wet lab could take a PhD student **three to five years** of X-ray crystallography and `$100,000`.

Let’s look at six breakthroughs happening right now:

**`[PRESS → (Step 1 of 6 — AlphaFold card)]`**

1. **🧬 AlphaFold:** Feed in the 1D chain of amino-acid letters, and a specialized Transformer predicts the 3D atomic coordinates in minutes! DeepMind released **over 200 million** protein structures—essentially every known protein in nature—free to every researcher on Earth, and **AlphaFold 3** now models how proteins dock with DNA, RNA, and candidate medicines.

**`[PRESS → (Step 2 of 6 — GNoME card)]`**

2. **💎 GNoME:** In materials chemistry, **GNoME** predicted **2.2 million** brand-new inorganic crystal structures—roughly **380,000** of them stable—representing hundreds of years’ worth of candidate materials for better EV batteries, solar panels, and superconductors.

**`[PRESS → (Step 3 of 6 — GenCast card)]`**

3. **🌦️ GenCast:** Weather forecasting traditionally runs massive physics equations for hours on supercomputers. Trained on decades of global weather data, **GenCast** produces 15-day probabilistic forecasts in minutes—beating the world’s top physics ensemble system on **97.2%** of targets, including cyclone tracks!

**`[PRESS → (Step 4 of 6 — AlphaEvolve card)]`**

4. **🧮 AlphaEvolve:** Remember how we said *everything* in AI runs on matrix multiplication? Since 1969 (Volker Strassen’s algorithm), nobody knew a faster way to multiply `4 × 4` complex matrices than 49 multiplications. In 2025, **AlphaEvolve**—a Gemini coding agent paired with an automated verifier—discovered a **48-multiplication** algorithm, breaking a 56-year maths record and saving real compute across Google’s data centres!

**`[PRESS → (Step 5 of 6 — AI co-scientist card)]`**

5. **🧑‍🔬 AI co-scientist:** A team of Gemini agents that read biomedical literature, propose novel hypotheses—such as repurposing existing approved drugs for acute myeloid leukaemia—critique each other’s logic, and hand human biologists testable lab experiments that subsequently worked *in vitro*!

**`[PRESS → (Step 6 of 6 — AlphaGenome card)]`**

6. **🧾 AlphaGenome:** Reads up to **1 million letters of DNA** in a single context window to predict how tiny single-letter genetic mutations turn nearby genes up or down!

Same maths: *multiply, bend, measure error, roll downhill*—changing the world far beyond chatbots.

**`[PRESS → to go to Slide 37]`**

---

## Slide 37 / 40 · Which AI Should *My* Lab Use? (`#lab`)
* **Planned time:** 1.0 min | **🛑 NO ARROW STEPS (`0` steps — use your MOUSE for 2 quick clicks, then `→` to Slide 38)**

> **💡 Coach’s Note:** Click a couple of the grey option pills on the left with your mouse to show the green recommendation card change, then press `→` when done!

Over the next three years of your degree, you’re going to get hands-on data in lab courses and summer research projects. Which AI tool should you actually reach for?

Look at the default scenario selected right now:
* Your data is a **📊 spreadsheet** (say, patient measurements or soil samples),
* You have **hundreds to thousands** of rows, and
* You want to **predict or classify** an outcome.

Look at the giant green answer on the right: **"🌲 Classical machine learning first! ... Put the GPU down!"** On small tabular spreadsheets, classic tree-based algorithms like **XGBoost** or `scikit-learn` train in two seconds on a normal laptop, rarely overfit, and routinely *beat* deep neural networks!

**`[MOUSE: Click "🔬 images" under Question 1.]`**

What if you only have 300 **microscope images** of cells? Don’t train a neural network from random noise—**fine-tune a pre-trained vision model** that already knows edges, textures, and shapes from millions of photos!

**`[MOUSE: Click "📄 text" under Question 1, and click "search / summarise" under Question 3.]`**

And what if you have a stack of **50 research PDFs** or lecture readings to study? Use tools like **NotebookLM** or **RAG** (*Retrieval-Augmented Generation*), which ground the LLM directly in *your* uploaded PDFs—though, as we’re about to summarize, you must **always check the citations**!

**`[PRESS → to go to Slide 38]`**

---

# WRAP-UP

---

## Slide 38 / 40 · What AI Still Gets Wrong (`#limits`)
* **Planned time:** 1.5 min | **Arrow steps on this slide:** `6`

Before we wrap up, let’s be completely clear-eyed. Because you now know *how* the machine works—that at its core it is a **giant, continuous probability engine**—its flaws suddenly make total sense instead of seeming mysterious!

**`[PRESS → (Step 1 of 6 — Hallucination)]`**

1. **🎭 Hallucination:** As we saw live with *"largest planet"*, an LLM optimises for *plausible* next tokens, not guaranteed truth. It can invent a fake court case or a non-existent journal DOI with 100% polite confidence. **Never submit an unverified AI citation or calculation.**

**`[PRESS → (Step 2 of 6 — Bias & data)]`**

2. **⚖️ Bias & data:** Models learn the statistical patterns of their training data—warts, stereotypes, over-represented languages, and scientific blind spots included.

**`[PRESS → (Step 3 of 6 — Energy & cost)]`**

3. **⚡ Energy & cost:** Multiplying compute 4–5× every year costs real megawatts and hardware. Making models smaller, sparser (like Mixture-of-Experts), and greener is one of the hottest research areas you could enter.

**`[PRESS → (Step 4 of 6 — Evaluation)]`**

4. **📏 Evaluation:** How do we even test how smart an AI is when standard exam questions accidentally leak into its internet training data? Building honest benchmarks is surprisingly hard.

**`[PRESS → (Step 5 of 6 — The black box)]`**

5. **🕳️ The black box:** Ironically, even though we can inspect every single one of Gemma’s `268,098,176` weights—just like we zoomed into them earlier!—explaining *why* millions of numbers conspired to reach a specific medical or legal decision remains an open frontier called **mechanistic interpretability**.

**`[PRESS → (Step 6 of 6 — Safety & misuse)]`**

6. **🛡️ Safety & misuse:** Preventing cyber-abuse, bio-risks, and deepfakes requires safety filters, frontier testing, and watermarking tools like **SynthID** baked into every release.

Here is the best rule of thumb for university: **Treat AI like a brilliant, lightning-fast, occasionally overconfident lab partner who hasn't slept in three days.** Brainstorm with it, ask it to quiz you, let it explain tough code—and *always* verify its work!

**`[PRESS → to go to Slide 39]`**

---

## Slide 39 / 40 · The Whole Story in Six Equations (`#recap`)
* **Planned time:** 1.0 min | **Arrow steps on this slide:** `7`

Fifty minutes ago, we asked: **When you type *"hi"* into Gemini, how does a pile of numbers decide what to say back?**

Let’s put the entire black box onto **one single slide**. Watch as I reveal the **six equations**—and notice how every single colour and symbol now tells a picture you know by heart:

**`[PRESS → (Step 1 of 7 — Equation ①: Dense layer)]`**

**① Dense layer** (one layer of a neural network): take input numbers `x`, multiply by weights `W`, shift by bias `b`, and bend with `σ`—warping space step by step.

**`[PRESS → (Step 2 of 7 — Equation ②: Mean squared error)]`**

**② Mean squared error**, our loss `L`: compare your prediction to reality and square the errors to measure *how wrong* you are.

**`[PRESS → (Step 3 of 7 — Equation ③: Gradient descent)]`**

**③ Gradient descent:** step your weights `w` downhill along the slope by learning rate `η`.

**`[PRESS → (Step 4 of 7 — Equation ④: Backprop / Chain rule)]`**

**④ Backpropagation:** multiply local slopes backward from the error using the Chain Rule so every single knob gets its exact share of the blame in one sweep.

**`[PRESS → (Step 5 of 7 — Equation ⑤: Self-attention)]`**

**⑤ Self-attention:** let words send out Queries (`Q`) and match Keys (`K`) to gather meaning (`V`) from other words in context.

**`[PRESS → (Step 6 of 7 — Equation ⑥: Softmax)]`**

**⑥ Softmax:** turn 262,144 raw scores into probabilities shaped by Temperature `T`, pick one winning token, glue it on, and go again!

**`[PAUSE 2 seconds]`**

**`[PRESS → (Step 7 of 7 — Final big summary line)]`**

**Multiply, bend, repeat. Measure the error, roll downhill, repeat.**  
***Then do it at an absurd scale.***

*That* is what’s inside the black box.

**`[PRESS → to go to Slide 40]`**

---

## Slide 40 / 40 · Keep Exploring & Q&A (`#qa`)
* **Planned time:** Open Q&A | **Arrow steps on this slide:** `0`

If tonight sparked your curiosity, every single resource up on this screen is **free**:
* Grant Sanderson’s **3Blue1Brown** YouTube series inspired the visual style of tonight’s animations and is pure gold.
* **TensorFlow Playground** and **Transformer Explainer** let you break and rebuild neural networks right in your browser.
* **Google AI Studio** lets you experiment with Gemini’s API and Temperature sliders for free, and **Gemma** lets you pull open models straight onto your own laptop in Python.

Thank you all so much for coming tonight—and I’d love to take your questions! 🙏

---

# APPENDIX · First-Year Student Q&A Survival Bank
*(Keep this page handy during Q&A! Even if you have zero technical background beyond this script, these answers cover 90% of questions first-year students ask.)*

### Q1: "Does Gemini actually *understand* or *think*, or is it just fancy autocomplete?"
> **Answer:** That’s one of the deepest debates in AI right now! Mechanistically, as we saw on Slides 34 and 39, its training objective starts as next-token prediction. *However*, to predict the next token accurately across physics problems, codebases, and mysteries, the network can't just memorise phrases—it is forced to build rich internal representations inside its layers (like that pronoun-resolving attention head on Slide 31, or the map of planets and elements on Slide 29). It doesn't have human consciousness, feelings, or lived physical experience, so calling it "understanding" depends on your definition—it has genuine *functional competence* at reasoning tasks, without human *awareness*, and it can still fail in very un-human ways!

### Q2: "Why did AI famously struggle with counting letters—like how many R's are in *strawberry*?"
> **Answer:** You actually saw the exact reason on Slide 10 and Slide 11: **tokenization**! Remember how Gemma didn't see the letters `s-t-r-a-w-b-e-r-r-y` one by one? In Gemma’s vocabulary, `"strawberry"` is **one single token ID (`#115137`)**! Imagine if someone blindfolded you from spelling and handed you one solid Lego brick stamped `#115137` and asked how many `r`s were inside it—you’d have to have memorised the spelling fact separately! Newer "thinking" models (Slide 5 & 35) solve this easily because during their scratchpad reasoning step—or by writing a tiny 1-line Python tool call—they explicitly split the word out character by character before answering.

### Q3: "If I ask Gemini the exact same question twice, why does it give slightly different answers?"
> **Answer:** Remember **Sampling and Temperature** on Slides 2 and 34! Unless Temperature `T` is set all the way to `0` (greedy decoding, where it always picks the #1 highest bar), the model rolls a weighted multi-sided die over the top probabilities at *every single token*. Even one slightly different word choice on Token #3 ("Hello" vs "Hi") changes the context for Token #4, steering the rest of the paragraph down a fresh path!

### Q4: "Should I still bother learning to code (or study maths/science) if AI agents can write code?"
> **Answer:** **Yes—more than ever!** Think about calculators: pocket calculators didn't abolish mathematics or engineering; they freed engineers from doing long division by hand so they could design bridges and spacecraft—*if* they understood the underlying maths well enough to know what equation to set up and spot when an answer made no physical sense! Remember Slide 38: AI hallucinates plausible-looking code and plausible-looking science. A student who understands fundamentals + knows how to direct AI agents is 10× more capable; someone who blindly copy-pastes without understanding can't tell a brilliant solution from a subtle disaster.

### Q5: "When I type something into the Gemini Web App, does Gemini immediately update its brain weights from my message?"
> **Answer:** Great catch—**no!** During your chat (**inference**, Floor 6 on Slide 9), the model’s 268-million-plus **weights are completely frozen**. It only "remembers" earlier lines of your conversation because the app feeds your whole chat history back into the **context window** (Stop 4 on Slide 10) each time you hit Enter! Updating the actual weights requires expensive backpropagation training runs offline (and depending on your account privacy/university workspace settings, chats may not be used for future training at all).

### Q6: "Why does training and running AI use so much electricity?"
> **Answer:** Remember `C ≈ 6 N D` on Slide 7! Training a frontier model means doing `10²⁵`+ decimal multiplications and moving trillions of numbers back and forth across silicon wires—and in physics, moving electrical charges through billions of transistors generates heat, requiring both chip power and cooling power. The silver lining is that efficiency is improving dramatically: architectures like **Sparse Mixture-of-Experts** (Gemini 4 Argon, Slide 5) only activate a small fraction of weights per word, and compact models like **Gemma** deliver capabilities on a laptop battery that required a supercomputer just three years ago.

### Q7: "What is the difference between Gemini and Gemma again?"
> **Answer:** Both come from Google DeepMind and use the Transformer architecture! **Gemini** is the flagship family you use in the Gemini Web App—massive, multimodal, hosted on Google’s TPU data centres, with closed weights. **Gemma** is the lightweight **open-weight** sibling family—anyone can download Gemma’s exact weight matrices for free, inspect them (which is how all the real numbers in tonight’s slides were generated!), and run or fine-tune them locally on a laptop or lab server.

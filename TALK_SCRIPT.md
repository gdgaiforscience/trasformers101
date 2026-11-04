# 🎙️ "Inside the Black Box: How AI Really Works": 60-minute speaker script

* **Event:** Google Developer Groups (GDG) AI for Science community · October 2026
* **Audience:** general (scientists, students, curious people). No maths background assumed.
* **Length:** about 55 minutes of talk, then 5 minutes or more of Q&A
* **Deck:** [`state_of_ai/index.html`](index.html). It is one offline HTML file; open it in Chrome or Edge.
* **The question of the night:** *How does a pile of numbers decide to say "Hi there"?*
* **The answer (last slide):** *Multiply, bend, repeat. Measure the error, roll downhill, repeat. Then do it at an absurd scale.*

How to read this script:

* **[→]** means press → (or the clicker) once. That reveals the next step, or moves to the next slide when there are no steps left.
* **[DEMO]** means do something live with the mouse.
* *(12 s)* marks a time inside a video, so you can match your words to the picture.
* Text in quote blocks is what you say. Paraphrase freely; the numbers are exact.

---

## ✅ Before you go on (10 minutes before)

1. Open `state_of_ai/index.html` in **Chrome or Edge**. Press **F** for fullscreen and **P** for the presenter window (notes, timer and next-slide preview).
2. Press **T** to show the timer pill. It starts when you leave the title slide and shows whether you are ahead of or behind plan.
3. **Internet is only needed on slide 32** (bbycroft.net/llm). Load it once during setup to warm the cache. Everything else is local.
4. Click through the video slides once. They are local MP4s, so they should start instantly.
5. Useful keys: **K** play/pause video · **J** restart video · **B** blackout · **O** overview (click any slide) · type a number then **Enter** to jump · **N** notes drawer · **?** help.
6. If anything misbehaves, reload with the slide's name after `#` (for example `index.html#train`). Every demo resets itself when you enter its slide.

---

## ⏱️ Run of show

| Time | # | Slide | What happens |
|:---|:---:|:---|:---|
| 0:00 | 1 | Inside the Black Box | Blender hero network loops while people sit |
| 0:30 | 2 | I typed "hi" | Real Gemma 3 probabilities; temperature slider; 262,144 count-up; reply types out |
| 2:30 | 3 | Tonight's journey | Chapter cards |
| 3:00 | 4 | What do we mean by "AI"? | Nested rings: AI ⊃ ML ⊃ deep learning ⊃ foundation models |
| 5:00 | 5 | State of play, Oct 2026 | Six trend cards |
| 7:30 | 6 | 80 years in 3 minutes | Timeline with hype line, 8 steps |
| 10:30 | 7 | Why now? | Training-compute chart; log → linear flip |
| 12:00 | 8 | Two Nobel prizes | Citations |
| 13:00 | 9 | The AI technology stack | Climb the tower; TPU systolic-array clip on "Chips" |
| 14:30 | 10 | The journey of "hi" | 9 stops from keyboard to reply |
| 16:00 | 11 | Everything is numbers | **[DEMO]** zoom into Grace Hopper's eye |
| 18:00 | 12 | Tensors | Blender: scalar → vector → matrix → image → batch |
| 19:00 | 13 | ▶ A neuron | manim clip (21 s) |
| 19:30 | 14 | One artificial neuron | **[DEMO]** Iris neuron: fix it by hand, then "let it learn" |
| 22:00 | 15 | Activation functions | **[DEMO]** step / sigmoid / tanh / ReLU / GELU |
| 23:00 | 16 | ▶ A layer is a matrix | manim clip (22 s) |
| 23:30 | 17 | A layer is a matrix | **[DEMO]** step through the matrix multiply |
| 25:00 | 18 | ▶ Layers warp space | manim clip (23 s) |
| 25:30 | 19 | A layer warps space | Rotate, shear, shift, bend; **[DEMO]** drag î and ĵ |
| 28:00 | 20 | Deep = many warps | A trained 21-number network untangles two moons |
| 29:30 | 21 | Weights: the knobs | Real Gemma weights; zoom to the raw numbers; size ladder |
| 31:00 | 22 | Measuring wrongness | Kepler's planets; squared errors drawn as squares; best fit |
| 33:00 | 23 | ▶ Gradient descent | manim clip (18 s) |
| 33:30 | 24 | Rolling downhill | Loss landscape; η = 0.1, 0.6, 0.8 (diverges) |
| 35:30 | 25 | ▶ Real loss landscapes | Blender terrain (12 s loop) |
| 36:15 | 26 | ▶ Backpropagation | manim clip (23 s) |
| 36:45 | 27 | Backpropagation | Forward, backward, nudge, train ×20 |
| 38:45 | 28 | Watch a network learn | **[DEMO]** live training on spirals |
| 41:15 | 29 | Words become vectors | Gemma's embedding map; Jupiter's neighbours; analogies |
| 42:45 | 30 | ▶ Attention | manim clip (22 s) |
| 43:15 | 31 | Attention | Real Gemma heads: coreference, previous-token, sink |
| 45:15 | 32 | The Transformer in 3D | bbycroft.net/llm (internet) |
| 46:15 | 33 | ▶ Softmax & temperature | manim clip (20 s) |
| 46:45 | 34 | Next-token prediction | Reef → gold → largest planet (hallucination) |
| 48:15 | 35 | Training & scaling | Pre-train → post-train → think; Chinchilla curve |
| 49:45 | 36 | AI for science | Rotating GFP protein; six result cards |
| 51:45 | 37 | Which AI for my lab? | **[DEMO]** audience project |
| 52:45 | 38 | What AI still gets wrong | Six cards |
| 54:15 | 39 | Six equations | Recap and the answer |
| 55:15 | 40 | Keep exploring | Links, then Q&A |

If you are running late, shorten slides 5, 9 and 10 (one sentence per card) and skip slide 32. If you are early, spend longer in slides 14, 19 and 28; they are the most fun live.

---

## 🎤 Word-for-word script

### Opening

#### 1 · Inside the Black Box (0:00–0:30)
*The hero animation loops while people settle. Start when the room is ready.*

> Good evening, and welcome to GDG AI for Science.
>
> Behind me is a neural network. Every dot is an artificial neuron, and every streak of light is a number flowing from one neuron to the next. By the end of tonight you'll know exactly what those numbers are, and the six equations that make the whole thing learn.
>
> You don't need any maths background. But I'm not going to hide the maths either: every equation arrives *after* its picture, so by the time you see it, it should look obvious.

**[→]**

#### 2 · I typed "hi" (0:30–2:30)

> Let's start with the smallest conversation you can have with an AI. I typed two letters: h, i.

**[→]** *The probability bars appear.*

> This is what a real language model did with those two letters. It's not a cartoon. These are the actual numbers from **Gemma 3**, a small open cousin of Gemini that I ran on my laptop.
>
> Look at the top row first. That's what the model actually sees: not "hi", but a little script. Start of turn, *user*, *hi*, end of turn, start of turn, *model*. That's ten tokens, and each one is just a number.
>
> From that, it produces a probability for every possible next word. "Hi": 93 percent. "Hello": 6 percent. "How": a third of a percent.

**[DEMO]** Drag *temperature* to about 2, then back to 1. Press *Sample a token* two or three times.

> This slider is *temperature*. Turn it up and the model gets more adventurous: at 2, "Hi" falls to about 71 percent and "Hello" climbs to 19. Turn it down and it becomes a robot that always says exactly the same thing. Each press of this button rolls a weighted die.

**[→]** *The number counts up.*

> For that very first word, it weighed up **262,144** possible tokens: its entire vocabulary.

**[→]** *The reply types out.*

> Then it did it again, and again, one token at a time: "Hi there! How can I help you today?"

**[→]**

> So here's the question for tonight. Not "what does AI mean for society", although we'll get there. I mean, mechanically: **how does a pile of numbers *decide* that?**

**[→]**

#### 3 · Tonight's journey (2:30–3:00)

> Here's the plan. A quick lap of what "AI" means in 2026 and how we got here, then the technology stack underneath it.
>
> Then the heart of the talk, chapters 4 and 5: we'll build a neural network from scratch, and watch it learn. Then we'll scale it up to something like Gemini, and finish with what it means for science, plus the whole story in six equations.

**[→]**

### Chapter 1 · What is AI today?

#### 4 · What do we mean by "AI"? (3:00–5:00)

> First, some vocabulary, because "AI" gets used for everything from a chess program to a chatbot. Think of Russian dolls.
>
> The outer doll is **artificial intelligence**, the whole field, since 1956. It means any technique that makes a computer do something we'd call intelligent if a person did it: chess engines, route planners, rule-based expert systems.

**[→]**

> Inside that is **machine learning**. Instead of writing the rules, you learn them from data. You show examples, not instructions. Think spam filters, or a random forest trained on your lab's spreadsheet.

**[→]**

> Inside that is **deep learning**: machine learning with many-layered neural networks that discover their own features from raw data like images, sound and protein sequences. That's the 2012 revolution, and it's where AlphaFold lives.

**[→]**

> And in the middle sit **foundation models and generative AI**: huge networks pre-trained on vast data, then adapted to many tasks. Gemini, Gemma, image and video generators, protein designers.
>
> One science point before we move on. If your data is a spreadsheet with a few hundred rows, the *outer* dolls often win. We'll come back to that at the end.

**[→]**

#### 5 · The state of play: October 2026 (5:00–7:30)

> So where are we, in October 2026? Six trends, one sentence each.

**[→]**

> **Multimodal in and out.** One model reads text, images, audio and video. Others generate them: Nano Banana for images, Veo for video with sound, Lyria for music, and Genie 4 for worlds you can walk around in.

**[→]**

> **Models that think.** They're trained with reinforcement learning to reason before they answer, spending extra computation on hard problems. In 2025, a Gemini Deep Think model reached gold-medal standard at the International Mathematical Olympiad.

**[→]**

> **Agents.** These are models that use tools: they write and run code, search, browse and operate software. Coding agents like Antigravity, Deep Research, robots.

**[→]**

> **Long context.** More than a million tokens in one go: roughly ten novels, a whole codebase, or hours of video.

**[→]**

> **Open models.** Open-weight models like Gemma 4 run on a laptop or a phone. You can inspect them, fine-tune them, and keep your data private. All of tonight's live data comes from Gemma 3, the generation before.

**[→]**

> **AI for science.** Over 200 million predicted protein structures, millions of new crystals, better weather forecasts, new algorithms, and AI "co-scientists".

**[→]**

> Google's flagship today is **Gemini 4 Argon**: a sparse mixture-of-experts *Transformer* (remember that word), natively multimodal, with that million-token context. Everything on this slide comes from published model cards and papers.
>
> So AI today is less "a chatbot" and more a general-purpose engine that sees, reasons, acts, and does science. How did we get here?

**[→]**

### Chapter 2 · How we got here

#### 6 · 80 years of AI in 3 minutes (7:30–10:30)

> Eighty years in three minutes. The yellow line is my rough sense of hype and funding. It's a vibe, not data, but the winters were real.

**[→]**

> 1943: McCulloch and Pitts write down a mathematical neuron, with inputs, weights and a threshold. 1950: Turing asks "can machines think?" 1956: the Dartmouth workshop gives the field its name. 1958: Rosenblatt's perceptron learns its weights from examples, and the newspapers promise it will soon walk, talk and be conscious.

**[→]**

> It doesn't. In 1969, Minsky and Papert's book *Perceptrons* shows what single-layer networks can't do. In 1973 the Lighthill report savages the field in the UK, and funding collapses. That's the first AI winter.

**[→]**

> In the 1980s, expert systems boom. In 1986, Rumelhart, Hinton and Williams popularise **backpropagation**, the learning algorithm we'll meet in chapter 5. By 1989, LeCun's networks are reading handwritten postcodes. Then expert systems fail to deliver, and a second winter sets in.

**[→]**

> Through the 90s and 2000s, statistical machine learning quietly works. In 1997, Deep Blue beats Kasparov, but with search, not learning. In 2009 comes ImageNet: 14 million labelled images.

**[→]**

> 2012: AlexNet, a deep network trained on two gaming graphics cards, crushes the ImageNet competition, with 15 percent error against 26 for the runner-up. The deep-learning era begins. In 2016, AlphaGo beats Lee Sedol four games to one. And in 2017, Google researchers publish "Attention Is All You Need": the **Transformer**.

**[→]**

> 2020: GPT-3, with 175 billion parameters. The same year, AlphaFold 2 predicts protein structures at near-experimental accuracy.

**[→]**

> November 2022: ChatGPT, and chatbots go mainstream. December 2023: Gemini 1.0, multimodal from the start. 2024: two Nobel prizes, which is the next slide.

**[→]**

> 2025 brings thinking models and an IMO gold medal, and 2026 brings Gemini 4 Argon.
>
> Two things to notice. The winters came when promises outran results. And this boom is riding on things that genuinely work, and that we can measure.

*Hover any emoji for details if someone asks.*

**[→]**

#### 7 · Why now? Compute exploded (10:30–12:00)

> Why now, and not in the 80s? It takes three ingredients: data, compute and algorithms. The one that exploded is compute.
>
> Each dot is a famous model. Up the side is the total number of arithmetic operations used to train it. Filled dots are numbers the authors reported; hollow dots are estimates. Watch the axis: each gridline is ten times the one below it.
>
> AlexNet in 2012 took about 5 times 10 to the 17. Llama 3.1 in 2024 took about 4 times 10 to the 25: almost a hundred million times more. Epoch AI measures the trend at four to five times more compute every single year.

**[→]** *The chart flips to a linear axis.*

> Here's the same chart on a normal, linear axis. Everything before 2020 is squashed flat on the floor. That's what exponential growth looks like.
>
> And here's the rule of thumb in the corner: training compute is about 6 × parameters × tokens. For GPT-3, that's 6 × 175 billion × 300 billion, about 3 times 10 to the 23, and that's exactly where its dot sits. Two of those six operations per parameter happen on the way forward through the network, and four on the way back. You'll see the backward pass in chapter 5.

**[→]**

#### 8 · 2024: AI wins two Nobel prizes (12:00–13:00)

> 2024 is the year the scientific establishment noticed.
>
> The Physics prize went to John Hopfield and Geoffrey Hinton, "for foundational discoveries and inventions that enable machine learning with artificial neural networks". Hinton is one of the backpropagation authors from the timeline.
>
> The Chemistry prize went to David Baker for computational protein design, and to Demis Hassabis and John Jumper of Google DeepMind for AlphaFold.

**[→]**

> AI is no longer just a tool *for* science. It's now part of *how science is done*.

**[→]**

### Chapter 3 · The technology stack

#### 9 · The AI technology stack (13:00–14:30)

> Before we open the box, let's see what it sits on. We'll start at the bottom, with **energy and data centres**: power, cooling and buildings, measured in megawatts.

**[→]** *Chips: the TPU animation plays.*

> Next, **chips**: GPUs, and Google's TPUs. Inside is a grid of multiply-add units called a *systolic array*. That's this animation: numbers pulse through the grid, passed from neighbour to neighbour every clock tick. Gemini 2.5 was trained on pods of 8,960 TPU chips each.

**[→]**

> **Systems software**: compilers and frameworks like JAX, PyTorch and Keras. They split one model across thousands of chips, and you can pip-install the same tools tonight.

**[→]**

> **Models**: an architecture, usually a Transformer, plus its *weights*, billions of learned numbers. That pile of numbers *is* the model.

**[→]**

> **Data and training**: pre-training on trillions of tokens, then post-training with human feedback and reinforcement learning, plus safety evaluation.

**[→]**

> **Serving**: batching thousands of users onto the chips, streaming tokens back, safety filters, watermarking.

**[→]**

> And **apps and agents** on top.
>
> If you remember one line: **the model is just a pile of numbers.** Everything below exists to multiply them fast, and everything above makes them useful.

**[→]**

#### 10 · The 1-second journey of "hi" (14:30–16:00)

> Let's follow "hi" through that whole stack, in about one second. It starts on your device, where the keystrokes become bytes: hex 68, hex 69.

**[→]**

> They cross the internet: DNS finds Google, TLS encrypts them, and packets ride the fibre, maybe a subsea cable.

**[→]**

> At Google's front door: load balancing, sign-in, abuse checks, then routing to a model server.

**[→]**

> The Gemini app adds hidden instructions, your chat history and tool definitions, and wraps it all in a chat template.

**[→]**

> The tokenizer turns "hi" into token number 2202.

**[→]**

> Those ten numbers become ten vectors of 640 numbers each, which flow through 18 layers of attention and neural network. That's the Gemma version; Gemini does the same with a far bigger mixture-of-experts on TPUs.

**[→]**

> Decoding: 262,144 scores, a softmax, "Hi" at 93 percent. Pick it, append it, repeat.

**[→]**

> Guardrails check the output, and SynthID nudges word choices to leave an invisible watermark.

**[→]**

> And the reply streams back: "Hi there! How can I help you today?"
>
> Most of this is eighty years of brilliant plumbing. The new part is stops 5 to 7: tokens in, a neural network, probabilities out. That's what we'll open up for the rest of the talk.

**[→]**

### Chapter 4 · Inside a neural network

#### 11 · Step 0: everything is numbers (16:00–18:00)

> Chapter 4. Step zero: to a computer, *everything is numbers*.

**[DEMO]** Click **🔍 zoom into the eye**, then hover over a few pixels.

> This is Rear Admiral Grace Hopper, the computing pioneer who wrote the first compiler. Let's zoom into her eye. Keep going, and the photo dissolves into numbers.
>
> Each pixel is three numbers, red, green and blue, from 0 to 255. Even this tiny 64-by-75 version is 14,400 numbers. That's all a computer ever sees.

**[→]**

> A brain signal is numbers over time: four EEG channels, 800 samples.

**[→]**

> Text is token IDs. "The" is token 818. "Wombat" is two tokens, "wom" and "bat".

**[→]**

> A protein is a string of amino-acid letters, and those become numbers too.
>
> That's why one technology works across all of science: once your data is numbers, it's the same problem.

**[→]**

#### 12 · Tensors: numbers stacked in boxes (18:00–19:00)
*The Blender clip loops, with captions.*

> We need one word: **tensor**. A tensor is just numbers stacked in a box. One number is a scalar; a list is a vector; a grid is a matrix. A stack of grids is a 3D tensor, and a colour photo is exactly that: height × width × 3. A batch of photos is a 4D tensor.
>
> A neural network is a machine that turns tensors into other tensors, which is literally why Google's library is called *TensorFlow*. GPUs and TPUs are machines built to crunch them.

**[→]**

#### 13 · ▶ A neuron (19:00–19:30)
*The video plays by itself (21 s).*

> *(0 s)* Here's the atom of the whole thing: one artificial neuron. Three inputs: 0.9, 0.2 and 0.6. Each wire has a weight: blue means positive, red means negative, and thickness shows size.
>
> *(4 s)* Each input is multiplied by its weight.
>
> *(7 s)* The neuron adds them up, plus a *bias* of minus 0.2, to get 1.02.
>
> *(10 s)* Then it squashes that through an S-shaped curve called the sigmoid, and 1.02 becomes 0.73.
>
> *(15 s)* In symbols: ŷ equals σ of w dot x plus b. **A neuron is a weighted vote.**

**[→]**

#### 14 · One artificial neuron (19:30–22:00)

> Now let's play with one. These are Fisher's iris flowers, from 1936. Across the bottom is petal length; up the side is petal width. Blue dots are setosa, orange are versicolor. Our neuron gets two inputs, two weights and a bias.
>
> Right now it's wrong on purpose. The yellow line is where the neuron is exactly 50:50, and every flower is on the "setosa" side, so it scores 50 out of 100.

**[DEMO]** Drag **b** slowly from −8 up to about −4.

> The bias is how easily the neuron fires. Watch the line sweep in... and that's 100 out of 100.

**[DEMO]** Drag **w₁** and **w₂**.

> The weights are what the neuron pays attention to. Change how much it cares about length versus width, and the line tilts. The arrow is the weight vector: it always points straight across the line, towards "more orange". The shading is the neuron's confidence.

**[DEMO]** Switch to **versicolor vs virginica**, then press **⚙️ let it learn**.

> Now a harder pair. These overlap, so no straight line can be perfect. Let it learn: this is chapter 5 in miniature. It nudges w₁, w₂ and b downhill until it reaches 94 out of 100. The best any straight line can do here is 97.
>
> So: **weights are what the neuron cares about; the bias is how easily it fires.**

**[→]**

#### 15 · Why bend? Activation functions (22:00–23:00)

**[DEMO]** Click through *step*, *sigmoid*, *tanh*, *ReLU* and *GELU*.

> Why does the neuron bend its sum with that S-curve? Here are the options. The 1943 neuron used a hard step: all or nothing. The problem is that it has no slope, so it can't learn by rolling downhill, and you'll see in a few minutes why that matters.
>
> Sigmoid is a smooth step. Tanh is the same thing centred on zero. ReLU is max of zero and z: dead simple, and it powered the 2012 boom. GELU is a smooth ReLU, and it's used inside Transformers like Gemma.
>
> And here's why we need a bend at all: **two straight-line steps in a row are just one straight-line step.** W₂ times W₁ is just another matrix. Without the bend, a hundred layers collapse into one. *The bend is what makes deep learning deep.*

**[→]**

#### 16 · ▶ A layer is a matrix (23:00–23:30)
*Video (22 s).*

> *(0 s)* Now put four neurons side by side, all looking at the same three inputs. That's twelve weights.
>
> *(2 s)* Watch each neuron's weights fly into one row of a grid: a matrix, W.
>
> *(7 s)* The inputs become a column, x. Add the biases, b, and apply σ.
>
> *(10 s)* Row one times the column is our neuron from before: 1.02, then 0.73.
>
> *(16 s)* The other rows give the other neurons.
>
> *(18 s)* So **a whole layer is one matrix multiplication**: a equals σ of W x plus b.

**[→]**

#### 17 · A whole layer = one matrix multiplication (23:30–25:00)

> Same numbers; now you drive.

**[DEMO]** Press **next neuron ▸** four times. Hover a matrix entry to light up its wire.

> Row one: 1.2 times 0.9, minus 0.8 times 0.2, plus 0.5 times 0.6, which gives 1.22. Then row two, row three, row four. Every entry of the matrix is one wire in the picture.

**[DEMO]** Press **next neuron ▸** twice more.

> Add the biases, so 1.22 becomes 1.02, then squash. We get 0.73, 0.58, 0.57 and 0.33, exactly as in the video.
>
> This is why AI runs on GPUs and TPUs: they're chips built to do millions of these row-times-column products at the same time.

**[→]**

#### 18 · ▶ Layers warp space (25:00–25:30)
*Video (23.5 s).*

> *(0 s)* Here's another way to see a layer, the 3Blue1Brown way. Two classes, blue and orange, are tangled together, so no straight line separates them.
>
> *(5 s)* In layer one, the matrix stretches and rotates the entire plane, grid and points together.
>
> *(7.5 s)* The bias shifts it.
>
> *(9 s)* And tanh bends it.
>
> *(12 s)* Layer two does the same again: stretch, shift, bend.
>
> *(19 s)* And now a single straight line separates them.

**[→]**

#### 19 · Tensor transformations: a layer warps space (25:30–28:00)

> Let's do that by hand. The green arrow, i-hat, and the red arrow, j-hat, show where the matrix sends the two basic directions. The first column of the matrix is where i-hat lands; the second is where j-hat lands. Everything else follows along.

**[→]**

> This is a rotation.

**[→]**

> This is a shear: j-hat tips over and the whole grid slants.

**[DEMO]** Drag one of the arrow tips, then click **squash**.

> Drag the tips and the grid follows. The number in the corner is the *determinant*: how much area grows. Squash the plane flat and the determinant goes to zero. Information is destroyed, and no later layer can undo that.

**[→]**

> The bias shifts the whole plane.

**[→]**

> And here's the bend: tanh squashes everything into the dashed box, and straight grid lines become curves. That curving is the only non-straight thing in the whole picture.
>
> A layer with 640 inputs does exactly this, in 640 dimensions: **stretch, rotate, shift, bend.**

**[→]**

#### 20 · Deep learning = warp, warp, warp (28:00–29:30)

> Deep learning is warp, warp, warp, until the problem is simple.

**[→]** *Plays all 9 stages, about 15 s.*

> This is a real trained network with just 21 numbers in it. Layer one stretches and rotates, shifts, and bends: the moons get squeezed into an S-shaped band. Layer two unfolds it. Layer three pushes the two classes into opposite corners. And now the final straight line separates them, 100 percent correct.
>
> That's the central intuition of deep learning. **Each layer makes the problem a little simpler, until a straight line is enough.** Big networks do it in thousands of dimensions, dozens of layers deep.

**[→]**

#### 21 · Weights: the knobs (29:30–31:00)

> Everything we've built is controlled by weights: the knobs. Here are some real ones.
>
> This image is one weight matrix from Gemma 3: the *query* matrix in its first attention layer. That's 655,360 numbers at one pixel each, blue for positive and red for negative. The four blocks are four attention heads, which you'll meet in chapter 6.

**[→]** *Zooms into the yellow box.*

> Let's zoom into one little patch, and there they are: zero point zero one two, minus zero point zero three one, and so on. **Nobody wrote these numbers. They were learned.** This is what "knowledge" looks like inside a neural network.
>
> And how many knobs are there? Our neuron had 3. The warp network had 21. Gemma 3 270M has 268 million, and 63 percent of those are just the word table. GPT-3 has 175 billion. Frontier models are bigger again, and Gemini 4's size isn't disclosed.

*Optional:* click **embeddings** to show a slice of the word table (one row per word).

**[→]**

### Chapter 5 · How machines learn

#### 22 · Learning step 1: measure how wrong you are (31:00–33:00)

> Chapter 5. How do you set 268 million knobs? Step one is to measure how wrong you are.
>
> Our data is the eight planets. Across is distance from the Sun; up is the time to go around once. Both are on log scales. Can a machine rediscover a law of nature from data?
>
> Our model is a straight line with two knobs: slope w and intercept b. Each red square is one planet's error, *squared*, and literally drawn as a square. The loss, L, is their average area, and right now it's 0.35.

**[DEMO]** Drag the yellow handles to shrink the squares.

> Make the squares smaller... smaller... That's the loss function written up here: the average of prediction minus truth, squared. **Learning means making the red squares as small as possible.**

**[→]** *Best fit; the green card appears.*

> Best fit: w equals 1.498. That's Kepler's third law! T squared is proportional to a cubed, which means log T is one and a half times log a. Kepler needed years of Tycho Brahe's observations to find it, in 1619. We needed one button.

**[→]** *Raw axes.*

> On ordinary axes, our straight line becomes the familiar curve.

**[→]**

#### 23 · ▶ Gradient descent (33:00–33:30)
*Video (18.5 s).*

> *(0 s)* But how do you minimise without a magic button? Picture the loss as a landscape, and roll downhill.
>
> *(2.5 s)* The rule: look at the slope, and take a step downhill of size η, the *learning rate*. w becomes w minus η times dL/dw.
>
> *(3.5 s)* Take too big a step and you overshoot, bouncing back and forth across the valley.
>
> *(9.6 s)* Get it just right, and the steps shrink as the slope flattens, all the way into the minimum.

**[→]**

#### 24 · Learning step 2: roll downhill (33:30–35:30)

> Here's the real landscape for our Kepler problem. Every point is a choice of slope and intercept, and the colour shows how wrong that choice is: yellow is bad, dark blue is good. The green arrow points downhill.

**[→]**

> With a learning rate of 0.1 it's slow and steady: about 180 steps. Watch the line on the right swing into place while the loss underneath falls.

**[→]**

> At 0.6 it's much faster, but it zig-zags across the valley.

**[→]**

> At 0.8: boom. Each step overshoots more than the last, and it diverges. Choosing the learning rate is one of the black arts of deep learning.

*Optional:* click anywhere on the map to drop the ball somewhere new.

**[→]**

#### 25 · ▶ Real loss landscapes (35:30–36:15)
*Blender clip; it loops.*

> With two knobs, we can draw the landscape. Gemma has 268 million knobs, so its landscape has 268 million dimensions, full of valleys, ridges and little dips. Here the ball gets caught in a side basin, escapes on momentum, and settles in the deepest valley.
>
> Gradient descent doesn't care how many dimensions there are. It just needs the slope in every direction, and *that* is the gradient. So how do you compute 268 million slopes?

**[→]**

#### 26 · ▶ Backpropagation (36:15–36:45)
*Video (23 s).*

> *(0 s)* The answer is *backpropagation*. Here's a tiny network drawn as a chain: x times w, then σ, then the squared error.
>
> *(2.6 s)* On the forward pass, numbers flow left to right: z is 1, ŷ is 0.731, and the loss is 0.0723.
>
> *(7 s)* On the backward pass, blame flows right to left. Each box only knows its own local slope: −0.538, 0.197, and 2.
>
> *(12 s)* The *chain rule* says: multiply them. That gives −0.2115, which is how much the loss changes if you nudge w.
>
> *(16 s)* So nudge w the other way...
>
> *(19 s)* ...and the loss drops.

**[→]**

#### 27 · Learning step 3: backpropagation assigns the blame (36:45–38:45)

**[→]**

> On the forward pass, blue pulses carry the values: w x is 1, ŷ is 0.731, and the loss is 0.072.

**[→]**

> On the backward pass, green pulses carry the blame. Each box multiplies by its own local slope, and the gradients appear under every node.

**[→]**

> Now nudge the weights against their gradients, and the loss drops.

**[→]**

> Do it twenty times: forward, backward, nudge. The loss falls towards zero.
>
> Each box only needs its *local* slope, and the chain rule multiplies them together. That's how one backward pass through a 268-million-weight network gives you all 268 million slopes at once, for roughly twice the cost of the forward pass. That's where the 4 in "6 N D" comes from.

**[→]**

#### 28 · Put it together: watch a network learn (38:45–41:15)

> Let's put it all together. This is a real neural network training live, in this web page: about fifty lines of maths, no libraries. The task is two interleaved spirals, the hardest of these toy problems.

**[→]** *Training starts.*

> Forward, loss, backward, update, hundreds of times a second. Watch the decision boundary on the left.
>
> On the right, every little square is one neuron's opinion over the whole plane. The first layer learns simple slanted edges, the next layer combines those into curves, and the output combines the curves into spirals. Nobody told it to do that.

**[DEMO]** Click **1 hidden layer**, then **XOR** with **neurons/layer = 1**, then back to **3** layers.

> With one hidden layer, it struggles. And XOR with a single neuron is impossible: you can't separate it with one straight line. That's the Minsky and Papert result that helped trigger the first winter. Add neurons and layers, and it's trivial.
>
> That loop, forward, loss, backward, update, is **all of deep learning**. Gemini runs the same loop, just with vastly more numbers.

**[→]**

### Chapter 6 · From networks to Gemini

#### 29 · Words become vectors (41:15–42:45)

> Chapter 6: from networks to Gemini. Here's the first problem. Networks need numbers, but we have words. The solution is to give every token a list of numbers (640 of them, in Gemma) and let training choose them.
>
> This map squashes those 640 dimensions down to two. Nobody told the model what a planet is, but the planets cluster, the chemical elements cluster, emotions cluster, numbers cluster. And look: "lead" sits right next to the verbs, because it's also a verb.

**[→]** *Jupiter is highlighted.*

> Here are Jupiter's nearest neighbours out of all 262,144 tokens: Saturn, Venus, Neptune, Mars, Titan, Pluto, Uranus... and Zeus.
>
> You can even do arithmetic with meaning. King minus man plus woman gives queen. Paris minus France plus Japan gives Tokyo. Sodium minus Na plus K gives potassium. These are real results from Gemma's word table: 14 out of 18 worked, and I've left the failures in.

**[→]**

#### 30 · ▶ Attention (42:45–43:15)
*Video (22 s). The numbers in this clip are illustrative.*

> *(0 s)* The second problem: words change meaning with context. "The wombat crossed the road because it was hungry." What is "it"?
>
> *(1.5 s)* Every token makes three vectors: a *query* (what am I looking for?), a *key* (what do I contain?), and a *value* (what will I pass on?).
>
> *(3 s)* "It" compares its query with every earlier key.
>
> *(6.7 s)* A softmax turns those scores into weights, and "wombat" wins.
>
> *(8.7 s)* A weighted sum of the values flows into "it". Now "it" knows about the wombat.
>
> *(11 s)* Every token does this at once, which gives a triangular matrix: each word can only look backwards.
>
> *(16.7 s)* And that's the famous equation: softmax of Q K-transpose over root d, times V.

**[→]**

#### 31 · Attention: words look at other words (43:15–45:15)

> That was illustrative. This is real: attention inside Gemma 3, on the sentence "The trophy did not fit in the suitcase because it was too big."
>
> This is layer 9, head 2. From "it", 51 percent of the attention goes to "trophy", and only 8 percent to "suitcase". The model has worked out what "it" refers to, and nobody programmed that.

**[DEMO]** Hover a few other words to see where they look.

**[→]**

> Other heads do other jobs. This one, layer 2 head 3, just looks one word back. It's a simple pattern: see the diagonal in the heat map.

**[→]**

> And this one, layer 17 head 3, parks about 95 percent of its attention on the very first token. It's a do-nothing "attention sink" for when there's nothing useful to look at.
>
> Gemma has 18 layers of 4 heads, so 72 of these, each specialised. Gemini has far more.

**[→]**

#### 32 · The whole Transformer, in 3D (45:15–46:15)

**[DEMO]** Click **Load bbycroft.net/llm** (needs internet). Scroll or zoom gently.

> Here's the whole thing in 3D, built by Brendan Bycroft. This is a small GPT, and every block is a matrix you now understand. The word table comes first. Then, repeated layer after layer: attention, with its queries, keys and values, followed by a small neural network called the MLP. At the end, one last matrix and a softmax over the vocabulary.
>
> Neurons, matrices, bends and attention, stacked dozens of times.

*No internet?* "This one needs the internet, and the link is on the last slide. It's worth five minutes of your evening." Then **[→]**.

**[→]**

#### 33 · ▶ Softmax & temperature (46:15–46:45)
*Video (20 s), illustrative numbers.*

> *(0 s)* The last step is turning scores into a choice. These are the raw scores, called *logits*, for five candidate tokens.
>
> *(3 s)* Exponentiate them, and the leader dominates.
>
> *(6 s)* Divide by the total, and you get probabilities that add up to one.
>
> *(9.6 s)* Temperature divides the scores first.
>
> *(11.8 s)* At low temperature, "Au" wins every time.
>
> *(13.9 s)* At high temperature, everything flattens out and gets more random.
>
> *(16.8 s)* And back to one.

**[→]**

#### 34 · A language model is a next-token predictor (46:45–48:15)

> So a language model is a *next-token predictor*. These are real outputs from Gemma 3 270M, the raw pre-trained version.
>
> "The Great Barrier Reef is located off the coast of..." Australia, 49 percent; Queensland, 34. Good model.

**[→]**

> "The chemical symbol for gold is..." Au at 32 percent, "gold" at 23.

**[DEMO]** Drag temperature to 0.3.

> Turn the temperature down and Au jumps to about 75 percent.

**[→]**

> "The largest planet in our solar system is..." The top answer is "the", then "a". *Jupiter* gets less than one percent, and if you keep picking the top word, it goes round in circles: "the largest planet in the solar system. It is the largest planet in..."
>
> **Prediction is not truth.** That's a hallucination, in a model small enough to run on a phone. Big models are far better, but it's the same mechanism.
>
> Write one token, append it, predict again. That's how "Hi there! How can I help you today?" got written.

**[→]**

#### 35 · Training a giant: predict, align, think, and scale (48:15–49:45)

> How do you get from that to Gemini? Three stages.
>
> One, **pre-training**: predict the next token across trillions of tokens of text, code, images and audio, for weeks, on thousands of chips. The loss, called cross-entropy, measures how surprised the model was by the true next token.
>
> Two, **post-training**: fine-tune on great example answers, then use reinforcement learning from human and AI feedback. That's where "Hi there! How can I help?" comes from. Give the raw pre-trained model a bare "hi" and its favourite next token is a comma, as if it were starting an email.
>
> Three, **thinking**: reinforcement learning on problems with checkable answers, like maths and code, teaches models to reason step by step.
>
> Then there's scale. This chart is the Chinchilla scaling law: the loss falls smoothly and predictably as you add parameters, N, and data, D. For a fixed compute budget, the bright curve, there's a sweet spot. Too small a model leaves capability on the table; too big a model starves for data. The sweet spot is about 20 tokens of training data per parameter.

**[→]**

> With a small budget, the best choice is a small model.

**[→]**

> With a huge budget, it's hundreds of billions of parameters trained on trillions of tokens. That predictability is why companies were willing to spend so much.

**[→]**

### Chapter 7 · AI for science

#### 36 · AI for science: beyond chatbots (49:45–51:45)

> Chapter 7: AI for science, beyond chatbots. On the left is a real protein: green fluorescent protein, from a jellyfish. It's the glowing tag used in labs everywhere, and it earned its own Nobel prize in 2008. Eleven yellow strands form a barrel, with the light-emitting part tucked inside. AlphaFold predicts shapes like this from the amino-acid sequence alone.

**[→]**

> **AlphaFold**: over 200 million predicted structures, free to everyone. AlphaFold 3 adds DNA, RNA and drug molecules.

**[→]**

> **GNoME**: 2.2 million new crystal structures, about 380,000 of them predicted stable. They're candidates for batteries, solar cells and superconductors.

**[→]**

> **GenCast**: 15-day ensemble weather forecasts that beat the leading physics-based system on 97.2 percent of targets.

**[→]**

> **AlphaEvolve**: a Gemini coding agent that found a way to multiply 4×4 complex matrices using 48 multiplications, beating Strassen's method from 1969.

**[→]**

> **AI co-scientist**: a team of Gemini agents that propose and debate testable hypotheses.

**[→]**

> **AlphaGenome**: it reads up to a million DNA letters and predicts how variants change gene regulation.
>
> It's the same maths every time: multiply, bend, roll downhill, applied to nature's data.

**[→]**

#### 37 · Which AI should my lab use? (51:45–52:45)

> So which AI should *your* lab use? Who's got a project?

**[DEMO]** Take one answer from the audience and click its data type, size and goal.

> Two takeaways. For small tabular data, use classical machine learning first: gradient-boosted trees usually beat deep nets, train in seconds, and are easier to explain. Put the GPU down. For everything else, start from a pre-trained model rather than training from scratch.

**[→]**

### Wrap-up

#### 38 · What AI still gets wrong (52:45–54:15)

> Now, honestly: what does AI still get wrong?

**[→]**

> **Hallucination.** It predicts *plausible* tokens, not *true* ones; you saw that with the largest planet. Verify facts, citations and numbers.

**[→]**

> **Bias and data.** Models inherit the gaps and biases of their training data, including scientific blind spots.

**[→]**

> **Energy and cost.** Compute grows four to five times a year. Efficiency is a research field of its own.

**[→]**

> **Evaluation.** Benchmarks leak into training data and saturate fast. Measuring real ability is hard.

**[→]**

> **The black box.** We can see every single weight (you've seen them tonight) and we still struggle to explain *why*. Interpretability is wide open, and it's a great field for scientists.

**[→]**

> **Safety and misuse.** Guardrails, watermarking, and frontier-safety evaluations are part of every release.
>
> My rule of thumb: treat AI like a brilliant but overconfident postdoc. Use it a lot, and check its work.

**[→]**

#### 39 · The whole story in six equations (54:15–55:15)

> So, back to the question: how does a pile of numbers decide to say "Hi there"?

**[→]** "One: a layer. Multiply by weights, shift, bend."
**[→]** "Two: measure the error."
**[→]** "Three: roll downhill."
**[→]** "Four: assign the blame backwards, with the chain rule."
**[→]** "Five: let words look at other words."
**[→]** "Six: turn scores into choices."

**[→]**

> Multiply, bend, repeat. Measure the error, roll downhill, repeat.
>
> *(pause)*
>
> Then do it at an absurd scale.
>
> Thank you!

**[→]**

#### 40 · Keep exploring (Q&A)

> Everything tonight runs offline from a single HTML file, and the links are up here. 3Blue1Brown's neural-network series is the best next step. I'm happy to take questions.

---

## 🙋 Q&A bank

**"Does it actually understand anything? Is it conscious?"**
It builds internal representations that behave like understanding: Jupiter sits near Saturn, and "it" finds "trophy". But it is a function from tokens to probabilities, with no goals or experiences of its own. Whether that counts as "understanding" is a philosophy question, not an engineering one. It's useful to keep both facts in mind.

**"Why does it hallucinate, and can it be fixed?"**
It's trained to produce *likely* text, not *true* text. When it doesn't know, a fluent guess is still likely text. Big models hallucinate much less, and grounding (search, retrieval over your documents, running code) helps a lot. It isn't solved, so verify anything that matters.

**"Is it learning from me while I chat?"**
Not during the conversation: the weights are frozen. It only "remembers" what's in its context window (up to about a million tokens). Whether conversations are used for future training depends on the product's settings and terms. For sensitive data, run an open model like Gemma locally.

**"Why did you use Gemma, not Gemini, for the demos?"**
Gemma's weights are open, so I could read the actual numbers: probabilities, attention and weights. Gemini's internals aren't public. The mechanism is the same family (Transformer, next-token prediction), and Gemma 3 uses the same tokenizer as Gemini 2.0.

**"How big is Gemini 4?"**
Not disclosed. The model card says it's a sparse mixture-of-experts Transformer. For scale, open models range from 270 million to hundreds of billions of parameters.

**"What's a mixture of experts?"**
Instead of one giant MLP in each layer, there are many smaller "expert" MLPs, and a router sends each token to just a few of them. You get the knowledge of a huge model at the running cost of a much smaller one.

**"How does it do maths if it only predicts tokens?"**
Thinking models generate long step-by-step reasoning (trained with reinforcement learning on checkable problems), and they can call tools such as a Python interpreter. Tokenization also matters: Gemma splits numbers into single digits ("9.11" is four tokens: 9, ., 1, 1), which helps arithmetic.

**"Is the 'how many r's in strawberry' thing real?"**
It comes from tokenization. In Gemma 3's tokenizer, "strawberry" is a *single* token (#115137), so the model never sees the letters unless it spells the word out. Thinking models now handle this by spelling first.

**"How much energy does this use?"**
Training frontier models takes data-centre-scale power, measured in megawatts for weeks. Each individual query is small, but there are billions of them. Efficiency (MoE, distillation, better chips, smaller models like Gemma) is a major research area. Measure before you train: for many science problems a small model on a laptop is enough.

**"Will AI replace scientists?"**
It replaces *tasks*, not the job: literature triage, code, fitting and searching huge hypothesis spaces. The 2024 Nobel prizes went to people who used AI to answer questions they cared about. Asking good questions, designing experiments and judging evidence are still human work.

**"Can I fine-tune a model on my own lab's data?"**
Yes. Start with an open model (Gemma) and LoRA fine-tuning in Keras, JAX or PyTorch. A few thousand good examples often matter more than model size. For small tabular data, try gradient-boosted trees first.

**"What's the difference between attention and the MLP?"**
Attention moves information *between* tokens (who should I listen to?). The MLP processes each token *on its own* (what do I now know?), and is where much of the factual knowledge seems to live. A Transformer layer alternates the two.

**"Why do we need GPUs or TPUs?"**
Almost all the work is matrix multiplication, and those chips are grids of thousands of multiply-add units doing it in parallel. That's the systolic array in the slide-9 animation.

**"What temperature do real products use?"**
It varies and is often tunable. The Gemini API's default is 1.0 for Gemini 3, and the model is trained to work well at that setting. Lower is more deterministic; higher is more varied.

**"Isn't 'roll downhill' going to get stuck in local minima?"**
In millions of dimensions, true dead-end minima are rare; most flat spots are saddles with some way down. Momentum, noise from small batches, and optimisers like Adam help it keep moving. The Blender clip shows the ball escaping a side basin.

**"Why 262,144 tokens? Why not letters?"**
Bigger tokens mean shorter sequences, and the cost grows with sequence length. Sub-word tokens are a compromise: common words get one token ("hi" is #2202), and rare words are built from pieces ("Deoxyribonucleic" is five). 262,144 is 2 to the 18th; a big vocabulary covers many languages well.

---

## 🔢 Numbers cheat sheet (all verified from the deck's data files)

| Fact | Value |
|---|---|
| "hi" → first word (Gemma 3 270M instruct, chat template) | Hi 93.26 % · Hello 6.31 % · How 0.37 %; at T = 2: Hi ≈ 71 %, Hello ≈ 19 % |
| Prompt length with the chat template | 10 tokens; "hi" = #2202, "Hi" = #10979 |
| Vocabulary | 262,144 tokens |
| Raw pre-trained model given a bare "hi" | "," 27 % · " all" 9 % · " guys" 8 % |
| Reef / gold / water / DNA / mitochondria | Australia 49 % · Au 32 % (≈75 % at T = 0.3) · oxygen 90 % · "cytos…" 99.8 % · powerhouse 20 % |
| Largest planet | Jupiter 0.85 %; the greedy continuation loops |
| Gemma 3 270M | 268,098,176 parameters; 63 % in the word table; 18 layers × 4 heads; 640-dim |
| Neuron | 1.08 − 0.16 + 0.30 − 0.20 = 1.02 → σ = 0.73 |
| Layer outputs | 0.73, 0.58, 0.57, 0.33 |
| Warp network | 21 numbers, 100 % accuracy |
| Iris "let it learn" (hard pair) | 94 / 100 (best straight line 97) |
| Kepler fit | w = 1.498 → T² ∝ a³ |
| Learning rates (Kepler) | 0.1 converges in ≈180 steps; 0.6 zig-zags; 0.8 diverges |
| Backprop example | z = 1, ŷ = 0.731, L = 0.0723; −0.538 × 0.197 × 2 = −0.2115 |
| Attention (L9 H2, trophy sentence) | "it" → trophy 51 %, suitcase 8 % |
| Attention sink (L17 H3) | ≈95 % on the first token; 43 of 72 heads put > 50 % there |
| Jupiter's neighbours | Saturn .73 · Venus .71 · Neptune .69 · Mars .68 · Titan · Pluto · Uranus · Zeus |
| Analogies | 14 of 18 correct |
| Compute | AlexNet ≈ 5×10¹⁷ FLOP → Llama 3.1 405B ≈ 4×10²⁵; ×4–5 per year (Epoch AI) |
| C ≈ 6ND | GPT-3: 6 × 175 B × 300 B ≈ 3×10²³ |
| Scaling sweet spot | ≈ 20 tokens per parameter |
| Science cards | AlphaFold DB 200 M+ · GNoME 2.2 M (380 k stable) · GenCast 97.2 % · AlphaEvolve 48 mults · AlphaGenome 1 M letters |

---

## 🧯 If something breaks

* **A video won't start:** press **K** (play) or **J** (restart). If it still fails, the poster frame shows, so narrate from the cue times above.
* **No internet on slide 32:** say the line above and move on. Nothing else needs a network.
* **A demo looks stuck:** leave the slide and come back; every demo resets on entry. Or reload with `#slide-id` in the URL.
* **Wrong screen size:** the deck scales to any window. Press **F** for fullscreen. It's designed for 16:9.
* **Lost?** Press **O** for the overview and click any slide.

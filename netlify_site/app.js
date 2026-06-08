(() => {
  "use strict";

  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  const tabs = Array.from(document.querySelectorAll("[data-target]"));
  const state = { activePanel: "cv", gamesReady: false };

  const byId = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const choice = (items) => items[Math.floor(Math.random() * items.length)];

  function activatePanel(target) {
    if (!panels.some((panel) => panel.dataset.panel === target)) {
      target = "cv";
    }

    state.activePanel = target;
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === target));
    tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.target === target));
    history.replaceState(null, "", `#${target}`);
    if (state.gamesReady) {
      drawPong();
      drawTurtle();
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      activatePanel(tab.dataset.target);
    });
  });

  activatePanel(location.hash.replace("#", "") || "cv");

  const pomodoro = {
    reps: 0,
    seconds: 0,
    running: false,
    interval: null,
    mode: "Timer",
  };

  const pomodoroEls = {
    time: byId("pomodoro-time"),
    mode: byId("pomodoro-mode"),
    start: byId("pomodoro-start"),
    reset: byId("pomodoro-reset"),
    marks: byId("pomodoro-marks"),
    work: byId("work-minutes"),
    short: byId("short-minutes"),
    long: byId("long-minutes"),
  };

  function minutesFrom(input, fallback) {
    const value = Number.parseInt(input.value, 10);
    return Number.isFinite(value) ? clamp(value, 1, 60) : fallback;
  }

  function renderPomodoro() {
    const minutes = Math.floor(pomodoro.seconds / 60);
    const seconds = String(pomodoro.seconds % 60).padStart(2, "0");
    pomodoroEls.time.textContent = `${minutes}:${seconds}`;
    pomodoroEls.mode.textContent = pomodoro.mode;
    pomodoroEls.start.textContent = pomodoro.running ? "Pause" : "Start";

    const workSessions = Math.floor(pomodoro.reps / 2);
    pomodoroEls.marks.innerHTML = "";
    for (let index = 0; index < workSessions; index += 1) {
      pomodoroEls.marks.appendChild(document.createElement("span"));
    }
  }

  function nextPomodoroSession() {
    pomodoro.reps += 1;
    const work = minutesFrom(pomodoroEls.work, 25) * 60;
    const shortBreak = minutesFrom(pomodoroEls.short, 5) * 60;
    const longBreak = minutesFrom(pomodoroEls.long, 20) * 60;

    if (pomodoro.reps % 8 === 0) {
      pomodoro.mode = "Long Break";
      pomodoro.seconds = longBreak;
    } else if (pomodoro.reps % 2 === 0) {
      pomodoro.mode = "Short Break";
      pomodoro.seconds = shortBreak;
    } else {
      pomodoro.mode = "Work";
      pomodoro.seconds = work;
    }
  }

  function stopPomodoro() {
    window.clearInterval(pomodoro.interval);
    pomodoro.interval = null;
    pomodoro.running = false;
  }

  function runPomodoro() {
    stopPomodoro();
    pomodoro.running = true;
    renderPomodoro();
    pomodoro.interval = window.setInterval(() => {
      pomodoro.seconds -= 1;
      if (pomodoro.seconds <= 0) {
        nextPomodoroSession();
      }
      renderPomodoro();
    }, 1000);
  }

  pomodoroEls.start.addEventListener("click", () => {
    if (pomodoro.running) {
      stopPomodoro();
      renderPomodoro();
      return;
    }
    if (pomodoro.seconds <= 0) {
      nextPomodoroSession();
    }
    runPomodoro();
  });

  pomodoroEls.reset.addEventListener("click", () => {
    stopPomodoro();
    pomodoro.reps = 0;
    pomodoro.seconds = 0;
    pomodoro.mode = "Timer";
    renderPomodoro();
  });

  renderPomodoro();

  const flashcardEls = {
    count: byId("flashcard-count"),
    card: byId("flashcard"),
    title: byId("flashcard-title"),
    word: byId("flashcard-word"),
    romanize: byId("flashcard-romanize"),
    english: byId("flashcard-english"),
    next: byId("flashcard-next"),
    known: byId("flashcard-known"),
  };

  const flashcards = {
    all: [],
    deck: [],
    current: null,
    currentIndex: -1,
    flipTimer: null,
  };

  const blockedFlashcardTerms = [
    "asshole",
    "bastard",
    "bitch",
    "bullshit",
    "cocaine",
    "dope",
    "fucker",
    "heroin",
    "hooker",
    "nazi",
    "penis",
    "piss",
    "prostitute",
    "psycho",
    "sex",
    "slut",
    "whore",
  ];

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];

      if (char === '"' && quoted && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(value);
        value = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") {
          index += 1;
        }
        row.push(value);
        if (row.some((cell) => cell.trim() !== "")) {
          rows.push(row);
        }
        row = [];
        value = "";
      } else {
        value += char;
      }
    }

    row.push(value);
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }

    const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, "").trim());
    return rows
      .map((cells) => {
        const record = {};
        headers.forEach((header, index) => {
          record[header] = (cells[index] || "").trim();
        });
        return record;
      })
      .filter((record) => record.Korean && record.Romanize && record.English);
  }

  function safeFlashcard(record) {
    const english = record.English.toLowerCase();
    return !blockedFlashcardTerms.some((term) => english.includes(term));
  }

  function updateFlashcardCount() {
    flashcardEls.count.textContent = `${flashcards.deck.length} cards`;
  }

  function flipFlashcard() {
    flashcardEls.card.classList.add("is-flipped");
  }

  function showFlashcard() {
    window.clearTimeout(flashcards.flipTimer);
    if (flashcards.deck.length === 0) {
      flashcards.deck = [...flashcards.all];
    }

    if (flashcards.deck.length === 0) {
      flashcardEls.word.textContent = "No data";
      flashcardEls.romanize.textContent = "";
      flashcardEls.english.textContent = "CSV unavailable";
      flashcardEls.count.textContent = "0 cards";
      return;
    }

    flashcards.currentIndex = Math.floor(Math.random() * flashcards.deck.length);
    flashcards.current = flashcards.deck[flashcards.currentIndex];
    flashcardEls.card.classList.remove("is-flipped");
    flashcardEls.word.textContent = flashcards.current.Korean;
    flashcardEls.romanize.textContent = flashcards.current.Romanize;
    flashcardEls.english.textContent = flashcards.current.English;
    updateFlashcardCount();
    flashcards.flipTimer = window.setTimeout(flipFlashcard, 1500);
  }

  flashcardEls.next.addEventListener("click", showFlashcard);
  flashcardEls.known.addEventListener("click", () => {
    if (flashcards.currentIndex >= 0) {
      flashcards.deck.splice(flashcards.currentIndex, 1);
    }
    showFlashcard();
  });

  fetch("data/korean_flashcard.csv")
    .then((response) => response.text())
    .then((text) => {
      flashcards.all = parseCsv(text).filter(safeFlashcard);
      flashcards.deck = [...flashcards.all];
      showFlashcard();
    })
    .catch(() => {
      flashcardEls.count.textContent = "CSV unavailable";
      flashcardEls.word.textContent = "Open with server";
      flashcardEls.romanize.textContent = "";
      flashcardEls.english.textContent = "Netlify will load the card data";
    });

  const blackjackEls = {
    status: byId("blackjack-status"),
    dealerScore: byId("dealer-score"),
    playerScore: byId("player-score"),
    dealerCards: byId("dealer-cards"),
    playerCards: byId("player-cards"),
    deal: byId("deal-game"),
    hit: byId("hit-card"),
    stand: byId("stand-card"),
  };

  const blackjack = {
    player: [],
    dealer: [],
    playing: false,
    message: "Ready",
  };

  function dealCard() {
    const deck = [
      { label: "A", value: 11 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 },
      { label: "6", value: 6 },
      { label: "7", value: 7 },
      { label: "8", value: 8 },
      { label: "9", value: 9 },
      { label: "10", value: 10 },
      { label: "J", value: 10 },
      { label: "Q", value: 10 },
      { label: "K", value: 10 },
    ];
    return { ...choice(deck) };
  }

  function calculateScore(cards) {
    const values = cards.map((card) => card.value);
    let score = values.reduce((total, value) => total + value, 0);

    if (score === 21 && values.length === 2) {
      return 0;
    }

    let aces = values.filter((value) => value === 11).length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return score;
  }

  function scoreLabel(score) {
    return score === 0 ? "Blackjack" : String(score);
  }

  function compareBlackjack(playerScore, dealerScore) {
    if (playerScore === dealerScore) return "Draw";
    if (dealerScore === 0) return "Dealer has Blackjack";
    if (playerScore === 0) return "Blackjack win";
    if (playerScore > 21) return "You went over";
    if (dealerScore > 21) return "Dealer went over";
    return playerScore > dealerScore ? "You win" : "Dealer wins";
  }

  function renderCards(container, cards, hideSecond) {
    container.innerHTML = "";
    cards.forEach((card, index) => {
      const cardEl = document.createElement("div");
      cardEl.className = hideSecond && index === 1 ? "card hidden" : "card";
      cardEl.textContent = hideSecond && index === 1 ? "?" : card.label;
      container.appendChild(cardEl);
    });
  }

  function renderBlackjack() {
    const playerScore = calculateScore(blackjack.player);
    const dealerVisible = blackjack.playing ? [blackjack.dealer[0]].filter(Boolean) : blackjack.dealer;
    const dealerScore = blackjack.playing ? calculateScore(dealerVisible) : calculateScore(blackjack.dealer);

    blackjackEls.status.textContent = blackjack.message;
    blackjackEls.playerScore.textContent = blackjack.player.length ? scoreLabel(playerScore) : "";
    blackjackEls.dealerScore.textContent = blackjack.dealer.length ? scoreLabel(dealerScore) : "";
    blackjackEls.hit.disabled = !blackjack.playing;
    blackjackEls.stand.disabled = !blackjack.playing;
    renderCards(blackjack.playerCards, blackjack.player, false);
    renderCards(blackjack.dealerCards, blackjack.dealer, blackjack.playing);
  }

  function endBlackjack() {
    let dealerScore = calculateScore(blackjack.dealer);
    while (dealerScore !== 0 && dealerScore < 17) {
      blackjack.dealer.push(dealCard());
      dealerScore = calculateScore(blackjack.dealer);
    }

    blackjack.playing = false;
    blackjack.message = compareBlackjack(calculateScore(blackjack.player), dealerScore);
    renderBlackjack();
  }

  blackjackEls.deal.addEventListener("click", () => {
    blackjack.player = [dealCard(), dealCard()];
    blackjack.dealer = [dealCard(), dealCard()];
    blackjack.playing = true;
    blackjack.message = "In play";
    if (calculateScore(blackjack.player) === 0 || calculateScore(blackjack.dealer) === 0) {
      endBlackjack();
    } else {
      renderBlackjack();
    }
  });

  blackjackEls.hit.addEventListener("click", () => {
    blackjack.player.push(dealCard());
    const playerScore = calculateScore(blackjack.player);
    if (playerScore === 0 || playerScore > 21) {
      endBlackjack();
    } else {
      renderBlackjack();
    }
  });

  blackjackEls.stand.addEventListener("click", endBlackjack);
  renderBlackjack();

  const morseDict = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    1: ".----",
    2: "..---",
    3: "...--",
    4: "....-",
    5: ".....",
    6: "-....",
    7: "--...",
    8: "---..",
    9: "----.",
    0: "-----",
  };

  const morseEls = {
    input: byId("morse-input"),
    output: byId("morse-output"),
    convert: byId("morse-convert"),
    copy: byId("morse-copy"),
  };

  function convertMorse() {
    const encoded = Array.from(morseEls.input.value.toUpperCase()).map((char) => {
      if (char === " " || char === "\n" || char === "\t") return "/";
      return morseDict[char] || "[?]";
    });
    morseEls.output.value = encoded.join(" ");
  }

  morseEls.convert.addEventListener("click", convertMorse);
  morseEls.input.addEventListener("input", convertMorse);
  morseEls.copy.addEventListener("click", () => {
    morseEls.output.select();
    navigator.clipboard?.writeText(morseEls.output.value).catch(() => {});
  });
  convertMorse();

  const pongCanvas = byId("pong-canvas");
  const pongCtx = pongCanvas.getContext("2d");
  const pongEls = {
    status: byId("pong-status"),
    toggle: byId("pong-toggle"),
    reset: byId("pong-reset"),
  };

  const pong = {
    leftY: 250,
    rightY: 250,
    leftScore: 0,
    rightScore: 0,
    paused: false,
    keys: {},
    ball: {
      x: 400,
      y: 300,
      vx: 3.5,
      vy: 3.5,
      speed: 1,
      angle: 0,
      color: "#ffffff",
    },
  };

  const pongColors = ["#ffffff", "#54d6cf", "#d86752", "#e9ad3f", "#b9ded2", "#c688e5"];

  function resetPongBall(direction = choice([-1, 1])) {
    pong.ball.x = 400;
    pong.ball.y = 300;
    pong.ball.vx = 3.5 * direction;
    pong.ball.vy = 3.5 * choice([-1, 1]);
    pong.ball.speed = 1;
    pong.ball.color = "#ffffff";
  }

  function resetPong() {
    pong.leftY = 250;
    pong.rightY = 250;
    pong.leftScore = 0;
    pong.rightScore = 0;
    pong.paused = false;
    resetPongBall();
    drawPong();
  }

  function drawPong() {
    if (!pongCtx) return;

    pongCtx.clearRect(0, 0, 800, 600);
    pongCtx.fillStyle = "#111111";
    pongCtx.fillRect(0, 0, 800, 600);

    pongCtx.strokeStyle = "rgba(255,255,255,0.35)";
    pongCtx.setLineDash([12, 14]);
    pongCtx.beginPath();
    pongCtx.moveTo(400, 0);
    pongCtx.lineTo(400, 600);
    pongCtx.stroke();
    pongCtx.setLineDash([]);

    pongCtx.fillStyle = "#ffffff";
    pongCtx.fillRect(40, pong.leftY, 18, 100);
    pongCtx.fillRect(742, pong.rightY, 18, 100);

    pongCtx.font = "72px Courier New, monospace";
    pongCtx.textAlign = "center";
    pongCtx.fillText(String(pong.leftScore), 300, 86);
    pongCtx.fillText(String(pong.rightScore), 500, 86);

    pongCtx.save();
    pongCtx.translate(pong.ball.x, pong.ball.y);
    pongCtx.rotate(pong.ball.angle);
    pongCtx.fillStyle = pong.ball.color;
    pongCtx.beginPath();
    pongCtx.moveTo(14, 0);
    pongCtx.lineTo(-10, -12);
    pongCtx.lineTo(-10, 12);
    pongCtx.closePath();
    pongCtx.fill();
    pongCtx.restore();

    if (pong.paused) {
      pongCtx.fillStyle = "rgba(0,0,0,0.48)";
      pongCtx.fillRect(0, 0, 800, 600);
      pongCtx.fillStyle = "#ffffff";
      pongCtx.font = "34px Courier New, monospace";
      pongCtx.fillText("PAUSED", 400, 310);
    }

    pongEls.status.textContent = `${pong.leftScore} : ${pong.rightScore}`;
    pongEls.toggle.textContent = pong.paused ? "Resume" : "Pause";
  }

  function updatePong(delta) {
    if (state.activePanel !== "pong" || pong.paused) return;

    const paddleSpeed = 6 * delta;
    if (pong.keys.w) pong.leftY -= paddleSpeed;
    if (pong.keys.s) pong.leftY += paddleSpeed;
    if (pong.keys.ArrowUp) pong.rightY -= paddleSpeed;
    if (pong.keys.ArrowDown) pong.rightY += paddleSpeed;
    pong.leftY = clamp(pong.leftY, 0, 500);
    pong.rightY = clamp(pong.rightY, 0, 500);

    const ball = pong.ball;
    ball.x += ball.vx * ball.speed * delta;
    ball.y += ball.vy * ball.speed * delta;
    ball.angle += 0.11 * delta;

    if (ball.y < 14 || ball.y > 586) {
      ball.vy *= -1;
      ball.color = choice(pongColors);
    }

    const hitsLeft = ball.vx < 0 && ball.x < 70 && ball.x > 40 && ball.y > pong.leftY - 12 && ball.y < pong.leftY + 112;
    const hitsRight = ball.vx > 0 && ball.x > 730 && ball.x < 760 && ball.y > pong.rightY - 12 && ball.y < pong.rightY + 112;
    if (hitsLeft || hitsRight) {
      ball.vx *= -1;
      ball.speed = Math.min(ball.speed * 1.08, 2.2);
      ball.color = choice(pongColors);
    }

    if (ball.x > 820) {
      pong.leftScore += 1;
      resetPongBall(-1);
    } else if (ball.x < -20) {
      pong.rightScore += 1;
      resetPongBall(1);
    }
  }

  pongEls.toggle.addEventListener("click", () => {
    pong.paused = !pong.paused;
    drawPong();
  });
  pongEls.reset.addEventListener("click", resetPong);

  document.querySelectorAll("[data-pong]").forEach((button) => {
    const map = {
      "left-up": "w",
      "left-down": "s",
      "right-up": "ArrowUp",
      "right-down": "ArrowDown",
    };
    const key = map[button.dataset.pong];
    const start = () => {
      pong.keys[key] = true;
    };
    const stop = () => {
      pong.keys[key] = false;
    };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  });

  const turtleCanvas = byId("turtle-canvas");
  const turtleCtx = turtleCanvas.getContext("2d");
  const turtleEls = {
    status: byId("turtle-status"),
    pause: byId("turtle-pause"),
  };

  const carTypes = [
    { width: 54, height: 28, speed: 1.4, colors: ["#d86752", "#172025"] },
    { width: 78, height: 34, speed: 1, colors: ["#3778bf", "#1f6f68", "#55416f"] },
    { width: 112, height: 40, speed: 0.6, colors: ["#e9ad3f", "#88847e", "#c96f3d"] },
  ];
  const lanes = [78, 123, 168, 213, 258, 303, 348, 393, 438, 483, 528];

  const turtle = {
    mode: "menu",
    difficulty: 1,
    level: 1,
    lives: 3,
    carSpeed: 5,
    spawnRate: 7,
    cars: [],
    player: { x: 300, y: 568, invulnerable: 0 },
    paused: false,
    shake: 0,
    flash: 0,
  };

  function resetTurtlePlayer() {
    turtle.player.x = 300;
    turtle.player.y = 568;
  }

  function startTurtle(difficulty) {
    turtle.mode = "running";
    turtle.difficulty = difficulty;
    turtle.level = 1;
    turtle.lives = 3;
    turtle.carSpeed = 5 * difficulty;
    turtle.spawnRate = Math.max(3, 7 - difficulty);
    turtle.cars = [];
    turtle.paused = false;
    turtle.player.invulnerable = 0;
    resetTurtlePlayer();
    drawTurtle();
  }

  function moveTurtle(direction) {
    if (turtle.mode !== "running" || turtle.paused) return;
    const distance = 10;
    if (direction === "up") turtle.player.y -= distance;
    if (direction === "down") turtle.player.y += distance;
    if (direction === "left") turtle.player.x -= distance;
    if (direction === "right") turtle.player.x += distance;
    turtle.player.x = clamp(turtle.player.x, 20, 580);
    turtle.player.y = clamp(turtle.player.y, 30, 575);
  }

  function spawnTurtleCar(delta) {
    const chance = (0.014 + turtle.difficulty * 0.006) * delta * (8 / turtle.spawnRate);
    if (Math.random() > chance) return;

    const roll = Math.random();
    const type = roll < 0.2 ? carTypes[0] : roll < 0.7 ? carTypes[1] : carTypes[2];
    turtle.cars.push({
      x: 650,
      y: choice(lanes),
      width: type.width,
      height: type.height,
      speed: type.speed,
      color: choice(type.colors),
    });
  }

  function turtleCollision(car) {
    if (turtle.player.invulnerable > 0) return false;
    const halfPlayer = 12;
    return (
      Math.abs(car.x - turtle.player.x) < car.width / 2 + halfPlayer &&
      Math.abs(car.y - turtle.player.y) < car.height / 2 + halfPlayer
    );
  }

  function updateTurtle(delta) {
    if (state.activePanel !== "turtle" || turtle.mode !== "running" || turtle.paused) return;

    if (turtle.player.invulnerable > 0) {
      turtle.player.invulnerable -= delta;
    }
    if (turtle.shake > 0) turtle.shake -= delta;
    if (turtle.flash > 0) turtle.flash -= delta;

    spawnTurtleCar(delta);
    turtle.cars.forEach((car) => {
      car.x -= turtle.carSpeed * car.speed * delta;
    });
    turtle.cars = turtle.cars.filter((car) => car.x > -90);

    if (turtle.cars.some(turtleCollision)) {
      turtle.lives -= 1;
      turtle.player.invulnerable = 120;
      turtle.shake = 18;
      if (turtle.lives <= 0) {
        turtle.mode = "over";
      } else {
        resetTurtlePlayer();
      }
    }

    if (turtle.player.y <= 42) {
      turtle.level += 1;
      turtle.carSpeed += 1.5;
      turtle.spawnRate = Math.max(2, turtle.spawnRate - 1);
      if ((turtle.level - 1) % 3 === 0) {
        turtle.flash = 120;
      }
      resetTurtlePlayer();
    }
  }

  function drawCar(ctx, car) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.fillStyle = car.color;
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillRect(-car.width / 5, -car.height / 2 + 5, car.width / 3, car.height - 10);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(-car.width / 2 + 8, car.height / 2 - 4, 14, 6);
    ctx.fillRect(car.width / 2 - 22, car.height / 2 - 4, 14, 6);
    ctx.restore();
  }

  function drawTurtlePlayer(ctx) {
    const blink = turtle.player.invulnerable > 0 && Math.floor(turtle.player.invulnerable / 8) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(turtle.player.x, turtle.player.y);
    ctx.fillStyle = turtle.player.invulnerable > 0 ? "#d86752" : "#172025";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-15, -5, 6, 10);
    ctx.fillRect(9, -5, 6, 10);
    ctx.restore();
  }

  function drawTurtle() {
    if (!turtleCtx) return;

    const ctx = turtleCtx;
    const shakeX = turtle.shake > 0 ? (Math.random() - 0.5) * 7 : 0;
    const shakeY = turtle.shake > 0 ? (Math.random() - 0.5) * 7 : 0;

    ctx.clearRect(0, 0, 600, 600);
    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = turtle.flash > 0 ? "#5d6464" : "#76806a";
    ctx.fillRect(0, 0, 600, 50);
    ctx.fillRect(0, 550, 600, 50);
    ctx.fillStyle = "#777a7a";
    ctx.fillRect(0, 50, 600, 500);

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 4;
    ctx.setLineDash([25, 16]);
    lanes.slice(1, -1).forEach((lane) => {
      ctx.beginPath();
      ctx.moveTo(0, lane - 22);
      ctx.lineTo(600, lane - 22);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    turtle.cars.forEach((car) => drawCar(ctx, car));
    drawTurtlePlayer(ctx);
    ctx.restore();

    ctx.fillStyle = "#172025";
    ctx.font = "22px Courier New, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Level: ${turtle.level}`, 18, 33);
    ctx.textAlign = "right";
    ctx.fillText(`Lives: ${turtle.lives}`, 582, 33);

    if (turtle.mode === "menu") {
      drawTurtleOverlay("SELECT DIFFICULTY", "Easy   Medium   Hard");
    }
    if (turtle.paused && turtle.mode === "running") {
      drawTurtleOverlay("PAUSED", "Resume when ready");
    }
    if (turtle.mode === "over") {
      drawTurtleOverlay("GAME OVER", `Final level: ${turtle.level}`);
    }

    turtleEls.status.textContent = turtle.mode === "over" ? `Final ${turtle.level}` : `Level ${turtle.level}`;
    turtleEls.pause.textContent = turtle.paused ? "Resume" : "Pause";
  }

  function drawTurtleOverlay(title, subtitle) {
    turtleCtx.fillStyle = "rgba(247,244,238,0.86)";
    turtleCtx.fillRect(80, 210, 440, 154);
    turtleCtx.strokeStyle = "rgba(23,32,37,0.18)";
    turtleCtx.strokeRect(80, 210, 440, 154);
    turtleCtx.fillStyle = "#172025";
    turtleCtx.textAlign = "center";
    turtleCtx.font = "30px Courier New, monospace";
    turtleCtx.fillText(title, 300, 275);
    turtleCtx.font = "18px Courier New, monospace";
    turtleCtx.fillText(subtitle, 300, 320);
  }

  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.addEventListener("click", () => startTurtle(Number.parseFloat(button.dataset.difficulty)));
  });

  turtleEls.pause.addEventListener("click", () => {
    if (turtle.mode !== "running") return;
    turtle.paused = !turtle.paused;
    drawTurtle();
  });

  document.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => moveTurtle(button.dataset.move));
  });

  window.addEventListener("keydown", (event) => {
    if (state.activePanel === "pong") {
      if (["w", "s", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        pong.keys[event.key] = true;
      }
    }

    if (state.activePanel === "turtle") {
      const moves = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      if (moves[event.key]) {
        event.preventDefault();
        moveTurtle(moves[event.key]);
      }
      if (event.key.toLowerCase() === "p" && turtle.mode === "running") {
        turtle.paused = !turtle.paused;
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    if (["w", "s", "ArrowUp", "ArrowDown"].includes(event.key)) {
      pong.keys[event.key] = false;
    }
  });

  let previousTime = performance.now();
  function frame(now) {
    const delta = clamp((now - previousTime) / 16.67, 0.25, 2.5);
    previousTime = now;
    updatePong(delta);
    updateTurtle(delta);
    drawPong();
    drawTurtle();
    window.requestAnimationFrame(frame);
  }

  state.gamesReady = true;
  resetPong();
  drawTurtle();
  window.requestAnimationFrame(frame);
})();

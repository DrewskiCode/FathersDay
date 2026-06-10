import { gameAudio } from "./audio/sound";
import { COLORS } from "./colors";
import {
  ComputerStateManager,
  isFireState,
  specialKindFromState,
} from "./entities/computerState";
import { OfficeWorkerManager } from "./entities/officeWorkers";
import { Player } from "./entities/player";
import { ExtinguisherAmmo, isNearWallExtinguisher } from "./extinguisherAmmo";
import { FIRE_PIXEL, PixelFire } from "./fire";
import type { Input } from "./input";
import { CENTER_SPAWN } from "./rooms/center";
import { getRoomInteractives } from "./rooms/interactives";
import { drawRoom } from "./rooms/render";
import { RoomState } from "./rooms/state";
import { ComboState } from "./systems/combo";
import { CollectiblesManager } from "./systems/collectibles";
import { FireSpawnSystem } from "./systems/fireSpawn";
import { PowerUpState } from "./systems/powerUps";
import { ScoreManager } from "./systems/score";
import { getUnlockedRooms, wingUnlockMessage } from "./systems/rounds";
import { loadSettings, saveSettings, type GameSettings } from "./systems/settings";
import { findSprayTarget } from "./systems/sprayTarget";
import { drawGameplayHud } from "./ui/hud";
import {
  GameOverSequence,
  hitTestGameOverButton,
  loadHighScore,
  type GameOverButtonId,
} from "./ui/gameOverExterior";
import {
  drawPauseMenu,
  hitTestPauseButton,
  type PauseButtonId,
} from "./ui/pauseMenu";
import {
  drawSettingsPanel,
  hitTestSettings,
  resolveSettingsClick,
  type SettingsHit,
} from "./ui/settingsPanel";
import {
  drawTitleButtons,
  drawTitleSettingsGear,
  hitTestTitleButton,
  hitTestTitleSettingsGear,
  type TitleButtonId,
} from "./ui/titleScreen";
import { RunIntroSequence } from "./ui/runIntro";
import {
  drawTutorialFadeOut,
  drawTutorialOverlay,
} from "./ui/tutorialOverlay";
import { TutorialWalkthrough, TUTORIAL_PRACTICE } from "./tutorial/walkthrough";
import { TUTORIAL_SPAWN } from "./rooms/tutorial";
import {
  applyRoomTransition,
  getPlayerObstacles,
  getRoomWalls,
  getSolidObstacles,
  resolvePlayerFromSolids,
  tryRoomTransition,
  type RoomId,
} from "./rooms/world";
import type { ComputerId } from "./entities/computerState";

export type GameState = "title" | "tutorial" | "intro" | "playing" | "gameover";

export class Game {
  state: GameState = "title";
  private readonly titleFire = new PixelFire(9, 14);
  private readonly player = new Player(CENTER_SPAWN);
  private readonly roomState = new RoomState();
  private readonly computers = new ComputerStateManager();
  private readonly extinguisher = new ExtinguisherAmmo();
  private readonly fireSpawn = new FireSpawnSystem();
  private readonly score = new ScoreManager();
  private readonly combo = new ComboState();
  private readonly collectibles = new CollectiblesManager();
  private readonly officeWorkers = new OfficeWorkerManager();
  private readonly powerUps = new PowerUpState();
  private currentRoom: RoomId = "center";
  private round = 1;
  private gameOver: GameOverSequence | null = null;
  private animTime = 0;
  private titleHovered: TitleButtonId | null = null;
  private readonly tutorial = new TutorialWalkthrough();
  private tutorialLastStep: TutorialWalkthrough["step"] | null = null;
  private tutorialPracticeExtinguished = false;
  private tutorialCoffeeCollected = false;
  private tutorialDoneTimer = 0;
  private tutorialExitFade = 0;
  private readonly runIntro = new RunIntroSequence();
  private gameOverHovered: GameOverButtonId | null = null;
  private settings: GameSettings = loadSettings();
  private paused = false;
  private settingsOpen = false;
  private pauseHovered: PauseButtonId | null = null;
  private settingsHovered: SettingsHit | null = null;
  private titleGearHovered = false;

  constructor(private readonly ctx: CanvasRenderingContext2D) {
    gameAudio.applySettings(this.settings);
  }

  update(input: Input, dt: number): void {
    this.animTime += dt;

    if (this.state === "title") {
      this.titleFire.update(dt);
      this.updateTitle(input);
      return;
    }

    if (this.state === "tutorial") {
      this.updateTutorial(input, dt);
      return;
    }

    if (this.state === "intro") {
      if (this.runIntro.update(dt)) {
        this.beginGameplay();
      }
      return;
    }

    if (this.state === "gameover" && this.gameOver) {
      const w = this.ctx.canvas.width;
      const h = this.ctx.canvas.height;
      this.gameOverHovered =
        this.gameOver.menuVisible() &&
        input.mouseX !== null &&
        input.mouseY !== null
          ? hitTestGameOverButton(input.mouseX, input.mouseY, w, h)
          : null;

      const choice = this.gameOver.update(dt, {
        mouseX: input.mouseX,
        mouseY: input.mouseY,
        clickX: input.clickX,
        clickY: input.clickY,
        canvasW: w,
        canvasH: h,
      });
      if (choice === "again") {
        gameAudio.unlock();
        this.startNewRun();
      } else if (choice === "menu") {
        this.state = "title";
        this.gameOver = null;
        this.gameOverHovered = null;
      }
      return;
    }

    if (this.state === "playing") {
      this.updatePlaying(input, dt);
    }
  }

  private updateTitle(input: Input): void {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    if (this.settingsOpen) {
      this.updateSettings(input, w, h);
      return;
    }

    this.titleGearHovered =
      input.mouseX !== null && input.mouseY !== null
        ? hitTestTitleSettingsGear(input.mouseX, input.mouseY, w)
        : false;

    this.titleHovered =
      input.mouseX !== null && input.mouseY !== null
        ? hitTestTitleButton(input.mouseX, input.mouseY, w, h)
        : null;

    if (input.clickX !== null && input.clickY !== null) {
      if (hitTestTitleSettingsGear(input.clickX, input.clickY, w)) {
        gameAudio.unlock();
        this.openSettings("title");
        return;
      }
      const hit = hitTestTitleButton(input.clickX, input.clickY, w, h);
      if (hit) {
        this.confirmTitleChoice(hit);
      }
    }
  }

  private openSettings(_from: "title" | "pause"): void {
    this.settingsOpen = true;
  }

  private closeSettings(): void {
    this.settingsOpen = false;
    this.settingsHovered = null;
  }

  private leaveToTitle(): void {
    this.state = "title";
    this.paused = false;
    this.closeSettings();
    this.pauseHovered = null;
    gameAudio.applySettings(this.settings);
  }

  private applySettingsAction(action: ReturnType<typeof resolveSettingsClick>): void {
    if (!action) return;

    if (action.type === "toggleMusic") {
      this.settings = { ...this.settings, musicEnabled: !this.settings.musicEnabled };
    } else if (action.type === "setMusicVolume") {
      this.settings = { ...this.settings, musicVolume: action.value };
    } else if (action.type === "setSfxVolume") {
      this.settings = { ...this.settings, sfxVolume: action.value };
    } else if (action.type === "back") {
      this.closeSettings();
      return;
    }

    saveSettings(this.settings);
    gameAudio.applySettings(this.settings);
  }

  private updateSettings(input: Input, w: number, h: number): void {
    this.settingsHovered =
      input.mouseX !== null && input.mouseY !== null
        ? hitTestSettings(input.mouseX, input.mouseY, w, h)
        : null;

    if (input.wasPressed("Escape")) {
      this.applySettingsAction({ type: "back" });
      return;
    }

    if (input.clickX !== null && input.clickY !== null) {
      this.applySettingsAction(resolveSettingsClick(input.clickX, input.clickY, w, h));
    }
  }

  private updatePauseMenu(input: Input, w: number, h: number): void {
    if (this.settingsOpen) {
      this.updateSettings(input, w, h);
      return;
    }

    if (input.wasPressed("KeyP") || input.wasPressed("Escape")) {
      this.paused = false;
      this.pauseHovered = null;
      return;
    }

    this.pauseHovered =
      input.mouseX !== null && input.mouseY !== null
        ? hitTestPauseButton(input.mouseX, input.mouseY, w, h)
        : null;

    if (input.clickX !== null && input.clickY !== null) {
      const hit = hitTestPauseButton(input.clickX, input.clickY, w, h);
      if (hit === "resume") {
        this.paused = false;
        this.pauseHovered = null;
      } else if (hit === "settings") {
        this.openSettings("pause");
      } else if (hit === "leave") {
        this.leaveToTitle();
      }
    }
  }

  private handlePauseInput(input: Input, w: number, h: number): boolean {
    if (this.settingsOpen) {
      this.updateSettings(input, w, h);
      return true;
    }

    if (this.paused) {
      this.updatePauseMenu(input, w, h);
      return true;
    }

    if (input.wasPressed("KeyP")) {
      this.paused = true;
      this.pauseHovered = null;
      return true;
    }

    return false;
  }

  private drawSettingsOverlay(w: number, h: number): void {
    drawSettingsPanel(this.ctx, w, h, this.settings, this.settingsHovered);
    this.ctx.canvas.style.cursor = this.settingsHovered ? "pointer" : "default";
  }

  private drawPauseOverlay(w: number, h: number): void {
    if (this.settingsOpen) {
      this.drawSettingsOverlay(w, h);
      return;
    }
    drawPauseMenu(this.ctx, w, h, this.pauseHovered);
    this.ctx.canvas.style.cursor = this.pauseHovered ? "pointer" : "default";
  }

  private confirmTitleChoice(choice: TitleButtonId): void {
    gameAudio.unlock();
    this.paused = false;
    this.closeSettings();
    if (choice === "play") {
      this.startNewRun();
    } else {
      this.startTutorial();
    }
  }

  private startTutorial(): void {
    this.state = "tutorial";
    this.currentRoom = "tutorial";
    this.animTime = 0;
    this.tutorialDoneTimer = 0;
    this.tutorialExitFade = 0;
    this.tutorialPracticeExtinguished = false;
    this.tutorialCoffeeCollected = false;
    this.roomState.reset();
    this.computers.reset();
    this.extinguisher.reset();
    this.score.reset();
    this.combo.reset();
    this.collectibles.resetTutorial();
    this.officeWorkers.resetTutorial(this.roomState, 1);
    this.powerUps.reset();
    this.player.x = TUTORIAL_SPAWN.x;
    this.player.y = TUTORIAL_SPAWN.y;
    this.player.facing = "up";
    this.tutorialLastStep = null;
    this.tutorial.begin(this.computers, this.extinguisher);
    this.syncTutorialStepFx();
  }

  private syncTutorialStepFx(): void {
    if (this.tutorial.step === this.tutorialLastStep) return;
    this.tutorialLastStep = this.tutorial.step;
    switch (this.tutorial.step) {
      case "extinguish":
      case "combo":
      case "purple":
      case "green":
      case "white":
      case "rainbow":
        gameAudio.ignite();
        break;
      case "coffee":
        this.collectibles.placeTutorialCoffee();
        break;
      default:
        break;
    }
  }

  private handleTutorialExtinguish(target: ComputerId | null): boolean {
    if (!target) return false;

    if (this.tutorial.step === "combo") {
      if (!isFireState(this.computers.getState(target))) return false;
      const points = this.computers.extinguish(target);
      this.scoreExtinguish(points);
      gameAudio.extinguish();
      if (this.score.lastGain > 0) {
        gameAudio.scoreGain();
      }
      this.extinguisher.spray.extinguishedTarget = true;
      return true;
    }

    if (target !== TUTORIAL_PRACTICE) return false;

    const special = specialKindFromState(this.computers.getState(target));

    if (special === "green") {
      this.computers.extinguish(target);
      this.computers.extinguishAll(["tutorial"]);
      this.powerUps.showBanner("ALL CLEAR!");
      gameAudio.powerUp();
    } else {
      this.computers.extinguish(target);
      if (special === "purple") {
        this.powerUps.activatePurple();
        gameAudio.powerUp();
      } else if (special === "white") {
        this.powerUps.activateWhite();
        gameAudio.powerUp();
      } else if (special === "rainbow") {
        gameAudio.powerUp();
      }
    }

    gameAudio.extinguish();
    this.extinguisher.spray.extinguishedTarget = true;
    return true;
  }

  private updateTutorial(input: Input, dt: number): void {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    if (this.tutorialExitFade > 0) {
      this.tutorialExitFade = Math.min(1, this.tutorialExitFade + dt / 0.9);
      if (this.tutorialExitFade >= 1) {
        this.state = "title";
        this.tutorialExitFade = 0;
        this.tutorialDoneTimer = 0;
      }
      return;
    }

    if (input.wasPressed("Escape") && this.tutorial.step !== "done" && !this.paused && !this.settingsOpen) {
      this.state = "title";
      return;
    }

    if (this.handlePauseInput(input, w, h)) return;

    const cfg = this.tutorial.config();

    if (this.tutorial.step === "done") {
      this.tutorialDoneTimer += dt;
      if (this.tutorialDoneTimer >= 4.5) {
        this.tutorialExitFade = dt / 0.9;
      }
    }

    this.updatePowerUps(dt, "tutorial", 1);
    this.score.update(dt);
    this.combo.update(dt);
    this.collectibles.update(dt);
    this.animTime += dt;
    this.tutorial.tickPromptFade(dt);
    this.tutorialPracticeExtinguished = false;

    const wasSpraying = this.extinguisher.spray.isSpraying;

    this.computers.update(dt, 1, "tutorial", () => {
      /* no game over in tutorial */
    });

    this.roomState.updateRoom("tutorial", this.player);

    const nearStation = isNearWallExtinguisher(this.player, "tutorial");

    if (cfg.allowSpray && this.extinguisher.tryStartSpray(input)) {
      gameAudio.spray();
      if (this.tutorial.step !== "npc") {
        const target = findSprayTarget(this.player, "tutorial", this.computers);
        if (this.handleTutorialExtinguish(target)) {
          this.tutorialPracticeExtinguished = true;
        }
      }
    }

    let reloaded = false;
    const onRefillStep = this.tutorial.step === "refill";
    if (cfg.allowReload || onRefillStep) {
      reloaded = this.extinguisher.update(input, dt, nearStation);
      if (reloaded) {
        gameAudio.reloadDone();
      }
    } else {
      this.extinguisher.update(input, dt, false);
    }

    const obstacles = getPlayerObstacles(
      "tutorial",
      this.roomState,
      1,
      this.powerUps.hasGhostWalls,
    );

    this.officeWorkers.update(
      dt,
      "tutorial",
      this.computers,
      this.roomState,
      1,
      this.player,
      this.extinguisher.spray.isSpraying,
    );
    if (wasSpraying && !this.extinguisher.spray.isSpraying) {
      this.officeWorkers.onSprayEnd();
    }

    const prevX = this.player.x;
    const prevY = this.player.y;

    if (cfg.allowMove && !this.extinguisher.isBusy) {
      this.player.update(input, obstacles, dt, this.collectibles.speedMultiplier);

      const pickup = this.collectibles.tryCollect(this.player, "tutorial");
      if (pickup.coinPoints > 0) {
        this.score.add(pickup.coinPoints);
        gameAudio.scoreGain();
      }
      if (pickup.gotCoffee) {
        this.tutorialCoffeeCollected = true;
        this.powerUps.showBanner("3x SPEED!");
        gameAudio.powerUp();
      }
    }

    const moveDelta =
      Math.abs(this.player.x - prevX) + Math.abs(this.player.y - prevY);

    this.tutorial.update(
      dt,
      this.player,
      this.computers,
      this.extinguisher,
      nearStation,
      moveDelta,
      this.tutorialPracticeExtinguished,
      {
        coinsCollected: this.collectibles.tutorialCoinsCollected(),
        comboStreak: this.combo.streak,
        npcKnocked: this.officeWorkers.anyFallenInRoom("tutorial"),
        coffeeCollected: this.tutorialCoffeeCollected,
      },
    );
    this.syncTutorialStepFx();
  }

  private startNewRun(): void {
    this.currentRoom = "center";
    this.round = 1;
    this.animTime = 0;
    this.gameOver = null;
    this.roomState.reset();
    this.computers.reset();
    this.extinguisher.reset();
    this.fireSpawn.reset();
    this.score.reset();
    this.combo.reset();
    this.collectibles.reset();
    this.officeWorkers.reset(this.roomState, this.round);
    this.powerUps.reset();
    this.player.x = CENTER_SPAWN.x;
    this.player.y = CENTER_SPAWN.y;
    this.player.facing = "down";
    this.runIntro.reset();
    this.state = "intro";
  }

  private beginGameplay(): void {
    this.state = "playing";
    this.fireSpawn.beginRound(
      this.round,
      this.computers,
      getUnlockedRooms(this.round),
      null,
    );
    this.collectibles.onRoundStart();
  }

  private scoreExtinguish(basePoints: number): void {
    this.combo.onExtinguish();
    this.score.add(this.combo.apply(basePoints));
  }

  private updatePowerUps(dt: number, room: RoomId, round: number): void {
    const wasGhost = this.powerUps.hasGhostWalls;
    this.powerUps.update(dt);
    this.extinguisher.setUnlimitedSpray(this.powerUps.hasUnlimitedSpray);
    if (wasGhost && !this.powerUps.hasGhostWalls) {
      resolvePlayerFromSolids(
        this.player,
        getSolidObstacles(room, this.roomState, round),
      );
    }
  }

  private handleExtinguish(target: ReturnType<typeof findSprayTarget>): void {
    if (!target) return;

    const special = specialKindFromState(this.computers.getState(target));
    const unlocked = getUnlockedRooms(this.round);

    if (special === "green") {
      const points = this.computers.extinguish(target);
      const bonus = this.computers.extinguishAll(unlocked);
      this.scoreExtinguish(points + bonus);
      this.powerUps.showBanner("ALL CLEAR!");
      gameAudio.powerUp();
    } else {
      const points = this.computers.extinguish(target);
      this.scoreExtinguish(points);
      if (special === "purple") {
        this.powerUps.activatePurple();
        gameAudio.powerUp();
      } else if (special === "white") {
        this.powerUps.activateWhite();
        gameAudio.powerUp();
      } else if (special === "rainbow") {
        gameAudio.powerUp();
      }
    }

    gameAudio.extinguish();
    if (this.score.lastGain > 0) {
      gameAudio.scoreGain();
    }
    this.extinguisher.spray.extinguishedTarget = true;
  }

  private updatePlaying(input: Input, dt: number): void {
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;

    if (this.handlePauseInput(input, w, h)) return;

    const unlocked = getUnlockedRooms(this.round);
    const wasSpraying = this.extinguisher.spray.isSpraying;

    this.score.update(dt);
    this.combo.update(dt);
    this.collectibles.update(dt);
    this.updatePowerUps(dt, this.currentRoom, this.round);

    this.computers.update(dt, this.round, this.currentRoom, () => {
      this.state = "gameover";
      this.gameOver = new GameOverSequence(this.score.value, this.round);
      this.gameOver.reset();
      gameAudio.gameOver();
    });
    if (this.state === "gameover") return;

    this.roomState.updateRoom(this.currentRoom, this.player);

    const nearStation = isNearWallExtinguisher(this.player, this.currentRoom);

    if (this.extinguisher.tryStartSpray(input)) {
      gameAudio.spray();
      const target = findSprayTarget(this.player, this.currentRoom, this.computers);
      this.handleExtinguish(target);
    }

    const reloaded = this.extinguisher.update(input, dt, nearStation);
    if (reloaded) {
      gameAudio.reloadDone();
    }

    this.fireSpawn.update(dt, this.round, this.computers, unlocked, () => {
      this.round += 1;
      this.fireSpawn.beginRound(
        this.round,
        this.computers,
        getUnlockedRooms(this.round),
        wingUnlockMessage(this.round),
      );
      this.collectibles.onRoundStart();
    });

    const obstacles = getPlayerObstacles(
      this.currentRoom,
      this.roomState,
      this.round,
      this.powerUps.hasGhostWalls,
    );

    this.officeWorkers.update(
      dt,
      this.currentRoom,
      this.computers,
      this.roomState,
      this.round,
      this.player,
      this.extinguisher.spray.isSpraying,
    );
    if (wasSpraying && !this.extinguisher.spray.isSpraying) {
      this.officeWorkers.onSprayEnd();
    }

    if (!this.extinguisher.isBusy) {
      this.player.update(input, obstacles, dt, this.collectibles.speedMultiplier);

      const pickup = this.collectibles.tryCollect(this.player, this.currentRoom);
      if (pickup.coinPoints > 0) {
        this.score.add(pickup.coinPoints);
        gameAudio.scoreGain();
      }
      if (pickup.gotCoffee) {
        this.powerUps.showBanner("3x SPEED!");
        gameAudio.powerUp();
      }

      const nextRoom = tryRoomTransition(this.currentRoom, this.player, this.round);
      if (nextRoom) {
        applyRoomTransition(this.currentRoom, nextRoom, this.player);
        this.currentRoom = nextRoom;
      }
    }
  }

  draw(): void {
    const { ctx } = this;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    if (this.state === "title") {
      ctx.fillStyle = COLORS.salmon;
      ctx.fillRect(0, 0, w, h);
      this.drawTitle(w, h);
      drawTitleButtons(ctx, w, h, this.titleHovered);
      drawTitleSettingsGear(ctx, w, this.titleGearHovered);
      if (this.settingsOpen) {
        this.drawSettingsOverlay(w, h);
      } else {
        this.ctx.canvas.style.cursor =
          this.titleHovered || this.titleGearHovered ? "pointer" : "default";
      }
      return;
    }

    this.ctx.canvas.style.cursor = "default";

    if (this.state === "tutorial") {
      const interactives = getRoomInteractives("tutorial");
      drawRoom(
        ctx,
        "tutorial",
        getRoomWalls("tutorial", this.roomState),
        interactives,
        this.roomState,
        this.player,
        this.computers,
        1,
        this.animTime,
        false,
        this.collectibles,
        this.officeWorkers,
      );
      this.player.draw(ctx, this.powerUps.hasGhostWalls);
      this.extinguisher.spray.draw(ctx, this.player);
      drawTutorialOverlay(ctx, {
        walkthrough: this.tutorial,
        prompt: this.tutorial.prompt(),
        ammo: this.extinguisher,
        score: this.score,
        combo: this.combo,
        collectibles: this.collectibles,
        animTime: this.animTime,
        nearStation: isNearWallExtinguisher(this.player, "tutorial"),
        showSprayHint: this.tutorial.config().allowSpray,
      });
      drawTutorialFadeOut(ctx, w, h, this.tutorialExitFade);
      if (this.paused || this.settingsOpen) {
        this.drawPauseOverlay(w, h);
      }
      return;
    }

    if (this.state === "gameover" && this.gameOver) {
      ctx.fillStyle = COLORS.black;
      ctx.fillRect(0, 0, w, h);
      this.gameOver.draw(ctx, w, h, this.gameOverHovered);
      this.ctx.canvas.style.cursor =
        this.gameOver.menuVisible() && this.gameOverHovered ? "pointer" : "default";
      return;
    }

    if (this.state === "intro") {
      this.runIntro.draw(ctx, w, h, () => this.drawIntroOffice());
      return;
    }

    if (this.state === "playing") {
      const interactives = getRoomInteractives(this.currentRoom);
      drawRoom(
        ctx,
        this.currentRoom,
        getRoomWalls(this.currentRoom, this.roomState),
        interactives,
        this.roomState,
        this.player,
        this.computers,
        this.round,
        this.animTime,
        this.fireSpawn.showExplorePrompt,
        this.collectibles,
        this.officeWorkers,
      );
      this.player.draw(ctx, this.powerUps.hasGhostWalls);
      this.extinguisher.spray.draw(ctx, this.player);
      drawGameplayHud(ctx, {
        round: this.round,
        score: this.score,
        ammo: this.extinguisher,
        powerUps: this.powerUps,
        combo: this.combo,
        collectibles: this.collectibles,
        nearStation: isNearWallExtinguisher(this.player, this.currentRoom),
        fireSpawn: this.fireSpawn,
        roundBannerRound:
          this.fireSpawn.roundBannerRemaining > 0 ? this.fireSpawn.roundBannerRound : null,
        currentRoom: this.currentRoom,
        animTime: this.animTime,
      });
      if (this.paused || this.settingsOpen) {
        this.drawPauseOverlay(w, h);
      }
    }
  }

  private drawIntroOffice(): void {
    const { ctx } = this;
    const interactives = getRoomInteractives("center");
    drawRoom(
      ctx,
      "center",
      getRoomWalls("center", this.roomState),
      interactives,
      this.roomState,
      this.player,
      this.computers,
      this.round,
      this.animTime,
      false,
    );
    this.player.draw(ctx, false);
  }

  private drawTitle(w: number, _h: number): void {
    const { ctx } = this;
    const cx = w / 2;
    const hi = loadHighScore();

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 18px monospace";
    ctx.fillText("PYRO PYRO", cx, 10);
    ctx.font = "10px monospace";
    ctx.globalAlpha = 0.85;
    ctx.fillText("The Office Firefighter", cx, 30);
    ctx.globalAlpha = 1;
    ctx.textBaseline = "alphabetic";

    const mon = { x: 58, y: 48, w: 204, h: 128 };
    const screen = { x: mon.x + 18, y: mon.y + 16, w: mon.w - 36, h: mon.h - 38 };
    const screenBottom = screen.y + screen.h - 8;
    const fireTop = screenBottom - this.titleFire.maxRows * FIRE_PIXEL;

    this.drawMonitor(mon, screen);

    ctx.fillStyle = COLORS.monitorScreen;
    ctx.fillRect(screen.x, screen.y, screen.w, screen.h);

    ctx.fillStyle = COLORS.bezelDark;
    ctx.fillRect(screen.x, screen.y, screen.w, 2);
    ctx.fillRect(screen.x, screen.y, 2, screen.h);
    ctx.fillStyle = COLORS.bezelLight;
    ctx.fillRect(screen.x, screen.y + screen.h - 2, screen.w, 2);
    ctx.fillRect(screen.x + screen.w - 2, screen.y, 2, screen.h);

    if (hi > 0) {
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = COLORS.fireYellow;
      ctx.fillText(`HI ${hi}`, cx, fireTop - 4);
      ctx.textBaseline = "alphabetic";
    }

    this.titleFire.draw(ctx, cx, screenBottom);
  }

  private drawMonitor(
    mon: { x: number; y: number; w: number; h: number },
    screen: { x: number; y: number; w: number; h: number },
  ): void {
    const { ctx } = this;
    const cx = mon.x + mon.w / 2;
    const neckW = 26;
    const neckH = 22;
    const baseW = 68;
    const baseH = 7;
    const footY = mon.y + mon.h;

    ctx.fillStyle = COLORS.bezelDark;
    ctx.fillRect(cx - baseW / 2, footY + neckH + 2, baseW, baseH);
    ctx.fillRect(cx - neckW / 2, footY, neckW, neckH);

    ctx.fillStyle = COLORS.bezel;
    ctx.fillRect(mon.x, mon.y, mon.w, mon.h);

    ctx.fillStyle = COLORS.bezelLight;
    ctx.fillRect(mon.x + 5, mon.y + 5, mon.w - 10, 4);
    ctx.fillRect(mon.x + 5, mon.y + 5, 4, mon.h - 10);

    ctx.fillStyle = COLORS.bezelDark;
    ctx.fillRect(mon.x + 12, mon.y + 14, mon.w - 24, mon.h - 26);

    const ledX = mon.x + mon.w - 20;
    const ledY = mon.y + mon.h - 14;
    ctx.fillStyle = COLORS.bezelDark;
    ctx.fillRect(ledX - 1, ledY - 1, 6, 6);
    ctx.fillStyle =
      Math.floor(this.titleFire.animTime * 2) % 2 === 0 ? COLORS.ledGreen : COLORS.bezelLight;
    ctx.fillRect(ledX, ledY, 4, 4);

    const ventY = mon.y + mon.h - 11;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? COLORS.bezelDark : COLORS.bezelLight;
      ctx.fillRect(mon.x + 24 + i * 8, ventY, 5, 2);
    }

    const screw = 3;
    ctx.fillStyle = COLORS.bezelLight;
    ctx.fillRect(mon.x + 8, mon.y + 8, screw, screw);
    ctx.fillRect(mon.x + mon.w - 8 - screw, mon.y + 8, screw, screw);
    ctx.fillRect(mon.x + 8, mon.y + mon.h - 8 - screw, screw, screw);
    ctx.fillRect(mon.x + mon.w - 8 - screw, mon.y + mon.h - 8 - screw, screw, screw);

    ctx.fillStyle = COLORS.bezelDark;
    ctx.fillRect(screen.x - 2, screen.y - 2, screen.w + 4, screen.h + 4);
  }
}

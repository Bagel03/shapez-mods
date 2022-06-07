import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput } from "shapez/core/modal_dialog_forms";
import { GameCore } from "shapez/game/core";
import { GameRoot } from "shapez/game/root";
import { Mod } from "shapez/mods/mod";
import { ActionHandler } from "./action";
import { initActionBeltPlanner } from "./actions/belt_path";
import { initActionBlueprint } from "./actions/blueprint";
import { initConstantSignalAction } from "./actions/constant_signal";
import { initActionDeleteBuilding } from "./actions/delete_building";
import { initActionPlaceBuilding } from "./actions/place_building";

// Do the speed stuff
let currentBuildingsPerSecond = 5;
let currentDelay = 1000 / currentBuildingsPerSecond;
let currentInterval;
let shouldAutoRedo = false;
const maxFrames = 60; // 60 Times to update (anymore we have to do more than one a frame)
let currentBuildingsPerFrame = 1;

const makeInterval = root => {
    currentInterval = setInterval(() => {
        if (shouldAutoRedo) {
            if (!root?.actionHandler) return console.log("no root");

            for (let i = 0; i < currentBuildingsPerFrame; i++) {
                root.actionHandler.redoAction();
            }
        }
    }, currentDelay);
};
class UndoRedoMod extends Mod {
    init() {
        this.modLoader.signals.gameInitialized.add(root => {
            root.actionHandler = new ActionHandler();

            // Stuff
            makeInterval(root);
        });

        this.modInterface.registerIngameKeybinding({
            id: "play-pause",
            keyCode: shapez.keyToKeyCode("P"),
            translation: "Play/Pause auto redo",
            modifiers: {
                shift: true,
            },
            handler: root => {
                shouldAutoRedo = !shouldAutoRedo;
                return shapez.STOP_PROPAGATION;
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "speed",
            keyCode: shapez.keyToKeyCode("S"),
            translation: "Change auto redo speed",
            modifiers: {
                shift: true,
            },
            /**
             *
             * @param {GameRoot} root
             */
            handler: root => {
                const element = new FormElementInput({
                    id: "speedValue",
                    label: null,
                    placeholder: "",
                    defaultValue: currentBuildingsPerSecond.toString(),
                });

                const dialog = new DialogWithForm({
                    app: root.app,
                    title: "Auto Redo Speed",
                    desc: "Buildings placed / second",
                    formElements: [element],
                    buttons: ["ok:good:enter"],
                    closeButton: false,
                });

                root.hud.parts.dialogs.internalShowDialog(dialog);

                function closeHandler() {
                    clearInterval(currentInterval);
                    currentBuildingsPerSecond = parseFloat(element.getValue());
                    currentBuildingsPerFrame = Math.max(currentBuildingsPerSecond / maxFrames, 1);
                    currentDelay = 1000 / (currentBuildingsPerSecond / currentBuildingsPerFrame);

                    console.log(
                        "NEW DELAY IS: " + currentDelay,
                        "NEW BUILDINGS / FRAME IS:" + currentBuildingsPerFrame
                    );

                    makeInterval(root);
                }
                console.log(dialog);

                dialog.buttonSignals.ok.add(() => {
                    closeHandler();
                });
                dialog.valueChosen.add(() => {
                    dialog.closeRequested.dispatch();

                    closeHandler();
                });
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "undo",
            keyCode: shapez.keyToKeyCode("Z"),
            translation: "Undo",
            modifiers: {
                ctrl: true,
            },
            handler: root => {
                root.actionHandler.undoAction();
                return shapez.STOP_PROPAGATION;
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "undo-all",
            keyCode: shapez.keyToKeyCode("Z"),
            translation: "Undo all",
            modifiers: {
                shift: true,
            },
            handler: root => {
                console.log("udoing all");
                root.actionHandler.undoAllActions();
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "redo",
            keyCode: shapez.keyToKeyCode("Y"),
            translation: "Redo",
            modifiers: {
                ctrl: true,
            },
            handler: root => {
                root.actionHandler.redoAction();
                return shapez.STOP_PROPAGATION;
            },
        });

        this.modInterface.registerIngameKeybinding({
            id: "redo-all",
            keyCode: shapez.keyToKeyCode("Y"),
            translation: "Redo all",
            modifiers: {
                shift: true,
            },
            handler: root => {
                console.log("redoing all");
                root.actionHandler.redoAllActions();
                return shapez.STOP_PROPAGATION;
            },
        });

        this.modInterface.runAfterMethod(GameCore, "initNewGame", function () {
            //@ts-ignore Remove the hub
            this.root.actionHandler.removeAllActions();
        });

        this.modInterface.runAfterMethod(GameCore, "initExistingGame", function (args) {
            // //@ts-ignore Remove the hub
            // this.root.actionHandler.removeAllActions();
            return true;
        });

        initActionPlaceBuilding(this.modInterface);
        initActionDeleteBuilding(this.modInterface);
        initActionBlueprint(this.modInterface);
        initActionBeltPlanner(this.modInterface);
        initConstantSignalAction(this.modInterface);
    }
}

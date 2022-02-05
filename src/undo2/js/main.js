import { GameCore } from "shapez/game/core";
import { Mod } from "shapez/mods/mod";
import { ActionHandler } from "./action";
import { initActionBeltPlanner } from "./actions/belt_path";
import { initActionBlueprint } from "./actions/blueprint";
import { initConstantSignalAction } from "./actions/constant_signal";
import { initActionDeleteBuilding } from "./actions/delete_building";
import { initActionPlaceBuilding } from "./actions/place_building";

  
class UndoRedoMod extends Mod {
    init() {
        this.modLoader.signals.gameInitialized.add(root => {
            root.actionHandler = new ActionHandler();
        })

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

        this.modInterface.runAfterMethod(GameCore, "initNewGame", function() {
            //@ts-ignore Remove the hub
            this.root.actionHandler.removeAllActions();
        })

        this.modInterface.runAfterMethod(GameCore, "initExistingGame", function(args) {
            //@ts-ignore Remove the hub
            this.root.actionHandler.removeAllActions();
            return true;
        })


        initActionPlaceBuilding(this.modInterface);
        initActionDeleteBuilding(this.modInterface);
        initActionBlueprint(this.modInterface);
        initActionBeltPlanner(this.modInterface);
        initConstantSignalAction(this.modInterface);
    }
}

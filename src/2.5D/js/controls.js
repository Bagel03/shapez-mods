//@ts-nocheck
import { globalConfig } from "shapez/core/config";
import { makeDiv } from "shapez/core/utils";
import { Camera } from "shapez/game/camera";
import { HUDSettingsMenu } from "shapez/game/hud/parts/settings_menu";
import { KEYCODES, KEYMAPPINGS, keyToKeyCode } from "shapez/game/key_action_mapper";
import { GameRoot } from "shapez/game/root";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";
import { PerspectiveCamera, Vector3 } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";


/**
 * 
 * @param {ModInterface} $ 
 */
export const initControls = ($) => {

    // Camera.prototype.onMouseMove = () => {};

    // const showPopUp = (root, newGame = true) => {
    //     const str = newGame ? "Welcome to Bagel03's 2.5D Mod! Press OK to start :)" : "Press OK to lock pointer"
    //     root.hud.parts.dialogs.showInfo("2.5D MOD",str ).ok.add(() => {
    //         /** @type {PointerLockControls} */ (root.THREE.controls).lock();
    //     })
    // }

    // $.replaceMethod(HUDSettingsMenu, "createElements", function(old, [parent]) {
    //     this.background = makeDiv(parent, "ingame_HUD_SettingsMenu", ["ingameDialog"]);

    //     this.menuElement = makeDiv(this.background, null, ["menuElement"]);

    //     if (this.root.gameMode.hasHub()) {
    //         this.statsElement = makeDiv(
    //             this.background,
    //             null,
    //             ["statsElement"],
    //             `
    //         <strong>${T.ingame.settingsMenu.beltsPlaced}</strong><span class="beltsPlaced"></span>
    //         <strong>${T.ingame.settingsMenu.buildingsPlaced}</strong><span class="buildingsPlaced"></span>
    //         <strong>${T.ingame.settingsMenu.playtime}</strong><span class="playtime"></span>

    //         `
    //         );
    //     }

    //     this.buttonContainer = makeDiv(this.menuElement, null, ["buttons"]);

    //     const buttons = [
    //         {
    //             id: "continue",
    //             action: () => {
    //                 this.close()
    //                 showPopUp(this.root, false)
    //             },
    //         },
    //         {
    //             id: "settings",
    //             action: () => this.goToSettings(),
    //         },
    //         {
    //             id: "menu",
    //             action: () => this.returnToMenu(),
    //         },
    //     ];

    //     for (let i = 0; i < buttons.length; ++i) {
    //         const { action, id } = buttons[i];

    //         const element = document.createElement("button");
    //         element.classList.add("styledButton");
    //         element.classList.add(id);
    //         this.buttonContainer.appendChild(element);

    //         this.trackClicks(element, action);
    //     }
    // })

    $.modLoader.signals.gameStarted.add((/** @type {GameRoot} */root) => {
        /** @type {PointerLockControls} */ 
        const controls = root.THREE.controls;
        /** @type {HTMLElement} */
        const el = root.THREE.renderer.domElement;
        el.addEventListener("mousedown", e => {
            if(!controls.isLocked) {
                controls.lock();
                e.stopPropagation();
            }
        })
    });


    

    setupKeybinds($);
}



/**
 * 
 * @param {ModInterface} $ 
 */
function setupKeybinds($) {
    $.registerIngameKeybinding({
        id: "forward",
        keyCode: keyToKeyCode("W"),
        translation: "Forward",
        /**
         * 
         * @param {GameRoot} root 
         * @returns 
         */
        handler: root =>  shapez.STOP_PROPAGATION
    })

    $.registerIngameKeybinding({
        id: "backward",
        keyCode: keyToKeyCode("S"),
        translation: "Backward",
        handler: root =>  shapez.STOP_PROPAGATION

    })

    
    $.registerIngameKeybinding({
        id: "left",
        keyCode: keyToKeyCode("A"),
        translation: "Left",
        handler: root =>  shapez.STOP_PROPAGATION

    })
    
    $.registerIngameKeybinding({
        id: "right",
        keyCode: keyToKeyCode("D"),
        translation: "Right",
        handler: root =>  shapez.STOP_PROPAGATION

    })

    $.registerIngameKeybinding({
        id: "up",
        keyCode: KEYCODES.Space,
        translation: "Up",
        handler: root =>  shapez.STOP_PROPAGATION

    })
    
    $.registerIngameKeybinding({
        id: "down",
        keyCode: KEYCODES.Ctrl,
        translation: "down",
        handler: root =>  shapez.STOP_PROPAGATION
    })
}



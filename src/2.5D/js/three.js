//@ts-nocheck
import { globalConfig } from "shapez/core/config";
import { GameCore } from "shapez/game/core";
import { THEME } from "shapez/game/theme";
import { GameTime } from "shapez/game/time/game_time";
import { ModInterface } from "shapez/mods/mod_interface";
import { MOD_SIGNALS } from "shapez/mods/mod_signals";
import * as THREE from "three";
import { Color } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { initControls } from "./controls";
import { updateCamPos } from "./camera"
import { initSystems } from "./system";
import { generateBuildingRenderingSystem } from "./rendering/buildings";
import { setupRenderingShapes } from "./rendering/shapes";
import { hexToRgb, hexToRgbColor} from "./rendering/utils"
import { setupBuildingPlacement } from "./placement";
import { setupRenderingMap } from "./rendering/map";
import { updateBeltItems } from "./rendering/belt";

/**
 * 
 * @param {ModInterface} $ 
 */
export const setupThree = ($) => {
    
    const app = $.modLoader.app;
    initSystems();

    let lastCanvas;
    $.replaceMethod(GameCore, "internalInitCanvas", function(){
        if(!lastCanvas) {
            this.root.canvas = document.createElement("canvas");
            this.root.canvas.id = "ingame_Canvas";
            this.root.gameState.getDivElement().appendChild(this.root.canvas);
            lastCanvas = this.root.canvas;
            return;
        } else {
            if (lastCanvas.parentElement) {
                lastCanvas.parentElement.removeChild(lastCanvas);
            }
            this.root.gameState.getDivElement().appendChild(lastCanvas);
            this.root.canvas = lastCanvas;
        }

        console.log("Created Canvas")
    })

    $.replaceMethod(GameCore, "resize", function(old, [w, h]) {
        this.root.gameWidth = w;
        this.root.gameHeight = h;
        if(this.root.THREE) {
            this.root.THREE.renderer.setSize( w, h  );
            this.root.THREE.camera.aspect = w/h;
            this.root.THREE.camera.updateProjectionMatrix(); 
        }
        this.root.signals.resized.dispatch(w, h);
        this.root.queue.requireRedraw = true;
    })

    $.runAfterMethod(GameCore, "initializeRoot", function(parentState, savegame, gameModeId) {
        const dist = 100;

        // this.root = new GameRoot(this.app);
        const canvas = this.root.canvas;
        const ROOTTHREE = {
            camera: new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, globalConfig.halfTileSize * dist),
            scene: new THREE.Scene(),
            renderer: new THREE.WebGLRenderer({canvas}),
            loader: new GLTFLoader(),
            meshes: /** @type {Map<string, THREE.Mesh>} */ (new Map()),
        }

        // this.root.canvas = ROOTTHREE.renderer.domElement;
        // parentState.getDivElement().appendChild(this.root.canvas);
    
        ROOTTHREE.renderer.setPixelRatio( window.devicePixelRatio );
        ROOTTHREE.renderer.setSize( window.innerWidth, window.innerHeight );

        ROOTTHREE.scene.background = hexToRgbColor(shapez.THEME.map.background);

    
        ROOTTHREE.controls = new PointerLockControls(ROOTTHREE.camera, ROOTTHREE.renderer.domElement);
        ROOTTHREE.controls.addEventListener("unlock", () => {
            this.root.hud.parts.settingsMenu.show();
        })

        const gridColor = THEME.map.grid.startsWith("#") ? hexToRgbColor(THEME.map.grid) : new Color(THEME.map.grid);

        ROOTTHREE.grid = new THREE.GridHelper(dist * globalConfig.tileSize, dist, gridColor, gridColor );
        ROOTTHREE.scene.add(ROOTTHREE.grid);

        this.root.THREE = ROOTTHREE;

        return;
    })
    

    initControls($);
    
    $.replaceMethod(GameCore, "draw", function(old, args) {
        const root = this.root;
        const systems = root.systemMgr.systems;

        this.root.dynamicTickrate.onFrameRendered();

        if (!this.shouldRender()) {
            // Always update hud tho
            root.hud.update();
            return;
        }

        this.root.signals.gameFrameStarted.dispatch();

        root.queue.requireRedraw = false;

        const {renderer, camera, scene} = root.THREE;
        renderer.render(scene, camera);
        root.hud.update();

    })

    $.replaceMethod(GameCore, "tick", function(old, [dt]) {
        const root = this.root;

        // Extract current real time
        root.time.updateRealtimeNow();

        // Camera is always updated, no matter what
        updateCamPos(root, dt);
        updateBeltItems(root);

        if (!(globalConfig.debug.manualTickOnly)) {
            // Perform logic ticks
            this.root.time.performTicks(dt, this.boundInternalTick);

            // Update analytics
            root.productionAnalytics.update();

            // Check achievements
            root.achievementProxy.update();
        }

        // Update automatic save after everything finished
        root.automaticSave.update();

        return true;
    })

    $.registerGameSystem({
        id: "buildingMeshes",
        systemClass: generateBuildingRenderingSystem(),
        before: "staticMapEntities"
    })

    setupRenderingShapes();

    setupBuildingPlacement($);

    setupRenderingMap($);
}
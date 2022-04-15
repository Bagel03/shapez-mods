import { globalConfig } from "shapez/core/config";
import { Vector } from "shapez/core/vector";
import { Camera, enumMouseButton } from "shapez/game/camera";
import { HUDBuildingPlacerLogic } from "shapez/game/hud/parts/building_placer_logic";
import { GameRoot } from "shapez/game/root";
import { ModInterface } from "shapez/mods/mod_interface";
import { SOUNDS } from "shapez/platform/sound";
import { Raycaster, Vector2, Vector3 } from "three";

/**
 * 
 * @param {ModInterface} $ 
 */
export const setupBuildingPlacement = ($) => {
    Camera.prototype.combinedSingleTouchMoveHandler = (e) => {false}
    $.modLoader.signals.gameStarted.add((/** @type {GameRoot} */ root) => {
        /** @type {HTMLElement} */
        //@ts-ignore
        const el = root.THREE.renderer.domElement;
        const getPos = () => {
            //@ts-ignore
            const dir = new Vector3(0, 0, -1).applyEuler(root.THREE.camera.rotation);

            const maxDist = 8 * globalConfig.tileSize;
            //@ts-ignore
            const ray = new Raycaster(root.THREE.camera.position, dir, 0, maxDist);
            //@ts-ignore
            const intersections = ray.intersectObjects(root.THREE.scene.children);
            if(intersections.length === 0) {
                return;
            };
            
            const intersection = intersections[0]; // We only care about the first
            const point = intersection.point.sub(dir.multiplyScalar(0.1)); // Move back a bit as we are gonna floor

            const floor = {
                x: Math.floor(point.x / globalConfig.tileSize) ,
                y: Math.floor(point.z / globalConfig.tileSize) ,
            }

            return new Vector(floor.x, floor.y);
        }
        let dragging = false;
        let currentEvent = {
            deleting: false
        }

        const update = () => {
            const bpl = root.hud.parts.buildingPlacer;
            if(!currentEvent.deleting) {
                if(bpl.currentMetaBuilding.get()) {
                    const pos = getPos();
                    if(!pos) return console.log("no place")
                    console.log("placing at", pos.x,  pos.y)
                    // bpl.lastDragTile = pos;
                    // bpl.currentlyDragging = true;
                    // bpl.currentlyDeleting = false;

                    bpl.tryPlaceCurrentBuildingAt(pos);
                }
            } else {
                if(bpl.currentMetaBuilding) {
                    bpl.currentMetaBuilding = null;
                    // bpl.abortDragging();
                } else {
                    const contents = root.map.getTileContent(getPos(), root.currentLayer);
                    if (contents) {
                        if (root.logic.tryDeleteBuilding(contents)) {
                            root.soundProxy.playUi(SOUNDS.destroyBuilding);
                        }
                    }
                }

            } 
        }

        root.THREE.renderer.domElement.addEventListener("mousedown", (e) => {
            dragging = true;
            //@ts-ignore
            if(!root.THREE.controls.isLocked) return;
            currentEvent.deleting = (e.button === 2);
            update()

            // root.hud.parts.buildingPlacer.onMouseDown(getPos(), [enumMouseButton.left, enumMouseButton.middle, enumMouseButton.right][e.button])
        })

        root.THREE.controls.addEventListener("change", () => {
            if(!root.THREE.controls.isLocked) return;
            // if(dragging) update();
            // root.hud.parts.buildingPlacer.onMouseMove(getPos());
        })


        root.THREE.renderer.domElement. addEventListener("mouseup", () => {
            //@ts-ignore
            if(!root.THREE.controls.isLocked) return;
            dragging = false;
            root.hud.parts.buildingPlacer.onMouseUp();
        })

        root.THREE.controls.addEventListener("unlock", () => {
            // root.hud.parts.buildingPlacer.onMouseUp();
        })
    })
}
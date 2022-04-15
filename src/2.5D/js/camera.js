//@ts-nocheck

import { globalConfig } from "shapez/core/config";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { GameRoot } from "shapez/game/root";
import { Vector3 } from "three";
import { updateMap } from "./rendering/map";

/**
 * 
 * @param {GameRoot} root 
 */
 function updateKeyboardForce (root) {
    const keyboardForce = new Vector3();

    const actionMapper = root.keyMapper;

    if(actionMapper.getBindingById("forward").pressed) keyboardForce.z -= 1;
    if(actionMapper.getBindingById("backward").pressed) keyboardForce.z += 1;
    if(actionMapper.getBindingById("left").pressed) keyboardForce.x -= 1;
    if(actionMapper.getBindingById("right").pressed) keyboardForce.x += 1;

    if(actionMapper.getBindingById("up").pressed) keyboardForce.y += 1;
    if(actionMapper.getBindingById("down").pressed) keyboardForce.y -= 1;
    return keyboardForce;

}

/**
 * 
 * @param {GameRoot} root 
 */
function centerGrid(root) {
    root.THREE.grid.position.set(
        Math.floor(root.THREE.camera.position.x / globalConfig.tileSize) * globalConfig.tileSize,
        0,
        Math.floor(root.THREE.camera.position.z / globalConfig.tileSize) * globalConfig.tileSize,
    ) 
}


const baseSpeed = globalConfig.tileSize / 80;
const fastSpeed = baseSpeed * 4;
let updateTimeBucket = 0;
/**
 * 
 * @param {GameRoot} root 
 */
export const updateCamPos = (root, dt) => {
    dt = Math.min(dt, 33);
    updateTimeBucket += dt;

    // Simulate movement of N FPS
    const updatesPerFrame = 4;
    const physicsStepSizeMs = 1000.0 / (60.0 * updatesPerFrame);
    let now = root.time.systemNow() - 3 * physicsStepSizeMs;

    while (updateTimeBucket > physicsStepSizeMs) {
        now += physicsStepSizeMs;
        updateTimeBucket -= physicsStepSizeMs;

        const keyboardForce = updateKeyboardForce(root);
        const camera = root.THREE.camera;
        const speed = root.keyMapper.getBinding(KEYMAPPINGS.navigation.mapMoveFaster).pressed ? fastSpeed :baseSpeed;
        camera.position.add(keyboardForce.clone().applyEuler(camera.rotation).multiplyScalar(speed))
    }

    centerGrid(root);
    updateMap(root)
}
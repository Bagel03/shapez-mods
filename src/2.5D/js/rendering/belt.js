import { globalConfig } from "shapez/core/config";
import { Vector } from "shapez/core/vector";
import { BaseItem } from "shapez/game/base_item";
import { BeltPath } from "shapez/game/belt_path";
import { GameRoot } from "shapez/game/root";
import { ModInterface } from "shapez/mods/mod_interface";
import { Mesh } from "three";

/**
 * 
 * @param {ModInterface} $ 
 */
export const setupBeltRendering = ($) => {

}

/** @type {{[index: string]: Mesh[]}} */
let oldMeshs = {};
/** @type {{[index: string]: Mesh[]}} */
let newMeshs = {};
/**
 * 
 * @param {GameRoot} root 
 */
export const updateBeltItems = (root) => {


    root.systemMgr.systems.belt.beltPaths.forEach(path => {
        if (path.items.length === 0) {
            // Early out
            return;
        }


        let currentItemPos = path.spacingToFirstItem;
        let currentItemIndex = 0;

        let trackPos = 0.0;

        // Iterate whole track and check items
        for (let i = 0; i < path.entityPath.length; ++i) {
            const entity = path.entityPath[i];
            const beltComp = entity.components.Belt;
            const beltLength = beltComp.getEffectiveLengthTiles();

            // Check if the current items are on the belt
            while (trackPos + beltLength >= currentItemPos - 1e-5) {
                // It's on the belt, render it now
                const staticComp = entity.components.StaticMapEntity;
                assert(
                    currentItemPos - trackPos >= 0,
                    "invalid track pos: " + currentItemPos + " vs " + trackPos + " (l  =" + beltLength + ")"
                );

                const localPos = beltComp.transformBeltToLocalSpace(currentItemPos - trackPos);
                const worldPos = staticComp.localTileToWorld(localPos).toWorldSpaceCenterOfTile();

                const distanceAndItem = path.items[currentItemIndex];
                // if(!distanceAndItem) continue;
                const item = distanceAndItem[1 /* item */];
                const nextItemDistance = distanceAndItem[0 /* nextDistance */];

                const key = item._type + "-" + item.getAsCopyableKey();

                let possibleMeshs = oldMeshs[key];
                if(!possibleMeshs) {
                    possibleMeshs = [];
                    oldMeshs[key] = [];
                }

                let mesh = possibleMeshs[0];
                if(mesh) {
                    // Remove it
                    oldMeshs[key].splice(0, 1);
                } else {
                    // Add it
                    mesh = item.createMesh(globalConfig.tileSize - 4);
                    root.THREE.scene.add(mesh);
                }

                // Move it
                mesh.position.set(worldPos.x, globalConfig.tileSize * 2, worldPos.y);

                // Add it
                if(!newMeshs[key]) newMeshs[key] =  [];

                newMeshs[key].push(mesh);






                // if(!item.mesh) {
                //     item.mesh = item.createMesh(globalConfig.tileSize - 4);
                //     root.THREE.scene.add(item.mesh)
                // }

                // item.mesh.position.set(worldPos.x, globalConfig.tileSize * 2, worldPos.y)

                // if (
                //     !parameters.visibleRect.containsCircle(
                //         worldPos.x,
                //         worldPos.y,
                //         globalConfig.defaultItemDiameter
                //     )
                // ) {
                    // this one isn't visible, do not  append it
                    // Start a new stack
                //     path.drawDrawStack(drawStack, parameters, drawStackProp);
                //     drawStack = [];
                //     drawStackProp = "";
                // } else {
                //     if (drawStack.length > 1) {
                //         // Check if we can append to the stack, since its already a stack of two same items
                //         const referenceItem = drawStack[0];

                //         if (
                //             referenceItem[1].equals(item) &&
                //             Math.abs(referenceItem[0][drawStackProp] - worldPos[drawStackProp]) < 0.001
                //         ) {
                //             // Will continue stack
                //         } else {
                //             // Start a new stack, since item doesn't follow in row
                //             path.drawDrawStack(drawStack, parameters, drawStackProp);
                //             drawStack = [];
                //             drawStackProp = "";
                //         }
                //     } else if (drawStack.length === 1) {
                //         const firstItem = drawStack[0];

                //         // Check if we can make it a stack
                //         if (firstItem[1 /* item */].equals(item)) {
                //             // Same item, check if it is either horizontal or vertical
                //             const startPos = firstItem[0 /* pos */];

                //             if (Math.abs(startPos.x - worldPos.x) < 0.001) {
                //                 drawStackProp = "x";
                //             } else if (Math.abs(startPos.y - worldPos.y) < 0.001) {
                //                 drawStackProp = "y";
                //             } else {
                //                 // Start a new stack
                //                 path.drawDrawStack(drawStack, parameters, drawStackProp);
                //                 drawStack = [];
                //                 drawStackProp = "";
                //             }
                //         } else {
                //             // Start a new stack, since item doesn't equal
                //             path.drawDrawStack(drawStack, parameters, drawStackProp);
                //             drawStack = [];
                //             drawStackProp = "";
                //         }
                //     } else {
                //         // First item of stack, do nothing
                //     }

                //     drawStack.push([worldPos, item]);
                // }

                // Check for the next item
                currentItemPos += nextItemDistance;
                ++currentItemIndex;

                // if (
                //     nextItemDistance > globalConfig.itemSpacingOnBelts + 0.001 ||
                //     drawStack.length > globalConfig.maxBeltShapeBundleSize
                // ) {
                //     // If next item is not directly following, abort drawing
                //     path.drawDrawStack(drawStack, parameters, drawStackProp);
                //     drawStack = [];
                //     drawStackProp = "";
                // }

                if (currentItemIndex >= path.items.length) {
                    // We rendered all items

                    // path.drawDrawStack(drawStack, parameters, drawStackProp);
                    return;
                }
            }

            trackPos += beltLength;
        }
    })

    // Remove all the oldMeshs that still exist (are no longer there)
    for(const key of Object.keys(oldMeshs)) {
        for(const meshName in oldMeshs[key]) {
            console.log("Removing")
            const mesh = oldMeshs[key][meshName];
            root.THREE.scene.remove(mesh);
            mesh.material.dispose();
            mesh.geometry.dispose();
            delete oldMeshs[key][meshName];
        }
    }

    oldMeshs = newMeshs;
    newMeshs = {};
}
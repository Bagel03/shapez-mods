import { Blueprint } from "shapez/game/blueprint";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * 
 * @param {ModInterface} $ 
 */
export const initActionBlueprint = ($) => {
    $.replaceMethod(Blueprint, "tryPlace", function(old, [root, tile]){
        root.actionHandler.startGroupAction();
        old(root, tile);
        root.actionHandler.initAction(root.actionHandler.endGroupAction());
    })
}
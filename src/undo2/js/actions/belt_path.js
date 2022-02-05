import { HUDBuildingPlacerLogic } from "shapez/game/hud/parts/building_placer_logic";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * 
 * @param {ModInterface} $ 
 */
export const initActionBeltPlanner = ($) => {
    return;
    $.replaceMethod(HUDBuildingPlacerLogic, "executeDirectionLockedPlacement", function(old){
        //@ts-ignore
        this.root.actionHandler.startGroupAction();
        old();
        //@ts-ignore
        this.root.actionHandler.initAction(this.root.actionHandler.endGroupAction());
    })
}
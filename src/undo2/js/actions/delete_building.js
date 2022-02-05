import { GameLogic } from "shapez/game/logic";
import { BaseMap } from "shapez/game/map";
import { ModInterface } from "shapez/mods/mod_interface";
import { DeleteBuildingAction } from "./building";

/**
 * 
 * @param {ModInterface} $ 
 */
export const initActionDeleteBuilding = ($) => {
    $.replaceMethod(BaseMap, "removeStaticEntity", function(old, [entity]) {
        const action = new DeleteBuildingAction(entity, this.root);
        
        //@ts-ignore
        this.root.actionHandler.initAction(action)
    })

    $.replaceMethod(GameLogic, "tryDeleteBuilding", function(old, [building]) {

        return old(building);
    })
}
import { GameLogic } from "shapez/game/logic";
import { BaseMap } from "shapez/game/map";
import { ModInterface } from "shapez/mods/mod_interface";
import { PlaceBuildingAction } from "./building";


/**
 * 
 * @param {ModInterface} $ 
 */
export const initActionPlaceBuilding = ($) => {
    $.replaceMethod(BaseMap, "placeStaticEntity", function(old, [entity]) {
        //@ts-ignore
        this.root.actionHandler.initAction(new PlaceBuildingAction(entity, this.root))
    })


    $.replaceMethod(GameLogic, "tryPlaceBuilding", function(old, [obj]){
        //@ts-ignore
        this.root.actionHandler.startGroupAction(); // Save deleting buildings and placing as one action
        const result = old(obj);
        //@ts-ignore
        const action = this.root.actionHandler.endGroupAction();
        //@ts-ignore
        this.root.actionHandler.initAction(action);
        return result;
    })
}
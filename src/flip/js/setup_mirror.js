
import { ModInterface } from "shapez/mods/mod_interface";
import { setupBuilprints } from "./mirror setup/blueprint";
import { setupMirrorableBuildingPlacerLogic } from "./mirror setup/building_placer_logic";
import { setupMirrorableGameLogic } from "./mirror setup/game_logic";
import { setupMirrorableMetaBuilding } from "./mirror setup/meta_building";
import { setupMirrorableSMEComponent } from "./mirror setup/SMEC";



/**
 * 
 * @param {ModInterface} $ 
 */
export const setupMirror = ($) => {
    setupMirrorableSMEComponent($);
    setupBuilprints($);

    setupMirrorableMetaBuilding($);
    setupMirrorableGameLogic($);
    setupMirrorableBuildingPlacerLogic($);
}



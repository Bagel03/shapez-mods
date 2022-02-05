import { Vector } from "shapez/core/vector";
import { Blueprint } from "shapez/game/blueprint";
import { HUDBlueprintPlacer } from "shapez/game/hud/parts/blueprint_placer";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { ModInterface } from "shapez/mods/mod_interface";

/**
 * 
 * @param {ModInterface} $ 
 */
export const setupBuilprints = ($) => {


    shapez.Blueprint = class extends Blueprint {
        constructor(entities) {
            super(entities);
            this.rotation = 0;
        }

        static fromUids(root, uids) {
            const newEntities = [];
    
            let averagePosition = new Vector();
    
            // First, create a copy
            for (let i = 0; i < uids.length; ++i) {
                const entity = root.entityMgr.findByUid(uids[i]);
                assert(entity, "Entity for blueprint not found:" + uids[i]);
    
                const clone = entity.clone();
                newEntities.push(clone);
    
                const pos = entity.components.StaticMapEntity.getTileSpaceBounds().getCenter();
                averagePosition.addInplace(pos);
            }
    
            averagePosition.divideScalarInplace(uids.length);
            const blueprintOrigin = averagePosition.subScalars(0.5, 0.5).floor();
    
            for (let i = 0; i < uids.length; ++i) {
                newEntities[i].components.StaticMapEntity.origin.subInplace(blueprintOrigin);
            }
    
            // Now, make sure the origin is 0,0
            return new shapez.Blueprint(newEntities);
        }

        rotateCw() {
            super.rotateCw();
            this.rotation = (this.rotation + 90) % 360;
        }

        mirror() {
            for (let i = 0; i < this.entities.length; ++i) {
                const entity = this.entities[i];
                const staticComp = entity.components.StaticMapEntity;
                
    
                //@ts-ignore
                staticComp.mirrored = !staticComp.mirrored;
                if(this.rotation % 180 === 0) {
                    staticComp.origin.x = -staticComp.origin.x;
                } else {
                    staticComp.origin.y = -staticComp.origin.y;
                }
            }
        }
    }

    //@ts-ignore
    HUDBlueprintPlacer.prototype.mirror = function() {
        if (this.currentBlueprint.get()) {
            console.log(this)
            this.currentBlueprint.get().mirror();
        }
    }

    HUDBlueprintPlacer.prototype.createBlueprintFromBuildings = function(uids) {
        if (uids.length === 0) {
            return;
        }
        this.currentBlueprint.set(shapez.Blueprint.fromUids(this.root, uids));
    }

    $.runAfterMethod(HUDBlueprintPlacer, "initialize", function(){
        //@ts-ignore
        this.root.keyMapper.getBinding(KEYMAPPINGS.mods.mirror).add(this.mirror, this);
    })

}
import { Signal } from "shapez/core/signal";
import { arrayDelete, arrayDeleteValue } from "shapez/core/utils";
import { Entity } from "shapez/game/entity";
import { GameSystemWithFilter } from "shapez/game/game_system_with_filter";

export const initSystems = () => {

    shapez.GameSystemWithFilter = class extends GameSystemWithFilter {
        constructor(root, requiredComponents) {
            super(root, requiredComponents);
    
            this.signals = {
                entityAdded: new Signal(),
                entityRemoved: new Signal()
            }
        }
    
        /**
         *
         * @param {Entity} entity
         */
        internalCheckEntityAfterComponentRemoval(entity) {
            if (this.allEntities.indexOf(entity) < 0) {
                // Entity wasn't interesting anyways
                return;
            }
    
            for (let i = 0; i < this.requiredComponentIds.length; ++i) {
                if (!entity.components[this.requiredComponentIds[i]]) {
                    // Entity is not interesting anymore
                    arrayDeleteValue(this.allEntities, entity);
                    this.signals.entityRemoved.dispatch(entity);
                    console.log("Removed entity")
                }
            }
        }
    
    
        refreshCaches() {
            // Remove all entities which are queued for destroy
            for (let i = 0; i < this.allEntities.length; ++i) {
                const entity = this.allEntities[i];
                if (entity.queuedForDestroy || entity.destroyed) {
                    this.allEntities.splice(i, 1);
                    this.signals.entityRemoved.dispatch(entity);
                    i -= 1;
                }
            }
    
            this.allEntities.sort((a, b) => a.uid - b.uid);
        }
    
    
        /**
         *
         * @param {Entity} entity
         */
        internalRegisterEntity(entity) {
            this.allEntities.push(entity);
            this.signals.entityAdded.dispatch(entity);
    
            if (this.root.gameInitialized && !this.root.bulkOperationRunning) {
                // Sort entities by uid so behaviour is predictable
                this.allEntities.sort((a, b) => a.uid - b.uid);
            }
        }
    
        /**
         *
         * @param {Entity} entity
         */
        internalPopEntityIfMatching(entity) {
            if (this.root.bulkOperationRunning) {
                // We do this in refreshCaches afterwards
                return;
            }
            const index = this.allEntities.indexOf(entity);
            if (index >= 0) {
                arrayDelete(this.allEntities, index);
                this.signals.entityRemoved.dispatch(entity);
                console.trace();
            }
        }
    }

}
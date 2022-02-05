import { Entity } from "shapez/game/entity";
import { GameRoot } from "shapez/game/root";

export class BuildingAction {
    /**
     * 
     * @param {Entity} entity 
     * @param {GameRoot} root 
     */
    constructor(entity, root) {
        this.entity = entity;
        this.root = root;
    }

    placeBuilding() {
        // Just in case
        this.entity.destroyed = false;
        this.entity.queuedForDestroy = false;
        
        const staticComp = this.entity.components.StaticMapEntity;
        const rect = staticComp.getTileSpaceBounds();
        for (let dx = 0; dx < rect.w; ++dx) {
            for (let dy = 0; dy < rect.h; ++dy) {
                const x = rect.x + dx;
                const y = rect.y + dy;
                this.root.map.getOrCreateChunkAtTile(x, y).setLayerContentFromWorldCords(x, y, this.entity, this.entity.layer);
            }
        }  
    }

    placeBuildingAndAdd() {
        this.placeBuilding();
        this.entity.registered = false;
        this.root.entityMgr.registerEntity(this.entity);
    }

    deleteBuilding() {
        const staticComp = this.entity.components.StaticMapEntity;
        const rect = staticComp.getTileSpaceBounds();
        for (let dx = 0; dx < rect.w; ++dx) {
            for (let dy = 0; dy < rect.h; ++dy) {
                const x = rect.x + dx;
                const y = rect.y + dy;
                this.root.map.getOrCreateChunkAtTile(x, y).setLayerContentFromWorldCords(x, y, null, this.entity.layer);
            }
        }
    }

    deleteBuildingAndRemove() {
        this.deleteBuilding();
        this.root.entityMgr.destroyEntity(this.entity);
        this.root.entityMgr.processDestroyList();
    }
}

export class PlaceBuildingAction extends BuildingAction {
    init() {
        super.placeBuilding();
    }

    undo() {
        super.deleteBuildingAndRemove();
    }

    redo() {
        super.placeBuildingAndAdd();
    }
}

export class DeleteBuildingAction extends BuildingAction {
    init() {
        super.deleteBuilding();
    }

    undo() {
        super.placeBuildingAndAdd();
    }

    redo() {
        super.deleteBuildingAndRemove();
    }
}
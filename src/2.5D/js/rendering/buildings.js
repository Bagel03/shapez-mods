//@ts-nocheck
import { globalConfig } from "shapez/core/config";
import { Entity } from "shapez/game/entity";
import { BoxGeometry, Color, Mesh, MeshBasicMaterial, Scene } from "three";

export const generateBuildingRenderingSystem = () => {
    return class BuildingRenderingSystem extends shapez.GameSystemWithFilter {
        constructor(root) {
            super(root, [shapez.StaticMapEntityComponent]);
    
            this.signals.entityAdded.add(ent => this.addBuilding(ent));
            this.signals.entityRemoved.add(ent => this.removeBuilding(ent));
        }


        update(){
        }
        
        /**
         * 
         * @param {Entity} building 
         */
        addBuilding(building) {
            /** @type {Scene} */
            const scene = this.root.THREE.scene;
            
            const sme = building.components.StaticMapEntity;
            const size = sme.getTileSize();
            const {tileSize, halfTileSize} = globalConfig

            const mesh = new Mesh(
                new BoxGeometry(size.x * tileSize, tileSize, size.y * tileSize),
                new MeshBasicMaterial({
                    color: new Color(sme.getSilhouetteColor())
                })
            );
            const {x, y} = building.components.StaticMapEntity.origin;

            const realSize = {
                x: building.components.StaticMapEntity.rotation % 180 === 0 ? size.x : size.y,
                y: building.components.StaticMapEntity.rotation % 180 === 0 ? size.y : size.x,
            }
            mesh.position.set(x * tileSize + realSize.x * halfTileSize, halfTileSize, y * tileSize + realSize.y * halfTileSize);

            mesh.rotateY(Math.radians(building.components.StaticMapEntity.rotation));
            building.components.StaticMapEntity.mesh = mesh;
            scene.add(mesh)
        }
    
        removeBuilding(building) {

            /** @type {Scene} */
            const scene = this.root.THREE.scene;
            scene.remove(building.components.StaticMapEntity.mesh);
        }
    }
}

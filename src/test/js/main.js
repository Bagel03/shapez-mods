//@ts-nocheck
import { HUDBuildingPlacerLogic } from "shapez/game/hud/parts/building_placer_logic";
import { KEYMAPPINGS } from "shapez/game/key_action_mapper";
import { GameRoot } from "shapez/game/root";
import { Mod } from "shapez/mods/mod";

class ModImpl extends Mod {
    init() {
        console.log("Test Mod 2 starting");
        this.modInterface.replaceMethod(HUDBuildingPlacerLogic, "tryPlaceCurrentBuildingAt", function (tile) {
            if (this.root.camera.getIsMapOverlayActive()) {
                // Dont allow placing in overview mode
                return;
            }

            /** @type {GameRoot} */
            const root = this.root;
            root.hud.parts.dialogs.showInfo("TEST 1", "Hello from test mod 1");

            const metaBuilding = this.currentMetaBuilding.get();
            const { rotation, rotationVariant } =
                metaBuilding.computeOptimalDirectionAndRotationVariantAtTile({
                    root: this.root,
                    tile,
                    rotation: this.currentBaseRotation,
                    variant: this.currentVariant.get(),
                    layer: metaBuilding.getLayer(),
                });

            const entity = this.root.logic.tryPlaceBuilding({
                origin: tile,
                rotation,
                rotationVariant,
                originalRotation: this.currentBaseRotation,
                building: this.currentMetaBuilding.get(),
                variant: this.currentVariant.get(),
            });

            if (entity) {
                // Succesfully placed, find which entity we actually placed
                this.root.signals.entityManuallyPlaced.dispatch(entity);

                // Check if we should flip the orientation (used for tunnels)
                if (
                    metaBuilding.getFlipOrientationAfterPlacement() &&
                    !this.root.keyMapper.getBinding(
                        KEYMAPPINGS.placementModifiers.placementDisableAutoOrientation
                    ).pressed
                ) {
                    this.currentBaseRotation = (180 + this.currentBaseRotation) % 360;
                }

                // Check if we should stop placement
                if (
                    !metaBuilding.getStayInPlacementMode() &&
                    !this.root.keyMapper.getBinding(KEYMAPPINGS.placementModifiers.placeMultiple).pressed &&
                    !this.root.app.settings.getAllSettings().alwaysMultiplace
                ) {
                    // Stop placement
                    this.currentMetaBuilding.set(null);
                }
                return true;
            } else {
                return false;
            }
        });
    }
}

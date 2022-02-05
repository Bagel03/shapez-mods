import { THIRDPARTY_URLS } from "shapez/core/config";
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "shapez/core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "shapez/core/utils";
import { BaseItem } from "shapez/game/base_item";
import { MetaConstantSignalBuilding } from "shapez/game/buildings/constant_signal";
import { ConstantSignalComponent } from "shapez/game/components/constant_signal";
import { HUDConstantSignalEdit } from "shapez/game/hud/parts/constant_signal_edit";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "shapez/game/items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "shapez/game/items/color_item";
import { ModInterface } from "shapez/mods/mod_interface";
import { T } from "shapez/translations";


class ConstantSignalEditAction {
    /**
     * 
     * @param {BaseItem} old 
     * @param {BaseItem} current 
     * @param {ConstantSignalComponent} component 
     */
    constructor(old, current, component) {
        this.old = old;
        this.new = current;
        this.component = component;
    }

    init() {
        this.component.signal = this.new;
    }

    undo() {
        this.component.signal = this.old;
    }

    redo() {
        this.init();
    }
}
/**
 * 
 * @param {ModInterface} $ 
 */
export const initConstantSignalAction = ($) => {
    $.replaceMethod(HUDConstantSignalEdit, "editConstantSignal", function(old, [entity, {deleteOnCancel}]) {
        if (!entity.components.ConstantSignal) {
            return;
        }

        // Ok, query, but also save the uid because it could get stale
        const uid = entity.uid;

        const signal = entity.components.ConstantSignal.signal;
        const signalValueInput = new FormElementInput({
            id: "signalValue",
            label: fillInLinkIntoTranslation(T.dialogs.editSignal.descShortKey, THIRDPARTY_URLS.shapeViewer),
            placeholder: "",
            defaultValue: signal ? signal.getAsCopyableKey() : "",
            validator: val => this.parseSignalCode(entity, val),
        });

        const items = [...Object.values(COLOR_ITEM_SINGLETONS)];

        if (entity.components.WiredPins) {
            items.unshift(BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON);
            items.push(
                this.root.shapeDefinitionMgr.getShapeItemFromShortKey(
                    this.root.gameMode.getBlueprintShapeKey()
                )
            );
        } else {
            // producer which can produce virtually anything
            const shapes = ["CuCuCuCu", "RuRuRuRu", "WuWuWuWu", "SuSuSuSu"];
            items.unshift(
                ...shapes.reverse().map(key => this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key))
            );
        }

        if (this.root.gameMode.hasHub()) {
            items.push(
                this.root.shapeDefinitionMgr.getShapeItemFromDefinition(
                    this.root.hubGoals.currentGoal.definition
                )
            );
        }
        //@ts-ignore
        if (this.root.hud.parts.pinnedShapes) {
            items.push(        //@ts-ignore
                ...this.root.hud.parts.pinnedShapes.pinnedShapes.map(key =>
                    this.root.shapeDefinitionMgr.getShapeItemFromShortKey(key)
                )
            );
        }

        const itemInput = new FormElementItemChooser({
            id: "signalItem",
            label: null,
            items,
        });

        const dialog = new DialogWithForm({
            app: this.root.app,
            title: T.dialogs.editConstantProducer.title,
            desc: T.dialogs.editSignal.descItems,
            formElements: [itemInput, signalValueInput],
            buttons: ["cancel:bad:escape", "ok:good:enter"],
            closeButton: false,
        });
        this.root.hud.parts.dialogs.internalShowDialog(dialog);

        // When confirmed, set the signal
        const closeHandler = () => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const constantComp = entityRef.components.ConstantSignal;
            if (!constantComp) {
                // no longer interesting
                return;
            }

            let newSignal;
                if (itemInput.chosenItem) {
                    newSignal = itemInput.chosenItem;
                } else {
                    newSignal = this.parseSignalCode(entity, signalValueInput.getValue());
                }
            if(!constantComp.signal) {
                constantComp.signal = newSignal;
            } else {
                //@ts-ignore
                this.root.actionHandler.initAction(new ConstantSignalEditAction(constantComp.signal, newSignal, constantComp));
            }
        };

        //@ts-ignore
        dialog.buttonSignals.ok.add(() => {
            closeHandler();
        });
        dialog.valueChosen.add(() => {
            dialog.closeRequested.dispatch();
            closeHandler();
        });

        // When cancelled, destroy the entity again
        if (deleteOnCancel) {
            //@ts-ignore
            dialog.buttonSignals.cancel.add(() => {
                if (!this.root || !this.root.entityMgr) {
                    // Game got stopped
                    return;
                }

                const entityRef = this.root.entityMgr.findByUid(uid, false);
                if (!entityRef) {
                    // outdated
                    return;
                }

                const constantComp = entityRef.components.ConstantSignal;
                if (!constantComp) {
                    // no longer interesting
                    return;
                }

                this.root.logic.tryDeleteBuilding(entityRef);
            });
        }
    })
}
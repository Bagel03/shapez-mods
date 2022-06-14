//@ts-nocheck
import { DialogWithForm } from "shapez/core/modal_dialog_elements";
import { FormElement, FormElementInput } from "shapez/core/modal_dialog_forms";
import { Mod } from "shapez/mods/mod";
import { MODS } from "shapez/mods/modloader";
import { ClientAPI } from "shapez/platform/api";
import { PlatformWrapperImplElectron } from "shapez/platform/electron/wrapper";
import { LoginState } from "shapez/states/login";
import { MainMenuState } from "shapez/states/main_menu";
import { T } from "shapez/translations";

class ModImpl extends Mod {
    init() {
        const self = this;
        this.needsToken = true;

        this.modInterface.runAfterMethod(MainMenuState, "onEnter", function() {
            if(!self.needsToken) return;
            const element = new FormElementInput({
                id: "puzzleToken",
                label: null,
                placeholder: "",
                defaultValue: self.settings.puzzleToken
            })
            
            const dialog = new DialogWithForm({
                app: this.app, 
                title: "Puzzle API token",
                desc: "Your puzzle DLC API token (NOT your Steam ticket)",
                formElements: [element],
                buttons: ["ok:good:enter"],
                closeButton: false
            })

            this.dialogs.internalShowDialog(dialog);

            dialog.buttonSignals.ok.add(() => {
                self.settings.puzzleToken = element.getValue();
                self.saveSettings();
                self.needsToken = false;
            })
        })

        this.modInterface.replaceMethod(ClientAPI, "tryLogin", function() {
            this.token = self.settings.puzzleToken;
            return Promise.resolve(true);
        })

        MODS.anyModsActive = () => false;

        this.modInterface.replaceMethod(PlatformWrapperImplElectron, "initializeDlcStatus", function() {
            this.dlcs.puzzle = true;
        })
    }
}

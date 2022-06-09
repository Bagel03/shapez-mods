//@ts-nocheck
import { Mod } from "shapez/mods/mod";
import { MODS } from "shapez/mods/modloader";
import { ModsState } from "shapez/states/mods";
import { T } from "shapez/translations";
import { MethodPatcher } from "./methodPatcher";

//@ts-ignore
//@ts-ignore
const MODS_SUPPORTED = true;

class ModImpl extends Mod {
    init() {
        console.log("MI PATCH STARTING, IF ANY MODS HAVE ALREADY STARTED THEY WILL NOT WORK ");
        this.patcher = new MethodPatcher(this.modInterface);
        window.enabledMods = this.settings.enabledMods;

        window.recompile = () => {
            this.saveSettings();
            this.patcher.recompile();
        };

        ModsState.prototype.getMainContentHTML = function () {
            if (!MODS_SUPPORTED) {
                return `
                    <div class="noModSupport">
    
                        <p>${T.mods.noModSupport}</p>
    
                        <a href="#" class="steamLink steam_2_npr" target="_blank">Get on Steam!</a>
    
    
                    </div>
                `;
            }

            if (MODS.mods.length === 0) {
                return `
    
                <div class="modsStats noMods">
                    ${T.mods.modsInfo}
    
                    <button class="styledButton browseMods">${T.mods.browseMods}</button>
                </div>
    
                `;
            }

            let modsHtml = ``;

            MODS.mods.forEach(mod => {
                modsHtml += `
                    <div class="mod" modID="${mod.metadata.id}">
                        <div class="mainInfo">
                            <span class="name">${mod.metadata.name}</span>
                            <span class="description">${mod.metadata.description}</span>
                            <a class="website" href="${mod.metadata.website}" target="_blank">${
                    T.mods.modWebsite
                }</a>
                        </div>
                        <span class="version"><strong>${T.mods.version}</strong>${mod.metadata.version}</span>
                        <span class="author"><strong>${T.mods.author}</strong>${mod.metadata.author}</span>
                        <div class="value checkbox ${enabledMods.includes(mod.metadata.id) ? "checked" : ""}">
                            <span class="knob"></span>
                        </div>
    
                    </div>
                `;
            });

            return `
                <div class="modsStats">
                    ${T.mods.modsInfo}
                </div>
    
                <div class="modsList">
                    ${modsHtml}
               </div>
            `;
        };

        ModsState.prototype.onEnter = function () {
            const steamLink = this.htmlElement.querySelector(".steamLink");
            if (steamLink) {
                this.trackClicks(steamLink, this.onSteamLinkClicked);
            }
            const openModsFolder = this.htmlElement.querySelector(".openModsFolder");
            if (openModsFolder) {
                this.trackClicks(openModsFolder, this.openModsFolder);
            }
            const browseMods = this.htmlElement.querySelector(".browseMods");
            if (browseMods) {
                this.trackClicks(browseMods, this.openBrowseMods);
            }

            const checkboxes = this.htmlElement.querySelectorAll(".checkbox");
            Array.from(checkboxes).forEach(checkbox => {
                this.trackClicks(checkbox, () => {
                    const enabled = checkbox.classList.toggle("checked");
                    const modID = checkbox.parentElement.getAttribute("modID");
                    if (enabled) enabledMods.push(modID);
                    else enabledMods.splice(enabledMods.indexOf(modID), 1);
                    recompile();
                });
            });
        };
    }
}

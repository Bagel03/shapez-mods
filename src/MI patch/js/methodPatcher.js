//@ts-nocheck

import { HUDModalDialogs } from "shapez/game/hud/parts/modal_dialogs";
import { MODS } from "shapez/mods/modloader";
import { T } from "shapez/translations";

//@ts-ignore
//@ts-ignore
window.enabledMods = ["bagel03MIpatch"];

export class MethodPatcher {
    getMethodPath(classHandle, method) {
        return `${classHandle.name}#${method}`;
    }

    constructor(modInterface) {
        this.originals = new Map(); // Map<path, func>

        this.allEffectedMethods = new Map(); // Map<mod, {class, method}[]>
        this.pathsToData = new Map(); // Map<path, {class, method}>
        this.currentEffectedMethods = new Set(); // Set<path>

        this.allOverloads = new Map(); // Map<mod, Map<path, overload>>
        this.allBefores = new Map(); // Map<mod, Map<path, func[]>>
        this.allAfters = new Map(); // Map<mod, Map<path, func[]>>

        this.currentOverloads = new Map(); // Map<path, overload>
        this.currentBefores = new Map(); // Map<path, func[]>
        this.currentAfters = new Map(); // Map<path, func[]>

        modInterface.replaceMethod = (classHandle, methodName, override) => {
            console.log(window.currentModLoading + " is replacing a method");
            return this.overload(window.currentModLoading, classHandle, methodName, override);
        };

        modInterface.runAfterMethod = (classHandle, methodName, override) => {
            return this.after(window.currentModLoading, classHandle, methodName, override);
        };
        modInterface.runBeforeMethod = (classHandle, methodName, override) => {
            return this.before(window.currentModLoading, classHandle, methodName, override);
        };

        // modInterface.modLoader.signals.modsLoaded.add(() => this.recompile());

        window.recompile = () => this.recompile();
    }

    effect(modID, classHandle, method) {
        if (this.allEffectedMethods.has(modID)) {
            this.allEffectedMethods.get(modID).push({ classHandle, method });
        } else {
            this.allEffectedMethods.set(modID, [{ classHandle, method }]);
            this.pathsToData.set(this.getMethodPath(classHandle, method), { classHandle, method });
        }
    }

    overload(modID, classHandle, method, func) {
        this.effect(modID, classHandle, method);

        const path = this.getMethodPath(classHandle, method);
        if (this.allOverloads.has(modID)) {
            this.allOverloads.get(modID).set(path, func);
        } else {
            this.allOverloads.set(modID, new Map([[path, func]]));
        }
    }

    after(modID, classHandle, method, func) {
        this.effect(modID, classHandle, method);

        const path = this.getMethodPath(classHandle, method);
        if (this.allAfters.has(modID)) {
            if (this.allAfters.get(modID).has(path)) {
                this.allAfters.get(modID).get(path).push(func);
            }
        } else {
            this.allAfters.set(modID, new Map([[path, [func]]]));
        }
    }

    before(modID, classHandle, method, func) {
        this.effect(modID, classHandle, method);

        const path = this.getMethodPath(classHandle, method);
        if (this.allBefores.has(modID)) {
            this.allBefores.get(modID).set(path, func);
        } else {
            this.allBefores.set(modID, new Map([[path, [func]]]));
        }
    }

    showModInterferenceDialog(firstModID, secondModID, methodName) {
        /** @type {HUDModalDialogs} */
        const dialogs = shapez.GLOBAL_APP.stateMgr.currentState.dialogs;
        const firstModName = MODS.mods.find(mod => mod.metadata.id === firstModID).metadata.name;
        const secondModName = MODS.mods.find(mod => mod.metadata.id === secondModID).metadata.name;
        T.dialogs.buttons.first = `Keep ${firstModName}`;
        T.dialogs.buttons.second = `Use ${secondModName}`;
        const { first, second } = dialogs.showWarning(
            "Mod Interference",
            `Both <strong>${firstModName}</strong> and <strong>${secondModName}</strong> are overriding <i>${methodName}</i>. 
            <strong>It is recommended to disable either ${firstModName} or ${secondModName}</strong>. 
            Currently, ${firstModName} is being used, which may break ${secondModName}, you can change this below`
                .replaceAll("\n", "")
                .replaceAll("\t", ""),
            ["first", "second"]
        );

        return new Promise((res, rej) => {
            first.add(() => res(false));
            second.add(() => res(true));
        });
    }

    async getCurrents() {
        // Reset all the currents
        this.currentEffectedMethods.clear();
        this.currentOverloads.clear();
        this.currentAfters.clear();
        this.currentBefores.clear();

        const alreadyOverloaded = new Map(); // Path => modID
        window.enabledMods.forEach(async modID => {
            // Overloads
            const overloads = this.allOverloads.get(modID);
            if (overloads) {
                for (const [path, func] of overloads) {
                    if (alreadyOverloaded.has(path)) {
                        console.error(
                            `Mods ${alreadyOverloaded.get(path)} and ${modID} both tried to overload ${path}`
                        );

                        const shouldSwitch = await this.showModInterferenceDialog(
                            alreadyOverloaded.get(path),
                            modID,
                            path
                        );
                        if (shouldSwitch) {
                            alreadyOverloaded.set(path, modID);

                            this.currentOverloads.set(path, func);
                            this.currentEffectedMethods.add(path);
                        }
                    } else {
                        alreadyOverloaded.set(path, modID);
                        this.currentOverloads.set(path, func);
                        this.currentEffectedMethods.add(path);
                    }
                }
            }

            // Befores
            this.allBefores.get(modID)?.forEach((funcs, path) => {
                if (this.currentBefores.has(path)) {
                    this.currentBefores.get(path).push(...funcs);
                } else {
                    this.currentBefores.set(path, funcs);
                }
                this.currentEffectedMethods.add(path);
            });

            // Befores
            this.allAfters.get(modID)?.forEach((funcs, path) => {
                if (this.currentAfters.has(path)) {
                    this.currentAfters.get(path).push(...funcs);
                } else {
                    this.currentAfters.set(path, funcs);
                }
                this.currentEffectedMethods.add(path);
            });
        });
    }

    async recompile() {
        console.groupCollapsed("Recompiling shapez...");
        await this.getCurrents();

        // Reset all the non-effected methods
        this.allEffectedMethods.forEach((data, modID) => {
            if (!window.enabledMods.includes(modID)) {
                data.forEach(({ classHandle, method }) => {
                    const path = this.getMethodPath(classHandle, method);
                    if (!this.originals.has(path)) return;

                    classHandle.prototype[method] = this.originals.get(path);
                    console.log("Reset " + path);
                });
            }
        });

        // Update all the effected methods
        this.currentEffectedMethods.forEach(path => {
            const { classHandle, method } = this.pathsToData.get(path);
            if (!this.originals.has(path)) {
                this.originals.set(path, classHandle.prototype[method]);
            }

            classHandle.prototype[method] = this.getPatchedMethod(path);
            console.log("Patched " + path);
        });
        console.groupEnd();
    }

    getPatchedMethod(methodPath) {
        const self = this;
        return function (...args) {
            if (self.currentOverloads.has(methodPath)) {
                return self.currentOverloads.get(methodPath).apply(this, args);
            }
            self.currentBefores.get(methodPath)?.forEach(func => func.apply(this, args));
            const returnValue = self.originals.get(methodPath).apply(this, args);
            self.currentAfters.get(methodPath)?.forEach(func => func.apply(this, args));
            return returnValue;
        };
    }
}

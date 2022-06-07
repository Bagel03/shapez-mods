//@ts-nocheck
import { Mod } from "shapez/mods/mod";
import { setupThree } from "./three";
import "./system";
import { GameRoot } from "shapez/game/root";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { MOD_SIGNALS } from "shapez/mods/mod_signals";
import { HUDSettingsMenu } from "shapez/game/hud/parts/settings_menu";

class Two5DMod extends Mod {
    init() {
        return;
        setupThree(this.modInterface);
    }
}

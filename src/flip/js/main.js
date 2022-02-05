import { Signal } from "shapez/core/signal";
import { Mod } from "shapez/mods/mod";
import { setupMirror } from "./setup_mirror"

const MOD_METADATA = {
    website: "bagel03.web.app",
    author: "Bagel03",
    name: "Flip buildings",
    version: "1",
    id: "bagel-building-flipper",
    description:
        "Shows how to add a new building with logic, in this case it flips/mirrors shapez from top to down",
};


  
class TestMod extends Mod {
    init() {
        setupMirror(this.modInterface);
    }
}

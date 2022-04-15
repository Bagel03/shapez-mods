import { BackgroundResourcesLoader } from "shapez/core/background_resources_loader";
import { createLogger } from "shapez/core/logging";
import { ModInterface } from "shapez/mods/mod_interface";
import { Loader } from "shapez/core/loader"
import { BoxGeometry, Color, Mesh, MeshBasicMaterial } from "three";

const logger = createLogger("3D Loader")


//@ts-ignore
Loader.getMesh = function(key) {
    return new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial({color: new Color(0, 0, 255)})
    )
}

shapez.BackgroundResourcesLoader = class extends BackgroundResourcesLoader {
    constructor(app) {
        super(app);

        this.meshesLoaded = [];
    }

    internalLoadSpritesAndSounds(sprites, sounds, atlases = [], meshes = []) {
        this.numAssetsToLoadTotal = sprites.length + sounds.length + atlases.length + meshes.length;
        this.numAssetsLoaded = 0;

        let promises = [];

        for (let i = 0; i < sounds.length; ++i) {
            if (this.soundsLoaded.indexOf(sounds[i]) >= 0) {
                // Already loaded
                continue;
            }

            this.soundsLoaded.push(sounds[i]);
            promises.push(
                this.app.sound
                    .loadSound(sounds[i])
                    .catch(err => {
                        logger.warn("Failed to load sound:", sounds[i]);
                    })
                    .then(() => {
                        this.numAssetsLoaded++;
                    })
            );
        }

        for (let i = 0; i < sprites.length; ++i) {
            if (this.spritesLoaded.indexOf(sprites[i]) >= 0) {
                // Already loaded
                continue;
            }
            this.spritesLoaded.push(sprites[i]);
            promises.push(
                Loader.preloadCSSSprite(sprites[i])
                    .catch(err => {
                        logger.warn("Failed to load css sprite:", sprites[i]);
                    })
                    .then(() => {
                        this.numAssetsLoaded++;
                    })
            );
        }

        for (let i = 0; i < atlases.length; ++i) {
            const atlas = atlases[i];
            promises.push(
                Loader.preloadAtlas(atlas)
                    .catch(err => {
                        logger.warn("Failed to load atlas:", atlas.sourceFileName);
                    })
                    .then(() => {
                        this.numAssetsLoaded++;
                    })
            );
        }

        for (let i = 0; i < meshes.length; ++i) {
            if (this.meshesLoaded.indexOf(meshes[i]) >= 0) {
                // Already loaded
                continue;
            }
            this.meshesLoaded.push(meshes[i]);
            promises.push(
                this.app.THREE.
                    .catch(err => {
                        logger.warn("Failed to load mesh:", meshes[i]);
                    })
                    .then(() => {
                        this.numAssetsLoaded++;
                    })
            );
        }


        return (
            Promise.all(promises)

                // // Remove some pressure by waiting a bit
                // .then(() => {
                //     return new Promise(resolve => {
                //         setTimeout(resolve, 200);
                //     });
                // })
                .then(() => {
                    this.numAssetsToLoadTotal = 0;
                    this.numAssetsLoaded = 0;
                })
        );
    }
}

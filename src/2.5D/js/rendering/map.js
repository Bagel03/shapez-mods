import { makeOffscreenBuffer } from "shapez/core/buffer_utils";
import { globalConfig } from "shapez/core/config";
import { DrawParameters } from "shapez/core/draw_parameters";
import { Rectangle } from "shapez/core/rectangle";
import { MapChunk } from "shapez/game/map_chunk";
import { MapChunkView } from "shapez/game/map_chunk_view";
import { GameRoot } from "shapez/game/root";
import { ModInterface } from "shapez/mods/mod_interface";
import {
    CanvasTexture,
    Color,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    PlaneGeometry,
} from "three";

const { tileSize, mapChunkSize, mapChunkWorldSize } = globalConfig;
const chunks = 2;
const tiles = chunks * mapChunkSize;
const size = tiles * tileSize;
const realChunkSize = mapChunkSize * tileSize;

/**
 *
 * @param {GameRoot} root
 * @param {MapChunkView} chunk
 * @returns
 */
const generateChunkMesh = (root, chunk) => {
    const plane = new PlaneBufferGeometry(realChunkSize, realChunkSize);
    plane.rotateX(Math.PI / 2);
    plane.rotateY(Math.PI);
    const context = document.createElement("canvas").getContext("2d", { alpha: true });
    context.canvas.width = context.canvas.height = realChunkSize;
    const chunkX = chunk.x * mapChunkWorldSize;
    const chunkY = chunk.y * mapChunkWorldSize;

    const rect = new Rectangle(
        chunk.x * globalConfig.mapChunkWorldSize,
        chunk.y * globalConfig.mapChunkWorldSize,
        globalConfig.mapChunkWorldSize,
        globalConfig.mapChunkWorldSize
    );

    const prams = new DrawParameters({
        context,
        desiredAtlasScale: "0.75",
        root,
        visibleRect: rect,
        zoomLevel: 1,
    });
    // chunk.drawBackgroundLayer(prams)
    context.translate(-chunkX, -chunkY);
    root.systemMgr.systems.mapResources.drawChunk(prams, chunk);
    context.translate(chunkX, chunkY);

    const texture = new CanvasTexture(context.canvas);
    return new Mesh(
        plane,
        new MeshBasicMaterial({
            // color: new Color(Math.random(), 0, Math.random()),
            map: texture,
            side: DoubleSide,
            transparent: true,
        })
    );
};
/**
 *
 * @param {ModInterface} $
 */
export const setupRenderingMap = $ => {
    $.modLoader.signals.gameStarted.add((/** @type {GameRoot} */ root) => {
        root.THREE.map = new Group();
        root.THREE.scene.add(root.THREE.map);
        updateMap(root);
    });
};

let lastChunks = [];
let lastPos = {};

/**
 *
 * @param {GameRoot} root
 */
export const updateMap = root => {
    const newPos = {
        x: Math.floor(root.THREE.camera.position.x / realChunkSize),
        y: Math.floor(root.THREE.camera.position.z / realChunkSize),
    };

    if (newPos.x === lastPos.x && newPos.y === lastPos.y) return;

    const newChunks = [];
    for (let i = -chunks / 2 - 1; i <= chunks / 2 + 1; i++) {
        for (let j = -chunks / 2 - 1; j <= chunks / 2 + 1; j++) {
            let str = `${newPos.x + j}:${newPos.y + i}`;
            newChunks.push(str);
            const index = lastChunks.indexOf(str);
            if (index === -1) {
                // Render the chunk
                const chunk = root.map.getChunk(newPos.x + j, newPos.y + i, true);
                const mesh = generateChunkMesh(root, chunk);
                mesh.translateX((newPos.x + j) * realChunkSize + realChunkSize / 2 + tileSize);
                mesh.translateZ((newPos.y + i) * realChunkSize + realChunkSize / 2);
                chunk.mesh = mesh;
                root.THREE.map.add(mesh);
            } else {
                // remove it from last chunks so we know which chunks to get rid of
                lastChunks.splice(index, 1);
            }
        }
    }

    // Go through last chunks and delete everything
    for (let chunkLoc of lastChunks) {
        const [strx, stry] = chunkLoc.split(":");
        const x = parseInt(strx),
            y = parseInt(stry);
        const chunk = root.map.getChunk(x, y);
        /** @type {Mesh} */
        const mesh = chunk.mesh;
        mesh.geometry.dispose();
        mesh.material.dispose();
        root.THREE.map.remove(mesh);
        delete chunk.mesh;
    }

    lastChunks = newChunks;
    lastPos = newPos;
};

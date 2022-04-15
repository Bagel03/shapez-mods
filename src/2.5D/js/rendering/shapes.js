import { enumColors } from "shapez/game/colors";
import { ShapeItem } from "shapez/game/items/shape_item";
import { enumSubShape, ShapeDefinition } from "shapez/game/shape_definition";
import { THEME } from "shapez/game/theme";
import { BufferAttribute, CanvasTexture, Color, CylinderBufferGeometry, ExtrudeBufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Shape, Vector2 } from "three"
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils"
import { hexToRgbColor } from "./utils";


export const setupRenderingShapes = () => {

    // const size = 20;
    const layerHeight = 10;
    
    // const quadrantSize = 1;
    // const quadrantHalfSize = quadrantSize / 2;



    //@ts-ignore
    ShapeDefinition.prototype.createGeometry = function(size) {
        const mult = size / 23;
        const baseStrokeSize = THEME.items.outlineWidth;
        const strokeAdd = baseStrokeSize * mult
        const baseQuadSize = 10;
        const quadrantSize = baseQuadSize * mult;
        const quadrantHalfSize = quadrantSize / 2;

        const bottomGeo = new CylinderBufferGeometry(quadrantSize * 1.15, quadrantSize * 1.15, layerHeight / 2, quadrantSize, 1).toNonIndexed();
        bottomGeo.translate(0, -layerHeight/4, 0);

        const uvsLen = bottomGeo.getAttribute("uv").array.length;
        const newUvs = [];
        for(let i = 0; i < uvsLen; i++) {
            newUvs.push(1, 0.5);
        }
        bottomGeo.deleteAttribute("uv");
        bottomGeo.setAttribute("uv", new Float32BufferAttribute(newUvs, 2));
        
        // bottomGeo.deleteAttribute("uv");

        const cirPoints = [];
        const numOfPoints = 5;

        for(let i = 0; i <= numOfPoints; i++) {
            cirPoints.push({
                x: Math.sin((i / numOfPoints) * Math.PI / 2),
                y: Math.cos((i / numOfPoints) * Math.PI / 2),
            })
        }

        const generateLayerGeo = (shapes, layerNum) => {
            const points = [];

            let rotation = 0;
            const addPoint = (x, y) => {
                let obj = {
                }        
                switch ((rotation) % 4) {
                    case 4:
                    case 0: {
                        obj = {x: x, y: y};
                        break;
                    }
                    case 1: {
                        obj = {x: y, y: x*-1};
                        break;
                    }
                    case 2: {
                        obj = {x: x*-1, y: y*-1};
                        break;
                    }
                    case 3: {
                        obj = {x: y*-1, y: x};
                        break;
                    }
                }
                points.push(obj);
                return obj;
            }

            for(let i = 0; i < 4; i++) {
                const shapeType = shapes[i];

                
                switch(shapeType) {
                    case enumSubShape.rect: {
                        const dims = quadrantSize + strokeAdd/2;
                        addPoint(0, dims);
                        addPoint(dims, dims);
                        addPoint(dims, 0)
                        break;
                    }
                    case enumSubShape.star: {
                        const dims = quadrantSize + strokeAdd/2;
    
                        let originX = -quadrantHalfSize;
                        let originY = quadrantHalfSize - dims;
    
                        const moveInwards = dims * 0.6;

                        addPoint(0, moveInwards);
                        addPoint(dims, dims);
                        addPoint(moveInwards, 0);
                        break;
                    }
    
                    case enumSubShape.windmill: {
                        const dims = quadrantSize + strokeAdd/2;
    
                        const moveInwards = dims * 0.6;
                        addPoint(0, moveInwards);
                        addPoint(dims, dims);
                        addPoint(dims, 0);
                        break;
                    }
    
                    case enumSubShape.circle: {
                        const dims = quadrantSize + strokeAdd/2;

                        for(let point of cirPoints) {
                            addPoint(point.x * dims, point.y * dims);
                        }
                        break;
                    }

                    default: 
                    // No shape, move to center
                        addPoint(0, 0);
                }
                rotation++;
            }

            const shape = new Shape();
            // shape.arcLengthDivisions = 3;
            // shape.updateArcLengths();

            shape.moveTo(points[0].x, points[0].y)

            for(let i = 1; i < points.length; i++) {
                const point = points[i];
                if(point.x === shape.currentPoint.x && point.y === shape.currentPoint.y)  {
                    // If this point is an arc
                    // if(points[i-1].isArc) {
                    //     const last = points[i-1];
                    //     const ninetyDeg = Math.PI / 2; 

                    //     shape.absarc(0, 0, quadrantSize + strokeAdd, last.rotation * ninetyDeg + ninetyDeg, last.rotation * ninetyDeg, true);
                    //     console.log("Arc: " + point.x +" "+ point.y)
                    // }
                    continue;
                };

                // If this point is an arc
                // if(points[i-1].isArc) {
                //     const last = points[i-1];
                //     const ninetyDeg = Math.PI / 2; 

                //     shape.absarc(0, 0, quadrantSize + strokeAdd, last.rotation * ninetyDeg + ninetyDeg, last.rotation * ninetyDeg, true);
                //     console.log("Arc: " + point.x +" "+ point.y)
                // }

                shape.lineTo(point.x, point.y);
            }
            // shape.lineTo(points[0].x, points[0].y)
            shape.closePath(); 

            const geo = new ExtrudeBufferGeometry(shape, {
                depth: layerHeight, 
                bevelEnabled: false,
                UVGenerator: {
                    generateSideWallUV(geo, verts, a, b, c, d) {

                        const vectors = [
                            new Vector2(0.5, 0.5),
                            new Vector2(0.5, 0.5),
                            new Vector2(0.5, 0.5),
                            new Vector2(0.5, 0.5),
                        ]
                        return vectors;
                    },
                    generateTopUV(geo, verts, a, b, c) {
                        const ax = verts[a * 3];
                        const ay = verts[a * 3 + 1];
                        const az = verts[a * 3 + 2];
                        const bx = verts[b * 3];
                        const by = verts[b * 3 + 1];
                        const bz = verts[b * 3 + 2];
                        const cx = verts[c * 3];
                        const cy = verts[c * 3 + 1];
                        const cz = verts[c * 3 + 2];

                        const layerScale = Math.max(0.1, 0.9 - layerNum * 0.22)
                        const vectors = [
                            new Vector2(ax / (size / layerScale) + 0.5,  ay / (size / layerScale)  + 0.5),
                            new Vector2(bx / (size / layerScale) + 0.5,  by / (size / layerScale)  + 0.5),
                            new Vector2(cx / (size / layerScale) + 0.5,  cy / (size / layerScale)  + 0.5),
                        ]

                        return vectors;
                    }

                    
                }
                // curveSegments: 5
            })
            geo.rotateX(-Math.PI/2);
            geo.rotateY(-Math.PI/2);
            // geo.deleteAttribute("uv");
            return geo;
        }

        const geos = [...this.layers.map((layer, i) => { 
                const layerScale = Math.max(0.1, 0.9 - i * 0.22);
                return generateLayerGeo(
                    layer.map(quad => quad ? quad.subShape : null), i
                )
                    .translate(0, layerHeight * i, 0)
                    .scale(layerScale, 1, layerScale)
            }
        ), bottomGeo];


        const finalGeo = mergeBufferGeometries(geos);


        // Compute UVs
        const verts = finalGeo.getAttribute("position").array;
        const uvs = [];

        // for(let i = 0; i < verts.length / 3; i += 3) {
        //     const x = verts[i];
        //     const y = verts[i + 1];
        //     const z = verts[i + 2];

        //     // uvs[i] = x / (quadrantSize * 1.15 * 2);
        //     // uvs[i+1] = 1 - z / (quadrantSize * 1.15 * 2);

        //     uvs.push( z / (quadrantSize * 1.15  * 2) + 0.5,  x / (quadrantSize * 1.15 * 2) + 0.5)
        //     const debugs = [ z / (quadrantSize * 1.15),  x / (quadrantSize * 1.15)];
        //     console.log(debugs)
        // }

        // finalGeo.setAttribute("uv", new Float32BufferAttribute(uvs, 2 ))


        // fina   lGeo.computeVertexNormals();
        return finalGeo;
    }


    //@ts-ignore
    ShapeDefinition.prototype.createMaterial = function(size) {

        return new MeshBasicMaterial({
            map: new CanvasTexture(this.generateAsCanvas(size)),
            // transparent: true
            // wireframe: true
        })
    }

    //@ts-ignore
    ShapeDefinition.prototype.createMesh = function(size = 10) {
        //@ts-ignore
        return new Mesh(this.createGeometry(size), this.createMaterial(size * 10 /* DPI of 10*/) )
    }

    ShapeItem.prototype.createMesh = function(size) {
        return this.definition.createMesh(size);
    }




}
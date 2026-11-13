import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#c');

const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const fov = 45;
const aspect = window.innerWidth/window.innerHeight;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(10, 7, 10);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 30;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7df2fa);

function createAmbientLight() {
    return new THREE.AmbientLight(0xffffff, 0.2);
}

function createSun(path) {
    const texture = new THREE.TextureLoader().load(path);
    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(1, 128, 128),
        new THREE.MeshBasicMaterial({map: texture, side: THREE.FrontSide})
    );
    sun.position.set(-15, 0, 15);

    const sunLight = new THREE.PointLight(0xfff4dd, 1000, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sun.add(sunLight);

    return sun;
}

function createSky(size, path) {
    const texture = new THREE.TextureLoader().load(path);
    texture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.Mesh(
        new THREE.SphereGeometry(size, 100, 100),
        new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide})
    );
}

function createFloor(size, path) {
    const texture = new THREE.TextureLoader().load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size, 10, 10),
        new THREE.MeshLambertMaterial({map: texture, side: THREE.DoubleSide})
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;

    floor.position.y = -1.5;
    return floor;
}

function loadColorTexture(path, repeat = 2) {
    const texture = new THREE.TextureLoader().load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    return texture;
}

function createMirrorSphere(radius) {
    const renderTarget = new THREE.WebGLCubeRenderTarget(512);
    const camera = new THREE.CubeCamera(0.1, 1000, renderTarget);
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 48, 32),
        new THREE.MeshBasicMaterial({envMap: renderTarget.texture})
    );
    return {camera, sphere};
}


function createMoon() {
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 96, 64),
        new THREE.MeshStandardMaterial({
            map: loadColorTexture('textures/moon.jpg', 1),
            roughness: 1,
        })
    );

    return moon;
}

function createEarth() {
    return new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 256, 256),
        new THREE.MeshStandardMaterial({
            map: loadColorTexture("textures/earth.jpg", 1),
        })
    );
}

function createEarthNight() {
    return new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 256, 256),
        new THREE.MeshBasicMaterial({
            map: loadColorTexture("textures/earth_night.jpg", 1),
            transparent: true,
            opacity: 0.5,
        })
    );
}

function init() {
    scene.add(new THREE.AxesHelper(5));
    scene.add(camera);
    scene.add(createAmbientLight());
    const sun = createSun("textures/sun.jpg")
    scene.add(sun);
    scene.add(createSky(512, "textures/stars.jpg"));
    scene.add(createFloor(15, "textures/floor.jpg"));


    const earth = createEarth();
    const earthNight = createEarthNight();
    scene.add(earth);
    scene.add(earthNight);

    const moonOrbit = new THREE.Group();
    const moon = createMoon();
    moon.position.set(0, 0, 2.4);
    moonOrbit.add(moon);
    scene.add(moonOrbit);

    earth.castShadow = true;
    earth.receiveShadow = true;
    moon.castShadow = true;
    moon.receiveShadow = true;
    earthNight.position.set(0.001, 0, -0.001);
    earth.position.y = 0;
    moonOrbit.position.y = 0;
    const mirrors = [
        createMirrorSphere(0.8),
    ];

    mirrors.forEach(({camera: mirrorCamera, sphere}) => {
        scene.add(mirrorCamera);
        scene.add(sphere);
    });

    var time = 0;
    renderer.setAnimationLoop(() => {
        controls.update();

        earthNight.rotation.y = time*2*Math.PI;
        earth.rotation.y = time*2*Math.PI;
        moon.rotation.y = time*2*Math.PI/27;
        moonOrbit.rotation.y = time*2*Math.PI/27;
        sun.rotation.y = time*2*Math.PI/27;
        time = (time + 0.005)%200;

        mirrors.forEach(({camera: mirrorCamera, sphere}, index) => {
            const direction = index === 0 ? 1 : -1;
            const angle = time * 0.45 * direction + index * Math.PI;
            const radius = 4;

            sphere.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );

            sphere.visible = false;
            mirrorCamera.position.copy(sphere.position);
            mirrorCamera.update(renderer, scene);
            sphere.visible = true;
        });

        renderer.render(scene, camera);
    });
}

init();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

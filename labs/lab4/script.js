import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    return ambientLight;
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
    scene.add(sun);
    return sun;
}

function createSky(size, path) {
    const texture = new THREE.TextureLoader().load(path);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(size, 100, 100),
        new THREE.MeshBasicMaterial({map: texture, side: THREE.BackSide})
    );
    scene.add(sky);
    return sky;
}

function loadColorTexture(path, repeat = 2) {
    const texture = new THREE.TextureLoader().load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    return texture;
}

function createMoon() {
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 96, 64),
        new THREE.MeshStandardMaterial({
            map: loadColorTexture('textures/moon.jpg', 1),
            roughness: 1,
        })
    );
    moon.castShadow = true;
    moon.receiveShadow = true;
    scene.add(moon);
    return moon;
}

function createEarth() {
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 256, 256),
        new THREE.MeshStandardMaterial({
            map: loadColorTexture("textures/earth.jpg", 1),
        })
    );
    earth.castShadow = true;
    earth.receiveShadow = true;
    scene.add(earth);
    return earth;
}

function createEarthNight() {
    const earthNight = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 256, 256),
        new THREE.MeshBasicMaterial({
            map: loadColorTexture("textures/earth_night.jpg", 1),
            transparent: true,
            opacity: 0.5,
        })
    );
    earthNight.position.set(0.001, 0, -0.001);
    scene.add(earthNight);
    return earthNight;
}

function createRocket(onLoad) {
    const loader = new GLTFLoader();
    loader.load(
        './models/rocket.glb',
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.1, 0.1, 0.1);
            model.position.set(0, 1.5, 0);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material.shadowSide = THREE.BackSide;
                }
            });
            scene.add(model);
            onLoad(model);
        },
        (xhr) => console.log("${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded"),
        (err) => console.error("Error loading model:", err)
    );
}

function init() {
    scene.add(camera);
    createAmbientLight();
    const sun = createSun("textures/sun.jpg");
    createSky(512, "textures/stars.jpg");
    let rocket = null;
    createRocket((model) => { rocket = model; });

    const earth = createEarth();
    const earthNight = createEarthNight();
    const moonOrbit = new THREE.Group();
    const moon = createMoon();
    moon.position.set(0, 0, 2.4);
    moonOrbit.add(moon);
    scene.add(moonOrbit);

    const keys = {};
    const rotationAccel = 3;
    const rocketVelocity = new THREE.Vector3();
    const rocketRotationalVelocity = new THREE.Vector3();
    const thrust = 2.0;
    const damping = 0.98;
    const maxSpeed = 5;
    const timer = new THREE.Timer();
    var paused = true;

	const blocker = document.getElementById( 'blocker' );
	const instructions = document.getElementById( 'instructions' );
    
    function setPaused(p) {
        paused = p;
        instructions.style.display = p ? '' : 'none';
        blocker.style.display = p ? '' : 'none';
    }
    setPaused(true);

    instructions.addEventListener('click', () => {setPaused(false)});

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') setPaused(!paused);
        if (e.code === 'Space') e.preventDefault();
        keys[e.code] = true;
    });
    window.addEventListener('keyup',   (e) => { keys[e.code] = false; });


    renderer.setAnimationLoop(() => {
        timer.update();
        const dt = paused ? 0 : timer.getDelta();
        controls.update();

        earthNight.rotation.y += dt*Math.PI;
        earth.rotation.y += dt*Math.PI;
        moon.rotation.y += dt*Math.PI/27;
        moonOrbit.rotation.y += dt*Math.PI/27;
        sun.rotation.y += dt*Math.PI/27;

        if (rocket) {
            const pitch = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
            const yaw   = (keys['KeyQ'] ? 1 : 0) - (keys['KeyE'] ? 1 : 0);
            const roll  = (keys['KeyA'] ? 1 : 0) - (keys['KeyD'] ? 1 : 0);
            rocketRotationalVelocity.addScaledVector(new THREE.Vector3(pitch, yaw, roll), rotationAccel * dt);
            rocketRotationalVelocity.multiplyScalar(Math.pow(damping, dt * 60));
            rocket.rotateX(rocketRotationalVelocity.x * dt);
            rocket.rotateY(rocketRotationalVelocity.y * dt);
            rocket.rotateZ(rocketRotationalVelocity.z * dt);

            if (keys['Space']) {
                const forward = new THREE.Vector3(0, 1, 0).applyQuaternion(rocket.quaternion);
                rocketVelocity.addScaledVector(forward, thrust * dt);
            }
            rocketVelocity.multiplyScalar(Math.pow(damping, dt * 60));
            if (rocketVelocity.length() > maxSpeed) rocketVelocity.setLength(maxSpeed);
            rocket.position.addScaledVector(rocketVelocity, dt);
        }

        renderer.render(scene, camera);
    });

}

init();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

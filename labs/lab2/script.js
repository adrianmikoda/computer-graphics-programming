import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const {randFloat} = THREE.MathUtils;

const canvas = document.querySelector('#c');

const renderer = new THREE.WebGLRenderer({antialias: true, canvas})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const fov = 45;
const aspect = window.innerWidth/window.innerHeight;
const near = 0.1;
const far = 400;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(10, 7, 10);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, -2.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 100;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7df2fa);

init();

function createCube() {
    const cube = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshLambertMaterial({color: "darkgreen"})
        );
        cube.position.set(0, -5, 0);
        cube.castShadow = true;
        cube.receiveShadow = true;

    return cube;
}

function createHouse() {
    const house = new THREE.Group();
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({color: 0xdbd097})
    );
    cube.position.set(0, 0, 0);
    house.add(cube);
    const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        new THREE.MeshLambertMaterial({color: 0x2e2e2e})
    )
    chimney.position.set(0.3, 0.9, -0.3);
    house.add(chimney);
    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 0.6, 4, 3),
        new THREE.MeshLambertMaterial({color: 0x540505})
    )
    roof.rotation.y = Math.PI/4;
    roof.position.set(0, 0.8, 0)
    house.add(roof);
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 0.5),
        new THREE.MeshLambertMaterial({color: 0x3b2c01})
    )
    door.position.set(0, -0.2, 0.3)
    house.add(door);
    house.position.set(0, 5.5, 0);
    house.traverse(o => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
        
    return house;
}

function createCar() {
    const car = new THREE.Group();
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 0.7),
        new THREE.MeshStandardMaterial ({color: 0x800116, roughness: 0.1, metalness: 0.2})
    );
    car.add(cube);
    const cube2 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.3, 0.7),
        new THREE.MeshStandardMaterial({color: 0x800116, roughness: 0.1, metalness: 0.2})
    );
    cube2.position.set(cube.position.x, cube.position.y+0.25, cube.position.z);
    car.add(cube2)
    const lampDx = [0.7, 0.7]
    const lampDz = [0.2, -0.2]
    for (let i = 0; i < 2; i++) {
        const lamp = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.2, 24),
            new THREE.MeshLambertMaterial({color: "black", emissive: 0xffffff, emissiveIntensity: 10})
        );
        lamp.rotation.z = Math.PI / 2;
        lamp.position.set(lampDx[i], 0, lampDz[i]);
        car.add(lamp);
            
        const spot = new THREE.SpotLight(0xffffff, 20, 10, Math.PI / 6, 0.4, 2);
        spot.position.set(lampDx[i] + 0.1, 0, lampDz[i]);
        spot.target.position.set(lampDx[i] + 2, -0.3, lampDz[i]);
        spot.castShadow = true;
        car.add(spot);
        car.add(spot.target);
    }
    const wheelDx = [0.4, -0.4, 0.4, -0.4]
    const wheelDz = [0.3, 0.3, -0.3, -0.3]
        
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.2, 24),
            new THREE.MeshLambertMaterial({color: "black"})
        );
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(cube.position.x + wheelDx[i], cube.position.y-0.1, cube.position.z + wheelDz[i]); 
        car.add(wheel);
    }

    car.traverse(o => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    car.position.set(-4.5, 5.3, 4.5);

    return car;
}

function move(car, angle, radius) {
    car.position.x = radius * Math.cos(angle);
    car.position.z = radius * Math.sin(angle);
    car.rotation.y = -angle - Math.PI / 2;
}

function createTree() {
    const tree = new THREE.Group();
    const color = new THREE.Color().setHSL(0.33, 1, THREE.MathUtils.randFloat(0.2, 0.4));
    for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(1 - i * 0.25, 1.5, 8),
            new THREE.MeshLambertMaterial({color: color})
        );
        cone.position.y = 0.75 + i * 0.7;
        tree.add(cone);
    }
    const k = randFloat(0.5, 1);
    tree.scale.set(k, k, k)

    tree.traverse(o => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });

    return tree;
}

function createSun() {
    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 16),
        new THREE.MeshBasicMaterial({color: 0xfff4dd})
    );
    sun.position.set(-10, 15, 15);
    const sunLight = new THREE.PointLight(0xfff4dd, 1000, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(4096, 4096);
    sun.add(sunLight);

    return sun;
}

function createStars(count = 350) {
    const stars = new THREE.Group();
    const geometry = new THREE.SphereGeometry(1, 8, 6);
    const material = new THREE.MeshBasicMaterial({color: 0xfff4dd, transparent: true, opacity: 0});
    for (let i = 0; i < count; i++) {
        const star = new THREE.Mesh(geometry, material);
        const y = randFloat(-1, 1);
        const angle = randFloat(0, Math.PI * 2);
        const horizontal = Math.sqrt(1 - y * y);
        const distance = randFloat(60, 220);
        star.position.set(
            distance * horizontal * Math.cos(angle),
            distance * y,
            distance * horizontal * Math.sin(angle)
        );
        star.scale.setScalar(randFloat(0.15, 0.55));
        stars.add(star);
    }
    stars.userData.material = material;

    return stars;
}

function updateStars(stars) {
    const distance = camera.position.distanceTo(controls.target);
    const opacity = THREE.MathUtils.smoothstep(distance, 25, 60);
    stars.userData.material.opacity = opacity;
    stars.visible = opacity > 0;
    scene.background.copy(stars.userData.skyColor).lerp(stars.userData.spaceColor, opacity);
}

function createAmbientLight() {
    return new THREE.AmbientLight( 0xffffff, 0.4);
}

function init() {
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);
    scene.add(camera);
        
    const cube = createCube();
    cube.add(createHouse());
    const car = createCar();
    cube.add(car);
        
    for (let i = 0; i < 35; i++) {
        const tree = createTree();
        let x = randFloat(-4, 4);
        let z = randFloat(-4, 4);
        if (Math.abs(x) < 2 && Math.abs(z) < 2) {
            x = 2 * Math.sign(x) + x;
            z = 2 * Math.sign(z) + z;
        }
        cube.add(tree);
        tree.position.set(x, 5, z);
    }
        
    scene.add(cube);
    scene.add(createAmbientLight());
    scene.add(createSun());
    const stars = createStars();
    stars.userData.skyColor = scene.background.clone();
    stars.userData.spaceColor = new THREE.Color(0x000000);
    scene.add(stars);
        
    let carAngle = 0;
    const radius = 4.5;
    renderer.setAnimationLoop(() => {
        carAngle += 0.01;
        move(car, carAngle, radius);
        cube.rotation.y = (cube.rotation.y + 0.001)%(2*Math.PI);
        controls.update();
        updateStars(stars);
        renderer.render(scene, camera);
    });
}

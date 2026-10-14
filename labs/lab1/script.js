import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { randFloat } from 'three/src/math/MathUtils.js';


const canvas = document.querySelector('#c');

const renderer = new THREE.WebGLRenderer({antialias: true, canvas})
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const fov = 45;
const aspect = window.innerWidth/window.innerHeight;
const near = 0.1;
const far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(10, 7, 10);


const controls = new OrbitControls(camera, canvas);
controls.target.set(0, -2.5, 0);
controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7df2fa);


init();

function createHouse() {
    const house = new THREE.Group();
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({color: 0xdbd097})
    );
    cube.position.set(0, 0, 0);
    house.add(cube);
    const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.5, 0.2),
        new THREE.MeshBasicMaterial({color: 0x2e2e2e})
    )
    chimney.position.set(0.3, 0.9, -0.3);
    house.add(chimney);
    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 0.6, 4, 3),
        new THREE.MeshBasicMaterial({color: 0x540505})
    )
    roof.rotation.y = Math.PI/4;
    roof.position.set(0, 0.8, 0)
    house.add(roof);
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 0.5),
        new THREE.MeshBasicMaterial({color: 0x3b2c01})
    )
    door.position.set(0, -0.2, 0.3)
    house.add(door);

    return house;
}

function createCar() {
    const car = new THREE.Group();
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 0.7),
        new THREE.MeshBasicMaterial({color: 0x800116})
    );
    car.add(cube);
    const cube2 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.3, 0.7),
        new THREE.MeshBasicMaterial({color: 0x800116})
    );
    cube2.position.set(cube.position.x, cube.position.y+0.25, cube.position.z);
    car.add(cube2)
    const dx = [0.4, -0.4, 0.4, -0.4]
    const dz = [0.3, 0.3, -0.3, -0.3]
    for (let i = 0; i < 4; i++) {
        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.2, 24),
            new THREE.MeshBasicMaterial({color: "black"})
        );
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(cube.position.x + dx[i], cube.position.y-0.1, cube.position.z + dz[i]); 
        car.add(wheel);
    }
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
            new THREE.MeshBasicMaterial({ color: color})
        );
        cone.position.y = 0.75 + i * 0.7;
        tree.add(cone);
    }
    const k = randFloat(0.5, 1);
    tree.scale.set(k, k, k)

    return tree;
}

function init() {
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);

    scene.add(camera);

    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(10, 10, 10),
        new THREE.MeshBasicMaterial({ color: "darkgreen" })
    );
    cube.position.set(0, -5, 0);
    const house = createHouse();
    const car = createCar();
    cube.add(house);
    cube.add(car);
    house.position.set(0, 5.5, 0);
    car.position.set(-4.5, 5.3, 4.5);

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

    let carAngle = 0;
    const radius = 4.5;
    renderer.setAnimationLoop(() => {
        carAngle += 0.01;
        move(car, carAngle, radius);
        cube.rotation.y = (cube.rotation.y + 0.001)%(2*Math.PI);
        renderer.render(scene, camera);

    });
}

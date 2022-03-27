function Constellation (scene, x, y, color, numStars, rotationSpeed,
    radius) {

    var object = new THREE.Object3D();
    this.object = object;

    var sphereGeometry = new THREE.SphereGeometry(radius, numStars, numStars);
    var sphereMaterial = new THREE.MeshBasicMaterial( {
        color: color,
        flatShading: true,
        transparent: true,
        opacity: 0.4
    })

    var sphereGridGeometry = new THREE.SphereGeometry(radius + 0.25, numStars, numStars);
    var sphereGridMaterial = new THREE.MeshBasicMaterial( {
        color: color,
        wireframe: true
    })

    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.receiveShadow = false;
    // sphere.position.set(x, radius + 2, y)

    var sphereGrid = new THREE.Mesh(sphereGridGeometry, sphereGridMaterial)
    sphereGrid.receiveShadow = false;
    // sphereGrid.position.set(x, radius + 2, y)

    object.add(sphere)
    object.add(sphereGrid)

    this.sphere = sphere;
    this.sphereGrid = sphereGrid;
    collidableObjects.push(this.sphere)

    object.position.x = x;
    object.position.y = radius + 2;
    object.position.z = y;

    scene.add(object);

  this.update = function() {
      this.sphere.rotation.y += rotationSpeed;
      this.sphereGrid.rotation.y += rotationSpeed;
  }

}
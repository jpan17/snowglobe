function Evergreen(scene, x, z, randomScale) {
    let loader = new THREE.STLLoader();
    loader.load('objects/evergreen.stl', function (geometry) {
      let material = new THREE.MeshStandardMaterial(
        { color: 0x228B22, fog: true} );
      evergreen = new THREE.Mesh(geometry, material);
      
      evergreen.position.set(x,1.5,z);
      evergreen.rotation.set(-1.57,0,0);
      
      evergreen.scale.set(randomScale, randomScale, randomScale);
      
      evergreen.castShadow = true;
      scene.add(evergreen);

      collidableObjects.push(evergreen)
  
    });
  
    this.update = function() {
    }
  }
  
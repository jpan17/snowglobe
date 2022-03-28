function LogCabin() {
  let loader = new THREE.STLLoader();
  loader.load('objects/cabin.stl', function (geometry) {
    let material = new THREE.MeshStandardMaterial(
      { color: 0xfdfd96 } );
    cabin = new THREE.Mesh(geometry, material);
    
    cabin.position.set(0,1.5,0);
    cabin.rotation.set(-1.57,0,0);
    cabin.scale.set(4,4,4);
    
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);

    collidableObjects.push(cabin);

  });
}
function Evergreen(scene) {
    let loader = new THREE.STLLoader();
    loader.load('objects/evergreen.stl', function (geometry) {
      let material = new THREE.MeshBasicMaterial(
        { color: 0xfdfd96, fog: true} );
      evergreen = new THREE.Mesh(geometry, material);
      
      var index = Math.floor(Math.random() * 64);
      console.log(index);
      let x = (Math.floor(index / 8) * 50) - 175;
      let z = (index % 8 * 50) - 175;
      evergreen.position.set(x,1.5,z);
      evergreen.rotation.set(0,0,0);
      evergreen.scale.set(.6,.6,.6);
      
      evergreen.castShadow = true;
      // key.receiveShadow = true;
      scene.add(evergreen);
  
    });
  
    this.update = function() {
    }
  }
  
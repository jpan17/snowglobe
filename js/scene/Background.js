function Background(scene) {

  this.rotate = 0;
  this.time = 0;

  // create floor
  var planeGeometry = new THREE.PlaneGeometry(360, 360, 100, 100);
  // planeGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

  // merge floor vertices
  planeGeometry.mergeVertices();

  // get the vertices
  var verticesLength = planeGeometry.vertices.length;

  // create an array to store new data associated to each vertex
  for (var i = 0; i < verticesLength; i++) {
    planeGeometry.vertices[i].y += + Math.random()*5;
    planeGeometry.vertices[i].z += Math.random()*1;
  }
   
  var mat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    side: THREE.DoubleSide,
    flatShading: true,
	});

	var ground = new THREE.Mesh(planeGeometry, mat);
  ground.receiveShadow = true;
  ground.castShadow = false;
  ground.rotation.x = -Math.PI/2;
  // scene.add(ground);

 
  scene.add(ground)


  const textureLoader = new THREE.TextureLoader();

  /*create a shader material with a standard vertexShader. Pass the */
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      iTime: {value:0},
      iChannel0:{value:textureLoader.load("./js/scene/first.png")},
      iChannel1:{value:textureLoader.load("./js/scene/second.jpg")}
    },
    vertexShader: `
      varying vec2 vUv;
          
      void main()
      {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        vUv = uv;
      }
    `,
    side: THREE.BackSide,
    fragmentShader: `
    
      //bring in your uniforms of time and the two textures to use in the shader
      uniform float iTime;
      uniform sampler2D iChannel0;
      uniform sampler2D iChannel1;
      
      //get the uv from the vertex shader above
      varying vec2 vUv;
      
      #define TAU 6.283185307179586476925286766559
      
      void main() {
        vec2 uv = vUv;
          //get the pixel color from our textures at a uv coordinate offset by time
          //.r just takes the red value of the sampled pixel https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)#Swizzling
          float o = texture2D(iChannel1, uv * 0.25 + vec2(0.0, iTime * 0.025)).r;
          float d = (texture2D(iChannel0, uv * 0.25 - vec2(0.0, iTime * 0.02 + o * 0.02)).r * 2.0 - 1.0);

          float v = uv.y + d * 0.1;
          v = 1.0 - abs(v * 2.0 - 1.0);//abs() keeps things above zero. -1 will become 1, -9.5 will become 9.5
          v = pow(v, 2.0 + sin((iTime * 0.2 + d * 0.25) * TAU) * 0.5);

          vec3 color = vec3(0.0);

          float x = (1.0 - uv.x * 0.75);
          float y = 1.0 - abs(uv.y * 2.0 - 1.0);
          color += vec3(x * 0.5, y, x) * v;

          //this part adds random stars
          vec2 seed = uv;
          vec2 r;
          r.x = fract(sin((seed.x * 12.9898) + (seed.y * 78.2330)) * 43758.5453);
          r.y = fract(sin((seed.x * 53.7842) + (seed.y * 47.5134)) * 43758.5453);
          float s = mix(r.x, (sin((iTime * 2.5 + 60.0) * r.y) * 0.5 + 0.5) * ((r.y * r.y) * (r.y * r.y)), 0.04); 
          color += pow(s, 70.0) * (1.0 - v);

          //set the color RGB values
          gl_FragColor.rgb = color;
          //set the color Alpha value
          gl_FragColor.a = 1.0;
      }
    `,
    wireframe: false,
  });

  var sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 20, 20),
    shaderMaterial
  )

  sky.fog = true;
  sky.receiveShadow = true;

  sky.position = new THREE.Vector3( 0, 0, 0 );
  sky.rotation.x = 4.71;
  scene.add(sky)
  collidableObjects.push(sky)

  this.update = function() {
    this.time += 0.01;
    shaderMaterial.uniforms.iTime.value = this.time;//update the time uniform in the shader    
  }

}

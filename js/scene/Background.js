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

  
  var params = {
    fogNearColor: 0xfc4848,
    fogHorizonColor: 0xe4dcff,
    fogDensity: 0.0025,
    fogNoiseSpeed: 100,
    fogNoiseFreq: .0012,
    fogNoiseImpact: .5
  };

  const uniforms = ({
    fogNearColor: { value: new THREE.Color(params.fogNearColor) },
    fogNoiseFreq: { value: params.fogNoiseFreq },
    fogNoiseSpeed: { value: params.fogNoiseSpeed },
    fogNoiseImpact: { value: params.fogNoiseImpact },
    time: { value: 0 }
  });

  // shaderMaterial.uniforms = THREE.UniformsUtils.merge([shaderMaterial.uniforms, uniforms]);

  const noise = `
  //	Classic Perlin 3D Noise 
  //	by Stefan Gustavson
  //
  //  Source https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
  // 
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
    return 2.2 * n_xyz;
  }
  `;

  const fogParsVert = `
  #ifdef USE_FOG
    varying float fogDepth;
    varying vec3 vFogWorldPosition;
  #endif
  `;
  
  const fogVert = `
  #ifdef USE_FOG
    fogDepth = - mvPosition.z;
     vFogWorldPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;
  #endif
  `;
  
  const fogFrag = `
  #ifdef USE_FOG
    vec3 windDir = vec3(0.0, 0.0, time);
    vec3 scrollingPos = vFogWorldPosition.xyz + fogNoiseSpeed * windDir;  
    float noise = cnoise(fogNoiseFreq * scrollingPos.xyz);
    float vFogDepth = (1.0 - fogNoiseImpact * noise) * fogDepth;
    #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
    #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    #endif
    gl_FragColor.rgb = mix( gl_FragColor.rgb, mix(fogNearColor, fogColor, fogFactor), fogFactor );
  #endif
  
  `;
  
  const fogParsFrag = `
  #ifdef USE_FOG
    ${noise}
    uniform vec3 fogColor;
    uniform vec3 fogNearColor;
    varying float fogDepth;
    #ifdef FOG_EXP2
      uniform float fogDensity;
    #else
      uniform float fogNear;
      uniform float fogFar;
    #endif
    varying vec3 vFogWorldPosition;
    uniform float time;
    uniform float fogNoiseSpeed;
    uniform float fogNoiseFreq;
    uniform float fogNoiseImpact;
  #endif
  `
  
  
  shaderMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace(
      `#include <fog_pars_vertex>`,
      fogParsVert
    );
    shaderMaterial.vertexShader = shader.vertexShader.replace(
      `#include <fog_vertex>`,
      fogVert
    );
    shaderMaterial.fragmentShader = shader.fragmentShader.replace(
      `#include <fog_pars_fragment>`,
      fogParsFrag
    );
    shaderMaterial.fragmentShader = shader.fragmentShader.replace(
      `#include <fog_fragment>`,
      fogFrag
    );
  };

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

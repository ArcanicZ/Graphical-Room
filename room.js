// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  v_TexCoords = a_TexCoords;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' +    // Texture enable/disable flag
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
     // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 diffuse;\n' +
  '  if (u_UseTextures) {\n' +
  '     vec4 TexColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '     diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;\n' +
  '  } else {\n' +
  '     diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  }\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '}\n';



function main() 
{
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
  {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) 
  {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.5, 0.9, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

  //Checks to see if storage locations could be found
  if (!u_ModelMatrix || !u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
    console.log('Failed to get the storage location');
    return;
  }

  var u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
  if (!u_UseTextures) { 
    console.log('Failed to get the storage location for texture map enable flag');
    return;
  }

  var modelMatrix = new Matrix4();

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 20.0, 17.0, 10.0);
  // Set the ambient light, a bit dark
  gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3);
  
  // Calculate the view projection matrix
  var viewProjectionMatrix = new Matrix4();
  viewProjectionMatrix.setPerspective(50.0, canvas.width / canvas.height, 1.0, 100.0);
  viewProjectionMatrix.lookAt(15.0,15.0, 60.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  gl.uniform1i(u_UseTextures, false);

  document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures); };
  
  drawScene(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures);
}

var position_change = 1.0;
var angle_change = 4.0;
var new_angle = 0.0;
var move_chair = 0.0;
var move_light = 0.0;
var door_angle = 0.0;
var move_board = 0.0;

function keydown(ev, gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures) 
{

  switch (ev.keyCode) 
  {
    //Down Key
    case 40: 
      viewProjectionMatrix.lookAt(0.0,0.0, position_change, 0.0, .0, 0.0, 0.0, 1.0, 0.0);
      break;
    //Up Key
    case 38: 
      viewProjectionMatrix.lookAt(0.1,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
      viewProjectionMatrix.lookAt(0.1,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
      viewProjectionMatrix.lookAt(0.0,0.0, position_change, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
      viewProjectionMatrix.lookAt(0.1,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
      viewProjectionMatrix.lookAt(0.1,0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
      break;
    case 39: 
      new_angle -= angle_change;
      break;
    case 37: 
      new_angle += angle_change;
      break;
    case 81:
      if(move_chair < 2.5)
      {
        move_chair += 0.25;
      }
      break;
    case 87:
      if(move_chair > -2.0)
      {
        move_chair -= 0.25; 
      }
      break
    case 65:
      if(move_light < 46)
      {
        move_light += 2.0;
      }
      break
    case 83:
      if(move_light > -46)
      {
        move_light -= 2.0;
      }
      break
    case 88:
      if(door_angle < 0)
      {
        door_angle += 2.0;
      }
      break
    case 90:
      if(door_angle > -10)
      {
        door_angle -= 2.0;
      }
      break
    case 69:
      if(move_board < 2.0)
      {
        move_board += 0.25;
      }
      break;
    case 82:
      if(move_board > 0)
      {
        move_board -= 0.25; 
      }
      break
  }
  drawScene(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures);
}

function initVertexBuffers(gl) {
  // Coordinates（Cube which length of one side is 1 with the origin on the center of the bottom)
  var vertices = new Float32Array([
    0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
    0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
    0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
   -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
    0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
  ]);

  // Normal
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Write the vertex property to buffers (coordinates and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) 
  {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

var texCoords = new Float32Array([
  1.0, 0.0,    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,  // v0-v1-v2-v3 front
  1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v3-v4-v5 right
  1.0, 1.0,    1.0, 0.0,   0.0, 0.0,   0.0, 1.0,  // v0-v5-v6-v1 up
  1.0, 0.0,    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,  // v1-v6-v7-v2 left
  0.0, 1.0,    1.0, 1.0,   1.0, 0.0,   0.0, 0.0,  // v7-v4-v3-v2 down
  0.0, 1.0,    1.0, 1.0,   1.0, 0.0,   0.0, 0.0   // v4-v7-v6-v5 back
]);

//Used to make floor texture look better by changing coordinates
var texCoordsFloor = new Float32Array([
  3.0, 0.0,    0.0, 0.0,   0.0, 3.0,   3.0, 3.0,  // v0-v1-v2-v3 front
  3.0, 0.0,    3.0, 3.0,   0.0, 3.0,   0.0, 0.0,  // v0-v3-v4-v5 right
  3.0, 3.0,    3.0, 0.0,   0.0, 0.0,   0.0, 3.0,  // v0-v5-v6-v1 up
  3.0, 0.0,    0.0, 0.0,   0.0, 3.0,   3.0, 3.0,  // v1-v6-v7-v2 left
  0.0, 3.0,    3.0, 3.0,   3.0, 0.0,   0.0, 0.0,  // v7-v4-v3-v2 down
  0.0, 3.0,    3.0, 3.0,   3.0, 0.0,   0.0, 0.0   // v4-v7-v6-v5 back
]);

function initArrayBuffer(gl, attribute, data, num) 
{
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) 
  {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  // Element size
  var FSIZE = data.BYTES_PER_ELEMENT;

  // Assign the buffer object to the attribute variable

  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) 
  {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, FSIZE * num, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

var tempModelMatrix = new Matrix4(), tempMvpMatrix = new Matrix4();

function drawScene(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures) 
{
	
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  walls_ceiling_floor(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle+0.0, u_UseTextures);
  ceiling_light(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, move_light);

  //Front Left
  chair(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, 7.5-move_chair, 0.0, 19.0,new_angle+0.0, u_UseTextures);
  //Back Left
  chair(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, 7.5-move_chair, 0.0, 23.0,new_angle+0.0, u_UseTextures);
  //Back Right
  chair(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, -18.5-move_chair, 0.0, -21.0,new_angle+180.0, u_UseTextures);
  //Front Right
  chair(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, -18.5-move_chair, 0.0, -25.0,new_angle+180.0, u_UseTextures);
  
  //New angle used to rotate objects when camera is moving
  table(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle+90.0, u_UseTextures);
  bed(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures);
  sofa(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle+90.0, u_UseTextures);
  stand(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle, u_UseTextures);
  tv(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle);
  rug(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle, u_UseTextures);
  wardrobe(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, new_angle+90.0, u_UseTextures);
}

function walls_ceiling_floor(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate, u_UseTextures)
{
  //Floor
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-2.5, 0.0, 5.0);
  gl.uniform1i(u_UseTextures, true);
  initArrayBuffer(gl, 'a_TexCoords', texCoordsFloor, 2)
  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('floor-texture'));
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 50.0, 0.0, 45.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.71,0.396,0.114);
  gl.uniform1i(u_UseTextures, false);

  //Ceiling
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-2.5, 20.0, 5.0);
  gl.uniform1i(u_UseTextures, true);
  var ceilingTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, ceilingTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('ceiling-texture'));
  gl.bindTexture(gl.TEXTURE_2D, ceilingTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 50.0, 0.0, 45.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.76,0.76,0.76);
  gl.uniform1i(u_UseTextures, false);

  //Back Wall
  gl.uniform1i(u_UseTextures, true);
  initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)
  var sideTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sideTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('wallpaper-texture'));
  gl.bindTexture(gl.TEXTURE_2D, sideTexture);
  gl.activeTexture(gl.TEXTURE0);
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-2.5, 0.0, -17.5);
  drawBox(gl, n, 50.0, 20.0, 0.1, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.95,0.95,0.95);
  
  //Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-27.5, 0.0, 5.0);
  drawBox(gl, n, 0.1, 20.0, 45.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.95,0.95,0.95);
  gl.uniform1i(u_UseTextures, false);
}

function chair(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, x, y, z, rotate, u_UseTextures)
{
  //Back Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+0.0, y+0.0, z+0.0);
  gl.uniform1i(u_UseTextures, true);
  initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)
  var chairTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, chairTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('chair-texture'));
  gl.bindTexture(gl.TEXTURE_2D, chairTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 0.5, 2.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  
  //Back Right
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+0.0, y+0.0, z+2.0);
  drawBox(gl, n, 0.5, 2.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  
  //Front Right
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+2.0, y+0.0, z+2.0);
  drawBox(gl, n, 0.5, 2.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  
  //Front Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+2.0, y+0.0, z+0.0);
  drawBox(gl, n, 0.5, 2.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  
  //Seat
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+1.0, y+2.5, z+1.0);
  drawBox(gl, n, 2.5, 0.1, 2.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  
  //Back
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x-0.25, y+2.5, z+1.0);
  tempModelMatrix.rotate(5.0,0.0,0.0,1.0);
  drawBox(gl, n, 0.1, 3.5, 2.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Left Armrest Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+0.0, y+2.5, z-0.5);
  drawBox(gl, n, 0.5, 1.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Left Armrest Top
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+0.5, y+3.5, z-0.5);
  drawBox(gl, n, 1.5, 0.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Right Armrest Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+0.0, y+2.5, z+2.5);
  drawBox(gl, n, 0.5, 1.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Right Armrest Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(x+0.5, y+3.5, z+2.5);
  drawBox(gl, n, 1.5, 0.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  gl.uniform1i(u_UseTextures, false);
}

function table(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate, u_UseTextures) 
{

  //Front Left Leg
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-26.0, 0.0,11.0);
  gl.uniform1i(u_UseTextures, true);
  initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)
  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('table-texture'));
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 1.0, 3.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,0.8,0.4);
  
  //Front Right Leg
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-26.0, 0.0,15.0);
  drawBox(gl, n, 1.0, 3.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,0.8,0.4);
  
  //Back Right Leg
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-18.0, 0.0,15.0);
  drawBox(gl, n, 1.0, 3.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,0.8,0.4);
  
  //Back Left Leg
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-18.0, 0.0,11.0);
  drawBox(gl, n, 1.0, 3.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,0.8,0.4);
  
  //Table Top
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-22.0, 3.0, 13.0);
  drawBox(gl, n, 9.0, 0.5, 5.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,0.8,0.4);
  gl.uniform1i(u_UseTextures, false);
}

function ceiling_light(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, move_light, u_UseTextures)
{
  //Cable
  tempModelMatrix.translate(20.0, 20.0, 0.0);
  tempModelMatrix.rotate(move_light,0.0,0.0,1.0)
  tempModelMatrix.translate(0.0, -3.0, 0.0);
  drawBox(gl, n, 0.5, 4.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);

  //Bulb
  tempModelMatrix.translate(0.0, -2.0, 0.0);
  drawBox(gl, n, 2.5, 2.5, 2.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

}

function bed(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, u_UseTextures)
{
  //Back Frame
  tempModelMatrix.translate(2.0, -3.0, -40.0);
  gl.uniform1i(u_UseTextures, true);
  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('table-texture'));
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 10.5, 7.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.40,0.26,0.13);
  gl.uniform1i(u_UseTextures, false);

  //Bed
  tempModelMatrix.translate(0.0, 0.0, 8.0);
  gl.uniform1i(u_UseTextures, true);
  var bedTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, bedTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('bed-texture'));
  gl.bindTexture(gl.TEXTURE_2D, bedTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 10.5, 3.0, 15.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,0.8,0.4);
  gl.uniform1i(u_UseTextures, false);

  //Left Pillow
  tempModelMatrix.translate(-3.0, 3.0, -6.0);
  gl.uniform1i(u_UseTextures, true);
  var pillowTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pillowTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('pillow-texture'));
  gl.bindTexture(gl.TEXTURE_2D, pillowTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 4.5, 0.5, 3.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  // Right Pillow
  tempModelMatrix.translate(5.5, 0.0, 0.0);
  drawBox(gl, n, 4.5, 0.5, 3.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  gl.uniform1i(u_UseTextures, false);

  //Duvet
  tempModelMatrix.translate(-2.5, 0.0, 8.0);
  gl.uniform1i(u_UseTextures, true);
  var duvetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, duvetTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('duvet-texture'));
  gl.bindTexture(gl.TEXTURE_2D, duvetTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 10.5, 0.5, 10.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  gl.uniform1i(u_UseTextures, false);
}

function sofa(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate, u_UseTextures)
{
  //Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-5.0, 0.0, 13.0);
  gl.uniform1i(u_UseTextures, true);
  initArrayBuffer(gl, 'a_TexCoords', texCoords, 2)
  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('leather-texture'));
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 4.0, 1.5, 8.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  
  //Top
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-7.0, 0.0, 13.0);
  drawBox(gl, n, 1.5, 4.0, 8.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  
  //Right
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-5.0, 1.5, 17.0);
  drawBox(gl, n, 4.5, 1.25, 1.25, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  
  //Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-5.0, 1.5, 9.0);
  drawBox(gl, n, 4.5, 1.25, 1.25, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  
  gl.uniform1i(u_UseTextures, false);

  //Pillow
  tempModelMatrix.translate(-1.0, 0.0, 2.25);
  gl.uniform1i(u_UseTextures, true);
  var pillTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pillTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('pill-texture'));
  gl.bindTexture(gl.TEXTURE_2D, pillTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 0.8, 1.5, 3.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Pillow
  tempModelMatrix.translate(0.0, 0.0, 3.6);
  drawBox(gl, n, 0.8, 1.5, 3.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  gl.uniform1i(u_UseTextures, false);
}

function rug(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate, u_UseTextures)
{
  //Rug
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(13.0, 0.0, -5.5);
  gl.uniform1i(u_UseTextures, true);
  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('rug-texture'));
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 10.5, 0.5, 10.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.8,0.2,0.2);
  gl.uniform1i(u_UseTextures, false)

}

function tv(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate)
{
  //Bottom Stand
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 3.5, -15.25);
  drawBox(gl, n, 5.0, 0.25, 3.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);

  //Stick Stand
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 3.75, -15.25);
  drawBox(gl, n, 1.5, 1.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.502,0.502,0.502);

  //Screen
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 5.25, -15.25);
  drawBox(gl, n, 11.0, 5.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);

}

function stand(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate, u_UseTextures)
{
  //Stand Back
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 0.0, -17.25);
  gl.uniform1i(u_UseTextures, true);
  var standTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, standTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('stand-texture'));
  gl.bindTexture(gl.TEXTURE_2D, standTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 10.5, 3.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 0.0, -15.5);
  drawBox(gl, n, 10.5, 0.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Top
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 3.0, -15.5);
  drawBox(gl, n, 10.5, 0.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(7.5, 0.0, -15.5);
  drawBox(gl, n, 0.5, 3.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Right
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(18.0, 0.0, -15.5);
  drawBox(gl, n, 0.5, 3.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  gl.uniform1i(u_UseTextures, false);
  //Inner Back
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 0.0, -16.25+move_board);
  gl.uniform1i(u_UseTextures, true);
  var pullTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pullTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('table-texture'));
  gl.bindTexture(gl.TEXTURE_2D, pullTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 10, 3.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.71,0.396,0.114);

  //Inner Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 0.5, -15.5+move_board);
  drawBox(gl, n, 10.0, 0.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.71,0.396,0.114);

  //Inner Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(8.0, 0.5, -15.5+move_board);
  drawBox(gl, n, 0.5, 2.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.71,0.396,0.114);

  //Inner Right
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(17.5, 0.5, -15.5+move_board);
  drawBox(gl, n, 0.5, 2.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.71,0.396,0.114);

  //Inner Front
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(12.75, 0.5, -13.5+move_board);
  drawBox(gl, n, 10, 2.5, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.71,0.396,0.114);
  gl.uniform1i(u_UseTextures, false);

  //Door Handle
  tempModelMatrix.translate(0, 0.5, 0.5);
  drawBox(gl, n, 1.0, 1.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
}

function wardrobe(gl, n, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix, rotate, u_UseTextures)
{
  //Stand Back
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-2.0, 0.0, -27.0);
  gl.uniform1i(u_UseTextures, true);
  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('wardrobe-texture'));
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 8.0, 10.0, 0.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Bottom
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-2.0, 0.0, -25.5);
  drawBox(gl, n, 8.0, 0.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Top
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-2.0, 10.0, -25.5);
  drawBox(gl, n, 8.0, 0.5, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Left
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-6.0, 0.0, -25.5);
  drawBox(gl, n, 0.5, 10.0, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Stand Right
  tempModelMatrix.setRotate(rotate, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(2.0, 0.0, -25.5);
  drawBox(gl, n, 0.5, 10.0, 4.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);
  gl.uniform1i(u_UseTextures, false);
  //Right Door
  //tempModelMatrix.setRotate(180, 0.0, 1.0, 0.0);
  tempModelMatrix.setRotate(rotate-90.0+door_angle, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-23.5, 0.0, 0.0);
  gl.uniform1i(u_UseTextures, true);
  var doorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, doorTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('door-texture'));
  gl.bindTexture(gl.TEXTURE_2D, doorTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 0.5, 10.0, 3.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  gl.uniform1i(u_UseTextures, false);

  //Door Handle
  tempModelMatrix.translate(0, 5.0, 0.0);
  drawBox(gl, n, 1.0, 1.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

  //Left Door
  tempModelMatrix.setRotate(rotate-90.0-door_angle, 0.0, 1.0, 0.0);
  tempModelMatrix.translate(-23.5, 0.0, 4.0);
  gl.uniform1i(u_UseTextures, true);
  gl.bindTexture(gl.TEXTURE_2D, doorTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById('door-texture'));
  gl.bindTexture(gl.TEXTURE_2D, doorTexture);
  gl.activeTexture(gl.TEXTURE0);
  drawBox(gl, n, 0.5, 10.0, 3.5, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,0.0,0.0,0.0);
  gl.uniform1i(u_UseTextures, false);

  //Door Handle
  tempModelMatrix.translate(0, 5.0, 0.0);
  drawBox(gl, n, 1.0, 1.0, 1.0, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,1.0,1.0,1.0);

}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) 
{ // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() 
{ // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

var tempNormalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

// Draw rectangular solid
function drawBox(gl, n, w, h, d, viewProjectionMatrix, u_MvpMatrix, u_NormalMatrix,r, g, b) 
{
  pushMatrix(tempModelMatrix);   // Save the model matrix
    var colors = new Float32Array([
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
    r, g, b,   r, g, b,   r, g, b,  r, g, b,      // v0-v3-v4-v5 right
    r, g, b,   r, g, b,   r, g, b,  r, g, b,      // v0-v5-v6-v1 up
    r, g, b,   r, g, b,   r, g, b,  r, g, b,      // v1-v6-v7-v2 left
    r, g, b,   r, g, b,   r, g, b,  r, g, b,      // v7-v4-v3-v2 down
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v4-v7-v6-v5 back
 ]);
 
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  // Scale a cube and draw
  tempModelMatrix.scale(w, h, d);
  
  // Calculate the model view project matrix and pass it to u_MvpMatrix
  tempMvpMatrix.set(viewProjectionMatrix);
  tempMvpMatrix.multiply(tempModelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, tempMvpMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  tempNormalMatrix.setInverseOf(tempModelMatrix);
  tempNormalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, tempNormalMatrix.elements);

  // Draw
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  tempModelMatrix = popMatrix();   // Retrieve the model matrix
}
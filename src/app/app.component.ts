import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {animate} from '@angular/animations';
import {mat4} from 'gl-matrix';

export const boids_vert = `
  attribute vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

export const boids_frag = `
void main() {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const programInfo = {
  program: 0,
  attribLocations: {
    vertexPosition: -1,
  },
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation,
    modelViewMatrix: WebGLUniformLocation,
  }
}

let positionBuffer: any;
let positions: number[] = [];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit{
  title = 'boids';
  @ViewChild('canvas') canvas: ElementRef|undefined;
  public width = 0;
  public height = 0;
  public glContext?: WebGL2RenderingContext;
  public webGlShaderProgram?: WebGLProgram;
  public pMatrix: WebGLUniformLocation | null | undefined;
  public mMatrix: WebGLUniformLocation | null | undefined;

  public render() {
    const gl = this.getGl();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = this.width / this.height;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix,
      fieldOfView,
      aspect,
      zNear,
      zFar);

    const modelViewMatrix = mat4.create();

    mat4.translate(modelViewMatrix,     // destination matrix
      modelViewMatrix,     // matrix to translate
      [-0.0, 0.0, -6.0]);  // amount to translate

    {
      const numComponents = 2;  // pull out 2 values per iteration
      const type = gl.FLOAT;    // the data in the buffer is 32bit floats
      const normalize = false;  // don't normalize
      const stride = 0;         // how many bytes to get from one set of values to the next
                                // 0 = use type and numComponents above
      const offset = 0;         // how many bytes inside the buffer to start from
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
      gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
    }

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
      (this.pMatrix)!,
      false,
      projectionMatrix);
    gl.uniformMatrix4fv(
      (this.mMatrix)!,
      false,
      modelViewMatrix);

    {
      const offset = 0;
      const vertexCount = 4;
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
  }

  public setupRenderer() {
    this.glContext = this.canvas?.nativeElement.getContext('webgl');
    const gl = this.glContext!;

    this.width = this.canvas?.nativeElement!.width;
    this.height = this.canvas?.nativeElement!.height;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.webGlShaderProgram = this.loadShaderProgram(boids_vert, boids_frag)!;
    // @ts-ignore
    programInfo.program = this.webGlShaderProgram;

    programInfo.attribLocations.vertexPosition = gl.getAttribLocation(programInfo.program, 'aVertexPosition');
    this.pMatrix = gl.getUniformLocation(programInfo.program, 'uProjectionMatrix');
    this.mMatrix = gl.getUniformLocation(programInfo.program, 'uModelViewMatrix');

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    positions = [
      -1.0,  1.0,
      1.0,  1.0,
      -1.0, -1.0,
      1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.render();
  }

  public loadShader(type: number, source: string): WebGLShader|null {
    const gl = this.getGl();

    const shader = gl.createShader(type)!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('GL ERROR: An Error occurred while compiling shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader!);
      return null;
    }

    return shader;
  }

  public loadShaderProgram(vertSource: string, fragSource: string): WebGLProgram|undefined {
    const gl = this.getGl();

    const vertShader = this.loadShader(gl.VERTEX_SHADER, vertSource)!;
    const fragShader = this.loadShader(gl.FRAGMENT_SHADER, fragSource)!;

    const shaderProgram = gl.createProgram()!;

    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('GL ERROR: An Error occurred while linking program: ' + gl.getProgramInfoLog(shaderProgram));
      gl.deleteProgram(shaderProgram);
      return;
    }

    return shaderProgram;
  }


  public getGl(): WebGL2RenderingContext {
    return this.glContext!;
  }

  public getProgram(): WebGLProgram {
    return this.webGlShaderProgram!;
  }


  ngAfterViewInit() {
    console.log(this.canvas)
    this.setupRenderer();
  }

  onClick() {
  }
}

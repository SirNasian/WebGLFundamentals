const canvas = document.getElementsByTagName("canvas")[0];
const gl = (canvas as HTMLCanvasElement).getContext("webgl");
gl.viewport(0, 0, canvas.width, canvas.height);

const vertices = new Float32Array([
	-1.0, -1.0, 0.0, 0.0,
	 1.0, -1.0, 1.0, 0.0,
	-1.0,  1.0, 0.0, 1.0,
	 1.0,  1.0, 1.0, 1.0,
]);

const walls = new Uint8Array([
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00,
	0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00,
	0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00,
	0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00,
	0x00, 0xFF, 0xFF, 0x00, 0x00, 0xFF, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

const program = gl.createProgram();
const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);

gl.shaderSource(vertex_shader, `
	attribute vec2 vertex_position;
	attribute vec2 vertex_uv;
	varying vec2 fragment_position;
	varying vec2 fragment_uv;
	void main() {
		gl_Position = vec4(vertex_position, 0.0, 1.0);
		fragment_position = vertex_position;
		fragment_uv = vertex_uv;
	}
`);

gl.shaderSource(fragment_shader, `
	precision mediump float;
	uniform sampler2D wall_texture;
	uniform vec2 cursor_position;
	varying vec2 fragment_position;
	varying vec2 fragment_uv;
	void main() {
		float intensity = 1.0 - length(fragment_position - cursor_position);
		float red = texture2D(wall_texture, fragment_uv).r;

		vec2 cursor_uv = vec2((cursor_position.x + 1.0) / 2.0, (cursor_position.y + 1.0) / 2.0);
		for (int i = 0; i < 1024; i++)
			if (texture2D(wall_texture, cursor_uv + ((fragment_uv - cursor_uv) / 1024.0) * float(i)).r > 0.0) {
				intensity = 0.0;
				break;
			}

		if (red == 0.0)
			gl_FragColor = vec4(vec3(intensity), 1.0);
		else
			gl_FragColor = vec4(red, 0.0, 0.0, 1.0);
	}
`);

gl.compileShader(vertex_shader);
gl.compileShader(fragment_shader);

gl.attachShader(program, vertex_shader);
gl.attachShader(program, fragment_shader);
gl.linkProgram(program);
gl.useProgram(program);

const texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, walls);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const attribute_location0 = gl.getAttribLocation(program, "vertex_position");
gl.enableVertexAttribArray(attribute_location0);
gl.vertexAttribPointer(attribute_location0, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT);

const attribute_location1 = gl.getAttribLocation(program, "vertex_uv");
gl.enableVertexAttribArray(attribute_location1);
gl.vertexAttribPointer(attribute_location1, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

const uniform_location = gl.getUniformLocation(program, "cursor_position");
const bounds = canvas.getBoundingClientRect();
document.addEventListener("mousemove", ({ x, y }) => gl.uniform2f(uniform_location, 2.0 * (x/bounds.width) - 1.0, 1.0 - (y/bounds.height) * 2));
gl.uniform1i(gl.getUniformLocation(program, "wall_texture"), 0);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
const render = () => {
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	window.requestAnimationFrame(render);
}

render();

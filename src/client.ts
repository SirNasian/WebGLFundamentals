import { constructShader } from "./shader";

const canvas = document.getElementsByTagName("canvas")[0];
const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
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

const shader = constructShader(
	gl,
	`#version 300 es
		layout (location = 0) in vec2 vertex_position;
		layout (location = 1) in vec2 vertex_uv;
		out vec2 fragment_position;
		out vec2 fragment_uv;
		void main() {
			gl_Position = vec4(vertex_position, 0.0, 1.0);
			fragment_position = vertex_position;
			fragment_uv = vertex_uv;
		}
	`,
	`#version 300 es
		precision mediump float;
		uniform sampler2D wall_texture;
		uniform vec2 cursor_position;
		in vec2 fragment_position;
		in vec2 fragment_uv;
		out vec4 fragment_colour;
		void main() {
			float intensity = 1.0 - length(fragment_position - cursor_position);
			float red = texture(wall_texture, fragment_uv).r;

			vec2 cursor_uv = vec2((cursor_position.x + 1.0) / 2.0, (cursor_position.y + 1.0) / 2.0);
			for (int i = 0; i < 1024; i++)
				if (texture(wall_texture, cursor_uv + ((fragment_uv - cursor_uv) / 1024.0) * float(i)).r > 0.0) {
					intensity = 0.0;
					break;
				}

			if (red == 0.0)
				fragment_colour = vec4(vec3(intensity), 1.0);
			else
				fragment_colour = vec4(red, 0.0, 0.0, 1.0);
		}
	`,
);

shader.use();

const texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 8, 8, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, walls);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT);

gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

const bounds = canvas.getBoundingClientRect();
document.addEventListener("mousemove", ({ x, y }) => shader.setUniform2fv("cursor_position", new Float32Array([2.0 * (x/bounds.width) - 1.0, 1.0 - (y/bounds.height) * 2])));
shader.setUniform1i("wall_texture", 0);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
const render = () => {
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	window.requestAnimationFrame(render);
}

render();

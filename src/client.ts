import { Client } from "./common/types";
import { hexToRgb } from "./common/utils";

import { createConnection } from "./client/connection";
import { constructShader } from "./client/shader";

let _id = "";
let _clients: Record<string, Client> = {};
const _colour = new URLSearchParams(window.location.search).get("colour") ?? "#FFFFFF";

const connection = createConnection(
	`ws://${window.location.hostname}:3001`,
	({ id }) => (_id = id),
	({ clients }) => clients.forEach((client) => (client.id !== _id) && (_clients[client.id] = client)),
	({ id }) => delete _clients[id],
);

document.addEventListener("mousemove", ({ x, y }) => {
	if (!_id) return;

	_clients[_id] = {
		id: _id,
		position: {
			x: 2.0 * (x/bounds.width) - 1.0,
			y: 1.0 - (y/bounds.height) * 2,
		},
		colour: _colour,
	};

	connection.send({
		type: "client-update",
		..._clients[_id],
	});
});

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

		struct Cursor {
			vec2 position;
			vec3 colour;
		};

		uniform sampler2D wall_texture;
		uniform Cursor[256] cursors;
		uniform int cursor_count;

		in vec2 fragment_position;
		in vec2 fragment_uv;
		out vec4 fragment_colour;

		void main() {
			fragment_colour = vec4(0.0, 0.0, 0.0, 1.0);

			for (int i = 0; i < cursor_count; i++) {
				vec2 cursor_uv = vec2((cursors[i].position.x + 1.0) / 2.0, (cursors[i].position.y + 1.0) / 2.0);
				bool visible = true;
				for (int i = 0; i < 1024; i++)
					if (texture(wall_texture, cursor_uv + ((fragment_uv - cursor_uv) / 1024.0) * float(i)).r > 0.0) {
						visible = false;
						break;
					}
				if (visible) {
					float intensity = max(0.0, 0.8 - length(fragment_position - cursors[i].position) * 1.6);
					fragment_colour = vec4(fragment_colour.rgb + cursors[i].colour * intensity, 1.0);
				}
			}

			bool in_wall = texture(wall_texture, fragment_uv).r > 0.0;
			if (in_wall) fragment_colour = vec4(0.3, 0.3, 0.3, 1.0);
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
shader.setUniform1i("wall_texture", 0);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
const render = () => {
	shader.setUniform1i("cursor_count", Object.keys(_clients).length);
	Object.values(_clients).forEach((client, index) => {
		shader.setUniform3fv(`cursors[${index}].colour`, hexToRgb(client.colour));
		shader.setUniform2fv(`cursors[${index}].position`, new Float32Array([client.position.x, client.position.y]));
	});
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	window.requestAnimationFrame(render);
}

render();

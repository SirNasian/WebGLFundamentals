export interface Shader {
	use: () => void;
	getAttribLocation: (name: string) => GLint;
	getUniformLocation: (name: string) => WebGLUniformLocation;
	setUniform1i: (name: string, value: GLint) => void;
	setUniform2fv: (name: string, value: Float32Array) => void;
	setUniform3fv: (name: string, value: Float32Array) => void;
}

export const constructShader = (
	gl: WebGLRenderingContext,
	vertex_shader: WebGLShader | string,
	fragment_shader: WebGLShader | string,
): Shader | null => {
	const program = createProgram(gl, vertex_shader, fragment_shader);
	if (!program) return null;

	const attribute_locations: Record<string, number> = {};
	const getAttribLocation = (name: string): GLint => {
		if (attribute_locations[name] === undefined)
			attribute_locations[name] = gl.getAttribLocation(program, name);
		return attribute_locations[name];
	};

	const uniform_locations: Record<string, WebGLUniformLocation | null> = {};
	const getUniformLocation = (name: string): WebGLUniformLocation | null => {
		if (uniform_locations[name] === undefined)
			uniform_locations[name] = gl.getUniformLocation(program, name);
		return uniform_locations[name];
	};

	return {
		use: () => gl.useProgram(program),
		getAttribLocation,
		getUniformLocation,
		setUniform1i: (name, value) => gl.uniform1i(getUniformLocation(name), value),
		setUniform2fv: (name, value) => gl.uniform2fv(getUniformLocation(name), value),
		setUniform3fv: (name, value) => gl.uniform3fv(getUniformLocation(name), value),
	};
}

const createProgram = (
	gl: WebGLRenderingContext,
	vertex_shader: WebGLShader | string,
	fragment_shader: WebGLShader | string,
): WebGLProgram | null => {
	const program = gl.createProgram();

	const vertex_shader_ = typeof(vertex_shader) === "string" ? compileShader(gl, gl.VERTEX_SHADER, vertex_shader) : vertex_shader;
	const fragment_shader_ = typeof(fragment_shader) === "string" ? compileShader(gl, gl.FRAGMENT_SHADER, fragment_shader) : fragment_shader;
	if (!vertex_shader_ || !fragment_shader_) return null;

	gl.attachShader(program, vertex_shader_);
	gl.attachShader(program, fragment_shader_);
	gl.linkProgram(program);

	const info = gl.getProgramInfoLog(program);
	if (info) console.error(info);

	return info ? null : program;
};

export const compileShader = (
	gl: WebGLRenderingContext,
	shader_type: GLenum,
	shader_source: string,
): WebGLShader | null => {
	const shader = gl.createShader(shader_type);

	gl.shaderSource(shader, shader_source);
	gl.compileShader(shader);

	const info = gl.getShaderInfoLog(shader);
	if (info) console.error(info);

	return info ? null : shader;
};

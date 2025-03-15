export const hexToRgb = (hex: string): Float32Array => {
	const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return new Float32Array([
		(regex ? parseInt(regex[1], 16) : 255) / 255,
		(regex ? parseInt(regex[2], 16) : 255) / 255,
		(regex ? parseInt(regex[3], 16) : 255) / 255,
	]);
};

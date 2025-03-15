const path = require("path");

const externals = ["bufferutil", "utf-8-validate"];

module.exports = [
	{
		entry: "./src/client.ts",
		target: "web",
		module: {
			rules: [{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			}]
		},
		resolve: { extensions: [".js", ".ts"] },
		externals,
		output: {
			path: path.resolve(__dirname, "public", "js"),
			filename: "client.js",
		},
	},
	{
		entry: "./src/server.ts",
		target: "node",
		module: {
			rules: [{
				test: /\.ts$/,
				use: "ts-loader",
				exclude: /node_modules/,
			}]
		},
		resolve: { extensions: [".js", ".ts"] },
		externals,
		output: {
			path: __dirname,
			filename: "server.js",
		},
	}
];

const path = require("path");

module.exports = [{
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
	output: {
		path: path.resolve(__dirname, "public", "js"),
		filename: "client.js",
	},
}];

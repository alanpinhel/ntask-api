import https from "https";
import fs from "fs";

module.exports = app => {
	if (process.env.NODE_ENV !== "test") {
		/**
		 * Modelo de Implementação HTTPS
		 *	const credenciais = {
		 *		key: fs.readFileSync("ntask.key", "utf8"),
		 *		cert: fs.readFileSync("ntask.cert", "utf8")
		 *	};
		 * 
		 *	https.createServer(credenciais, app)
		 *		.listen(app.get("porta"), () => {
		 *			console.log(`NTask API - porta: ${app.get("porta")}`);
		 *		});
		 */
		app.listen(app.get("porta"), () => {
			console.log(`NTask API - porta: ${app.get("porta")}`); 		
		});
	}
};
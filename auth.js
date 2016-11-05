import passport from "passport";
import {Strategy, ExtractJwt} from "passport-jwt";

module.exports = app => {
	const Usuario = app.models.usuario;
	const config = app.libs.config;
	const params = {
		secretOrKey: config.jwtSecret,
		jwtFromRequest: ExtractJwt.fromAuthHeader()
	};
	
	let strategy = new Strategy(params, (payload, done) => {
		Usuario
			.findById(payload._id)
			.select("_id email")
			.then(usuario => {
				if (usuario) {
					return done(null, {
						_id: usuario._id,
						email: usuario.email
					});
				}
				return done(null, false);
			})
			.catch(err => done(err, null));
	});

	passport.use(strategy);
	return {
		initialize: () => {
			return passport.initialize();
		},
		authenticate: () => {
			return passport.authenticate("jwt", config.jwtSession);
		}
	};
};
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import config from './app/config';
import './app/config/passport';
import router from './app/routers';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import passport from 'passport';
import expressSession from 'express-session';
import cookieParser from 'cookie-parser';
const app: Application = express();

// Custom middleware
config.node_env === 'development' &&
	app.use((req, res, next) => {
		console.log(`${req.method} ${req.baseUrl || ''}${req.path}`);
		next();
	});

app.use(
	cors({
		origin: [
			config.frontend_url,
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:3001',
			'https://gogreen-tau.vercel.app',
			// "https://multivendor-ui-web.vercel.app",
		],
		credentials: true,
	}),
);
app.use(
	expressSession({
		secret: 'express-secret',
		resave: false,
		saveUninitialized: false,
	}),
);
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
// Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Router
app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
	res.send({
		message: 'Go Green Server Is Running..',
		environment: config.node_env,
		uptime: process.uptime().toFixed(2) + ' second',
		timeStamp: new Date().toISOString(),
	});
});

// Global Error Handler
app.use(globalErrorHandler);
// Not Found
app.use(notFound);

export default app;

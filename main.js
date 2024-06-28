const fs = require('fs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();

const ip = require('ip');
const port = 8080;
const host = ip.address();
const tokenKey = 'Propusk';
const tokenExpiredTime = 30;

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*'); // Разрешаем доступ с любых доменов
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST'); // Разрешаем указанные HTTP-методы
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Разрешаем указанные заголовки
	res.setHeader('Access-Control-Allow-Credentials', true); // Разрешаем передачу куки (если используются)
	next();
});

app.use(bodyParser.json());

app.listen(port, host, () => {
	console.log(`Example app listening on ip ${host}:${port}`);
});
app.get('/available', (req, res) => {
	const path = './free_orders.json';
	const data = fs.readFileSync(path, 'utf8');
	res.status(200).send(data);
	console.log(req, res);
});
app.get('/booked', (req, res) => {
	// const token = req.headers.authorization;
	// console.log(token);
	// if (!checkJWT(token)) {
	// 	return res.status(401).send({ message: 'Invalid JWT token' });
	// }
	// const user = req.query.user;
	const data = fs.readFileSync('./booked_orders.json', 'utf8');
	res.status(200).send(data);
});
app.post('/book', (req, res) => {
	// const token = req.headers.authorization;
	// console.log(token);
	// if (!checkJWT(token)) {
	// 	return res.status(401).send({ message: 'Invalid JWT token' });
	// }
	const order = req.body;
	book(order);
	return res.status(200).send({ message: 'ok' });
});
app.post('/add', (req, res) => {
	const order = req.body.order;
	addOrder('./free_orders.json', order);
	return res.status(200).send({ message: 'ok' });
});

app.post('/login', (req, res) => {
	const path = 'accounts.json';

	const data = fs.readFileSync(path, 'utf8');
	const users = JSON.parse(data).accounts;

	const { login, password } = req.body;
	console.log(login, password);
	const user = users.find((u) => u.login === login && u.password === password);

	if (!user) {
		return res.status(401).json({ message: 'Invalid username or password' });
	}

	const token = jwt.sign({ login }, tokenKey, { expiresIn: tokenExpiredTime });

	res
		.status(200)
		.json({ jwt: token, role: user.role, name: user.name, login: user.login });
});
app.post('/register', (req, res) => {
	const path = 'accounts.json';

	const data = fs.readFileSync(path, 'utf8');
	const users = JSON.parse(data).accounts;

	const { name, login, password } = req.body;
	console.log(name, login, password);
	const user = users.find((u) => u.login === login);

	if (user) {
		return res.status(401).json({ message: 'Existing user' });
	}
	//
	users.push({ login, name, password, role: 'client' });
	fs.writeFileSync(path, JSON.stringify({ accounts: users }));
	//
	const token = jwt.sign({ login }, tokenKey, { expiresIn: tokenExpiredTime });

	res.status(200).json({ jwt: token, role: 'client', name, login });
});
function checkJWT(JWTValue) {
	if (!JWTValue) {
		return false;
	}

	if (!jwt.verify(JWTValue, tokenKey)) {
		return false;
	}
	return true;
}
function book(order) {
	removeOrder('free_orders.json', order);
	addOrder('booked_orders.json', order);
}
function removeOrder(path, order) {
	let data = JSON.parse(fs.readFileSync(path, 'utf8'));
	data.orders = data.orders.filter(
		(e) => e.time !== order.time || e.mentor !== order.mentor
	);
	fs.writeFileSync(path, JSON.stringify(data));
}
function addOrder(path, order) {
	let data = JSON.parse(fs.readFileSync(path, 'utf8'));

	data.orders.push(order);

	fs.writeFileSync(path, JSON.stringify(data));
}

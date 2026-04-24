const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// db.json: アプリの運用データ（json-serverが監視・永続化）
const router = jsonServer.router(path.join(__dirname, 'db.json'));

// db-history.json: 利用履歴データ（読み取り専用、起動時に読み込み）
const history = require('./db-history.json');

server.use(middlewares);

// 履歴データを読み取り専用エンドポイントとして提供
Object.keys(history).forEach((key) => {
  server.get('/' + key, (req, res) => {
    res.json(history[key]);
  });
});

server.use(router);

server.listen(3001, () => {
  console.log('\n  \\{^_^}/ hi!\n');
  console.log('  Resources');
  console.log('  http://localhost:3001/rooms');
  console.log('  http://localhost:3001/reservations');
  console.log('  http://localhost:3001/devices');
  console.log('  http://localhost:3001/loans');
  console.log('  http://localhost:3001/users');
  console.log('  --- 利用履歴（読み取り専用） ---');
  console.log('  http://localhost:3001/reservationHistory');
  console.log('  http://localhost:3001/loanHistory\n');
});

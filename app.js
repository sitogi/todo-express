'use strict'

const express = require('express');

let todos = [
    { id: 1, title: 'ネーム', completed: false },
    { id: 2, title: '下書き', completed: true },
];

const app = express();
app.use(express.json());

app.get('/api/todos', (req, res) => {
    if (!req.query.completed) {
        return res.json(todos);
    }

    const completed = req.query.completed === 'true';
    res.json(todos.filter(todo => todo.completed === completed));
});

let id = 2;

app.post('/api/todos', (req, res, next) => {
    const { title } = req.body;
    if (typeof title !== 'string' || !title) {
        const err = new Error('title is required');
        err.statusCode = 400;
        return next(err);
    }

    const todo = { id: ++id, title, completed: false };
    todos.push(todo);

    res.status(201).json(todo);
});

// 特定のパスに対するリクエストに対して共通の処理を行うミドルウェア
app.use('/api/todos/:id(\\d+)', (req, res, next) => {
    const targetId = Number(req.params.id);
    const target = todos.find(todo => todo.id === targetId);
    if (target === undefined) {
        const err = new Error('todo not found');
        err.statusCode = 404;
        return next(err);
    }

    target.completed = true;

    req.todo = target;
    next();
});

app.delete('/api/todos/:id(\\d+)', (req, res, next) => {
    todos = todos.filter(todo => todo.id !== req.todo.id);
    res.status(204).end();
});

app.route('api/todos/:id(\\d+)/completed')
  .put((req, res) => {
    req.todo.completed = true;
    res.json(req.todo);
  })
  .delete((req, res) => {
    req.todo.completed = false;
    res.json(req.todo);
  });

app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.statusCode || 500).json({ error: err.message });
});

app.listen(3000);

const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });

nextApp.prepare().then(
  () => app.get('*', nextApp.getRequestHandler()),
  err => {
      console.error(err.stack);
    process.exit(1);
  }
);

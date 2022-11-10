require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const express = require('express');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log('App started. Listening on port ' + port + '. (' + new Date() + '');
});
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, check } = require('express-validator');
const cors = require('cors')
const express = require('express')
// const helmet = require('helmet');
const { pool } = require('./config')

const app = express()

app.use(compression())
// app.use(helmet())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// const isProduction = process.env.NODE_ENV === 'production'
// const origin = {
//     orign: isProduction ? 'https://www.example.com' : '*',
// }
app.use(cors())

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
})

app.use(limiter)

const getErrors = (request, response) => {
    pool.query('SELECT errorID, message FROM harbor', (error, results) => {
        if (error) {
            console.log(error)
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const addError = (request, response) => {
    const { errorid, message } = request.body[0]
    console.log(request.body[0])
    pool.query('INSERT INTO harbor (errorID, message) VALUES ($1, $2)', [errorid, message], error => {
        if (error) {
            console.log(error)
            throw error
        }
        response.status(201).json({ status: 'success', message: 'Error added.' })
    })
}

app
    .route('/error')
    // GET endpoint
    .get(getErrors)
    // POST endpoint
    .post(addError, [check('errorID').not().isEmpty().isLength({ min: 5, max: 255 }).trim(), check('longMessage').not().isEmpty().trim()])

// Start server
app.listen(process.env.PORT || 3002, () => {
    console.log(`Server listening`)
})
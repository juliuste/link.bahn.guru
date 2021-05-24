'use strict'

const express = require('express')
const http = require('http')
const corser = require('corser')
const compression = require('compression')
const morgan = require('morgan')
const shorthash = require('shorthash').unique

const link = require('./link')

const port = process.env.PORT
if (!port) throw new Error('please provide a PORT environment variable')

const api = express()
const server = http.createServer(api)

const allowed = corser.simpleRequestHeaders.concat(['User-Agent'])
api.use(corser.create({ requestHeaders: allowed })) // CORS
api.use(compression())

// setup the logger
morgan.token('id', (req, res) => req.headers['x-forwarded-for'] ? shorthash(req.headers['x-forwarded-for']) : shorthash(req.ip))
api.use(morgan(':date[iso] :id :method :url :status :response-time ms', { stream: process.stdout }))

api.get('/', link)

api.use((err, req, res, next) => {
	if (res.headersSent) return next()
	res.status(err.statusCode || 500).json({ error: true, msg: err.message })
	next()
})

server.listen(port, (e) => {
	if (e) return console.error(e)
	console.log(`Listening on ${port}.`)
})

'use strict'

const config = require('config')
const express = require('express')
const http = require('http')
const corser = require('corser')
const compression = require('compression')

const link = require('./link')

const api = express()
const server = http.createServer(api)

const allowed = corser.simpleRequestHeaders.concat(['User-Agent'])
api.use(corser.create({requestHeaders: allowed})) // CORS
api.use(compression())

api.get('/', link)

api.use((err, req, res, next) => {
	if (res.headersSent) return next()
	res.status(err.statusCode || 500).json({error: true, msg: err.message})
	next()
})

server.listen(config.port, (e) => {
	if (e) return console.error(e)
	console.log(`Listening on ${config.port}.`)
})

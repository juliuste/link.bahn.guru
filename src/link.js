'use strict'

import { generateLink } from './lib.js'

const error = (msg, code) => {
	const e = new Error(msg)
	e.statusCode = code
	return e
}

export const route = async (req, res, next) => {
	try {
		const journey = JSON.parse(req.query.journey)
		const bahncard = req.query.bc
		const travelClass = req.query.class

		const link = await generateLink(journey, bahncard, travelClass)
		res.redirect(link)
		return null
	} catch (e) {
		next(error(e, 400))
		return null
	}
}


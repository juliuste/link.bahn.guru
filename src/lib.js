'use strict'

const shopUrl = require('generate-db-shop-urls')
const { DateTime } = require('luxon')

const ageMap = { // gotten by hand from r (first param)
	'A': 13,
	'Y': 11,
}

// https://www.bahn.de/web/api/angebote/stammdaten/ermaessigungsarten
const discounts = require('./discounts.json')


const bcMap = {
	'0': 'k.E.',
	'2': 'BC25',
	'4': 'BC50',
}

const dcMap = {}

for (const discount of discounts) {
	dcMap[discount.abkuerzung] = discount
}

const fallbackLink = async (journey, bahncard, travelClass, age = 'A') => {
	if (!['0', '1', '2', '3', '4'].includes(bahncard)) throw new Error('invalid bahncard')
	if (!['1', '2'].includes(travelClass)) throw new Error('invalid class')
	if (journey.type !== 'journey' || !journey.legs || journey.legs.length === 0) throw new Error('invalid journey')
	if (!['A', 'Y'].includes(age)) throw new Error('invalid age')

	const params = new URLSearchParams()
	params.set('sts', 'true')

	const firstLeg = journey.legs[0]
	params.set('so', firstLeg.origin.name) // display
	params.set('soid', `A=1@L=${firstLeg.origin.id}@`) // hafas id

	const lastLeg = journey.legs[journey.legs.length - 1]
	params.set('zo', lastLeg.destination.name) // display
	params.set('zoid', `A=1@L=${lastLeg.destination.id}@`) // hafas id

	params.set('kl', travelClass)

	params.set('hd', firstLeg.plannedDeparture) // from when
	params.set('hza', 'D') // D = departure, A = arrival

	const discountAbkuerzung = bcMap[bahncard]
	const discount = dcMap[discountAbkuerzung]
	const klasse = discount.klassen.includes('KLASSENLOS') ? 'KLASSENLOS' : 'KLASSE_' + travelClass

	params.set('r', `${ageMap[age]}:${discount.id}:${klasse}:1`)

	// no idea what those mean
	params.set('ar', false)
	params.set('s', true)
	params.set('d', false)
	params.set('hz', [])
	params.set('fm', false)
	params.set('bp', false)

	return 'https://www.bahn.de/buchung/fahrplan/suche#' + String(params)
}

const generateLink = async (journey, bahncard, travelClass) => {
	if (!['0', '1', '2', '3', '4'].includes(bahncard)) throw new Error('invalid bahncard')
	if (!['1', '2'].includes(travelClass)) throw new Error('invalid class')
	if (journey.type !== 'journey' || !journey.legs || journey.legs.length === 0) throw new Error('invalid journey')

	try {
		const link = await shopUrl(journey, { bahncard, class: travelClass })
		return link
	} catch (e) {
		if (e.message !== 'no matching outbound journey found') {
			throw e
		}
	}
	return fallbackLink(journey, bahncard, travelClass)
}

module.exports = generateLink

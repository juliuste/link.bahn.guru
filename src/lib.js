'use strict'

import { generateDbJourneyUrl } from 'generate-db-journey-url';

// https://www.bahn.de/web/api/angebote/stammdaten/ermaessigungsarten
import discounts from './discounts.json' assert { type: 'json' };

const ageMap = { // gotten by hand from r (first param)
	'A': 13,
	'Y': 11,
}

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
	params.set('sts', 'true') // start search immediately

	const firstLeg = journey.legs[0]
	params.set('so', firstLeg.origin.name) // display name
	params.set('soid', `A=1@L=${firstLeg.origin.id}@`) // hafas id

	const lastLeg = journey.legs[journey.legs.length - 1]
	params.set('zo', lastLeg.destination.name) // display name
	params.set('zoid', `A=1@L=${lastLeg.destination.id}@`) // hafas id

	params.set('kl', travelClass)

	params.set('hd', firstLeg.plannedDeparture) // departure time
	params.set('hza', 'D') // D = departure, A = arrival

	const discountAbkuerzung = bcMap[bahncard]
	const discount = dcMap[discountAbkuerzung]
	const klasse = discount.klassen.includes('KLASSENLOS') ? 'KLASSENLOS' : 'KLASSE_' + travelClass

	params.set('r', `${ageMap[age]}:${discount.id}:${klasse}:1`)
	params.set('ar', false) // seat reservation only
	params.set('s', true) // prefer fast connections
	params.set('d', false) // direct connections only
	params.set('hz', []) // intermediate stops (up to two entries, formatted as: ["<hafas id>","<display name>",<minutes overlay>])
	params.set('fm', false) // taking bike on train
	params.set('bp', false) // best price search

	return 'https://www.bahn.de/buchung/fahrplan/suche#' + String(params)
}

export const generateLink = async (journey, bahncard, travelClass) => {
	if (journey.type === 'journey' && journey.refreshToken) {
		return await generateDbJourneyUrl(journey.refreshToken, 'de')
	} else {
		return fallbackLink(journey, bahncard, travelClass)
	}
}

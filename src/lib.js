'use strict'

const shopUrl = require('generate-db-shop-urls')
const { DateTime } = require('luxon')

const fallbackLink = (journey, bahncard, travelClass) => {
	const trainLegs = journey.legs.filter(l => l.mode !== 'walking')
	const origin = trainLegs[0].origin
	const departure = trainLegs[0].departure
	const destination = trainLegs[trainLegs.length - 1].destination
	const date = DateTime.fromISO(departure).setZone('Europe/Berlin').toFormat('dd.MM.yy')

	const data = {
		startSucheSofort: true,
		startBhfName: origin.name,
		startBhfId: '00' + origin.id,
		zielBhfName: destination.name,
		zielBhfId: '00' + destination.id,
		schnelleVerbindungen: true,
		klasse: travelClass,
		tripType: 'single',
		datumHin: date,
		travellers: [{ typ: 'E', bc: bahncard }],
	}

	return 'https://ps.bahn.de/preissuche/preissuche/psc_start.post?country=DEU&lang=de&dbkanal_007=L01_S01_D001_KIN0001_qf-sparpreis-svb-kl2_lz03&ps=1&psc-anfragedata-json=' + JSON.stringify(data)
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

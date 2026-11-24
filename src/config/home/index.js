import { getAppInstanceKey } from '../../core/appConfig'

const MISSION = 'gather.common.mission'
const SPACECRAFT = 'gather.common.spacecraft'
const photojournalImage = (file, piaId, slug, alt, credit) => ({
    file: `${file}-${piaId.toLowerCase()}.webp`,
    piaId,
    source: `https://science.nasa.gov/photojournal/${slug}/`,
    alt,
    credit,
})

const perseverance = photojournalImage('perseverance', 'PIA26574', 'dust-devil-photobombs-perseverances-selfie',
    'Perseverance in a self-portrait on a rocky Martian slope', 'NASA/JPL-Caltech/MSSS')
const curiosity = photojournalImage('curiosity', 'PIA24173', 'curiositys-selfie-at-the-mary-anning-location-on-mars',
    'Curiosity at the Mary Anning drill site on Mars', 'NASA/JPL-Caltech/MSSS')
const atlasMission = (id, title, target, description, photo, preset = 'planetary-imaging') => ({
    id, title, target, description, image: photo, preset,
    query: { [MISSION]: [id] },
    destinations: { search: {}, archive: { query: { mission: [id] } } },
})
const rawsMission = (mission, spacecraft, title, target, description, photo, preset) => ({
    id: `${mission}:${spacecraft}`, title, target, description, image: photo, preset,
    query: { [MISSION]: [mission], [SPACECRAFT]: [spacecraft] },
    destinations: { search: {} },
})

const home = {
    atlas: {
        heading: 'Featured Missions',
        description: 'Search and browse the PDS Imaging Node (IMG) Archives',
        labels: {
            launchSearch: 'Search Atlas',
            launchArchive: 'Browse Archive Explorer',
            cardSearch: 'Search',
            cardArchive: 'Archive Explorer',
            searchAll: 'Search all missions',
        },
        cards: [
            atlasMission('mars_2020', 'Mars 2020 · Perseverance', 'Mars',
                'Mars 2020 rover images from Jezero Crater, searchable by sol and camera.',
                perseverance, 'mars-2020'),
            atlasMission('msl', 'Mars Science Laboratory · Curiosity', 'Mars',
                'MSL rover images from Gale Crater, searchable by sol and camera.',
                curiosity),
            atlasMission('cas', 'Cassini', 'Saturn',
                'Saturn, ring and moon images from Cassini’s orbiter cameras.',
                photojournalImage('cassini-saturn-shadow', 'PIA08329', 'in-saturns-shadow',
                    'Saturn and its rings backlit by the Sun', 'NASA/JPL/Space Science Institute')),
            atlasMission('juno', 'Juno', 'Jupiter',
                'JunoCam images of Jupiter’s clouds, poles and storms.',
                photojournalImage('juno-jovian-storms', 'PIA25691', 'nasas-juno-mission-captures-swirls-in-jovian-storms',
                    'Swirling clouds in two storms on Jupiter', 'Image data: NASA/JPL-Caltech/SwRI/MSSS, Image processing: Kevin M. Gill (CC BY 3.0)')),
            atlasMission('go', 'Galileo', 'Jupiter',
                'Galileo images of Jupiter and its moons.',
                photojournalImage('galileo-europa', 'PIA19048', 'europas-stunning-surface-2',
                    'Europa’s icy surface crisscrossed by reddish fractures', 'NASA/JPL-Caltech/SETI Institute')),
            atlasMission('mess', 'MESSENGER', 'Mercury',
                'MESSENGER images and mapping data of Mercury’s surface.',
                photojournalImage('messenger-mercury', 'PIA16853', 'colors-of-the-innermost-planet-view-1',
                    'Mercury’s cratered surface in enhanced blue and gold colors',
                    'NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington')),
        ],
    },
    raws: {
        heading: 'Explore Missions',
        description: 'Browse raw images from NASA missions: unprocessed images, delivered quickly after they’re taken.',
        labels: {
            launchSearch: 'Browse Planetary Raws',
            cardSearch: 'Browse',
            searchAll: 'Browse all missions',
        },
        cards: [
            rawsMission('m20', 'perseverance', 'Mars 2020 · Perseverance', 'Mars',
                'Latest, unprocessed images from the Perseverance rover, by sol.',
                perseverance, 'mars-2020'),
            rawsMission('m20', 'ingenuity', 'Mars 2020 · Ingenuity', 'Mars',
                'Latest, unprocessed images from the Ingenuity helicopter’s cameras, by sol.',
                photojournalImage('ingenuity', 'PIA25881', 'ingenuity-at-two-years-on-mars',
                    'Ingenuity resting on the Martian surface', 'NASA/JPL-Caltech/ASU/MSSS'), 'mars-2020'),
            rawsMission('msl', 'curiosity', 'Mars Science Laboratory · Curiosity', 'Mars',
                'Latest, unprocessed images from the Curiosity rover, by sol.',
                curiosity, 'msl'),
            rawsMission('insight', 'insight', 'InSight', 'Mars',
                'Latest, unprocessed images from the InSight lander’s cameras, by sol.',
                photojournalImage('insight', 'PIA22876', 'insights-first-selfie',
                    'InSight’s deck and two solar panels on Mars', 'NASA/JPL-Caltech'), 'insight'),
            rawsMission('cassini', 'cassini', 'Cassini', 'Saturn',
                'Latest, unprocessed images from the Cassini spacecraft at Saturn.',
                photojournalImage('cassini-saturn-rings', 'PIA17474', 'jewel-of-the-solar-system',
                    'Saturn and its rings viewed from above', 'NASA/JPL-Caltech/SSI/Cornell'), 'cassini'),
            rawsMission('psyche', 'psyche', 'Psyche', 'Asteroid belt',
                'Latest, unprocessed images from the Psyche spacecraft.',
                photojournalImage('psyche-spacecraft', 'PIA24473', 'psyche-spacecraft-illustration',
                    'Illustration of the Psyche spacecraft with its solar arrays extended', 'NASA/JPL-Caltech/ASU'), 'psyche'),
        ],
    },
}

export const getHomeConfig = (instance = getAppInstanceKey()) => home[instance]

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
        description: 'Explore planetary images and data from NASA’s Planetary Data System. Search mission imagery or browse the archive by mission.',
        labels: {
            launchSearch: 'Search Atlas',
            launchArchive: 'Browse Archive Explorer',
            cardSearch: 'Search',
            cardArchive: 'Archive Explorer',
            searchAll: 'Search all missions',
        },
        cards: [
            atlasMission('mars_2020', 'Mars 2020 · Perseverance', 'Mars',
                'Find images from Jezero Crater, where Perseverance explores an ancient lakebed and searches for signs of past microbial life.',
                perseverance, 'mars-2020'),
            atlasMission('msl', 'Mars Science Laboratory · Curiosity', 'Mars',
                'Follow Curiosity through Gale Crater as it examines rock layers for clues to whether Mars once supported life.',
                curiosity),
            atlasMission('cas', 'Cassini', 'Saturn',
                'Explore Cassini’s views of Saturn, its rings, and moons including Titan and Enceladus.',
                photojournalImage('cassini-saturn-shadow', 'PIA08329', 'in-saturns-shadow',
                    'Saturn and its rings backlit by the Sun', 'NASA/JPL/Space Science Institute')),
            atlasMission('juno', 'Juno', 'Jupiter',
                'See Jupiter’s swirling clouds and polar storms through images from the Juno spacecraft.',
                photojournalImage('juno-jovian-storms', 'PIA25691', 'nasas-juno-mission-captures-swirls-in-jovian-storms',
                    'Swirling clouds in two storms on Jupiter', 'Image data: NASA/JPL-Caltech/SwRI/MSSS, Image processing: Kevin M. Gill (CC BY 3.0)')),
            atlasMission('go', 'Galileo', 'Jupiter',
                'Revisit the first spacecraft to orbit Jupiter through images of the giant planet and its largest moons.',
                photojournalImage('galileo-europa', 'PIA19048', 'europas-stunning-surface-2',
                    'Europa’s icy surface crisscrossed by reddish fractures', 'NASA/JPL-Caltech/SETI Institute')),
            atlasMission('mess', 'MESSENGER', 'Mercury',
                'Browse the imagery used to map Mercury’s craters, plains, and other surface features.',
                photojournalImage('messenger-mercury', 'PIA16853', 'colors-of-the-innermost-planet-view-1',
                    'Mercury’s cratered surface in enhanced blue and gold colors',
                    'NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington')),
        ],
    },
    raws: {
        heading: 'Explore Missions',
        description: 'Browse raw images from NASA’s planetary missions. Pick a mission to see its imagery, or browse all missions.',
        labels: {
            launchSearch: 'Browse Planetary Raws',
            cardSearch: 'Browse',
            searchAll: 'Browse all missions',
        },
        cards: [
            rawsMission('m20', 'perseverance', 'Mars 2020 · Perseverance', 'Mars',
                'Browse raw rover images from the drive across Jezero Crater.',
                perseverance, 'mars-2020'),
            rawsMission('m20', 'ingenuity', 'Mars 2020 · Ingenuity', 'Mars',
                'See Jezero Crater from above in raw images from the first helicopter to fly on Mars.',
                photojournalImage('ingenuity', 'PIA25881', 'ingenuity-at-two-years-on-mars',
                    'Ingenuity resting on the Martian surface', 'NASA/JPL-Caltech/ASU/MSSS'), 'mars-2020'),
            rawsMission('msl', 'curiosity', 'Mars Science Laboratory · Curiosity', 'Mars',
                'Look through raw images from Curiosity’s traverse across Gale Crater and up Mount Sharp.',
                curiosity, 'msl'),
            rawsMission('insight', 'insight', 'InSight', 'Mars',
                'See raw views of the lander’s deck, instruments, and landing site on Elysium Planitia.',
                photojournalImage('insight', 'PIA22876', 'insights-first-selfie',
                    'InSight’s deck and two solar panels on Mars', 'NASA/JPL-Caltech'), 'insight'),
            rawsMission('cassini', 'cassini', 'Cassini', 'Saturn',
                'Explore raw images from Cassini’s passes by Saturn, its rings, and its moons.',
                photojournalImage('cassini-saturn-rings', 'PIA17474', 'jewel-of-the-solar-system',
                    'Saturn and its rings viewed from above', 'NASA/JPL-Caltech/SSI/Cornell'), 'cassini'),
            rawsMission('psyche', 'psyche', 'Psyche', 'Asteroid belt',
                'Find raw imagery from NASA’s mission to study the metal-rich asteroid Psyche.',
                photojournalImage('psyche-spacecraft', 'PIA24473', 'psyche-spacecraft-illustration',
                    'Illustration of the Psyche spacecraft with its solar arrays extended', 'NASA/JPL-Caltech/ASU'), 'psyche'),
        ],
    },
}

export const getHomeConfig = (instance = getAppInstanceKey()) => home[instance]

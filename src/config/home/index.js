import { getAppInstanceKey } from '../../core/appConfig'

const MISSION = 'gather.common.mission'
const image = (file, alt, position, credit = 'NASA/JPL-Caltech') => ({
    file: `${file}.webp`, alt, position, credit,
})
const atlasMission = (id, title, target, description, photo, preset = 'planetary-imaging') => ({
    id, title, target, description, image: photo, preset,
    query: { [MISSION]: [id] },
    destinations: { search: {}, archive: { query: { mission: [id] } } },
})
const rawsMission = (id, title, target, description, photo, preset) => ({
    id, title, target, description, image: photo, preset,
    query: { [MISSION]: [id] },
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
                image('rover', 'Perseverance on a rocky Martian slope', '65% 52%'), 'mars-2020'),
            atlasMission('msl', 'Mars Science Laboratory · Curiosity', 'Mars',
                'Follow Curiosity through Gale Crater as it examines rock layers for clues to whether Mars once supported life.',
                image('curiosity', 'Curiosity on the surface of Mars', '50% 51%')),
            atlasMission('cas', 'Cassini', 'Saturn',
                'Explore Cassini’s views of Saturn, its rings, and moons including Titan and Enceladus.',
                image('cassini', 'Illustration of the Cassini spacecraft near Saturn', '50% 47%')),
            atlasMission('juno', 'Juno', 'Jupiter',
                'See Jupiter’s swirling clouds and polar storms through images from the Juno spacecraft.',
                image('juno', 'Illustration of Juno above Jupiter', '50% 48%')),
            atlasMission('go', 'Galileo', 'Jupiter',
                'Revisit the first spacecraft to orbit Jupiter through images of the giant planet and its largest moons.',
                image('galileo', 'Illustration of the Galileo spacecraft', '50% 48%')),
            atlasMission('mess', 'MESSENGER', 'Mercury',
                'Browse the imagery used to map Mercury’s craters, plains, and other surface features.',
                image('mercury', 'Mercury’s cratered surface', '50% 50%', 'NASA/Johns Hopkins APL/Carnegie Institution of Washington')),
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
            rawsMission('mars_2020', 'Mars 2020 · Perseverance', 'Mars',
                'Browse raw rover images from the drive across Jezero Crater.',
                image('rover', 'Perseverance on a rocky Martian slope', '68% 52%'), 'mars-2020'),
            rawsMission('msl', 'Mars Science Laboratory · Curiosity', 'Mars',
                'Look through raw images from Curiosity’s traverse across Gale Crater and up Mount Sharp.',
                image('curiosity', 'Curiosity on the surface of Mars', '50% 51%')),
            rawsMission('nsyt', 'InSight', 'Mars',
                'See raw views of the lander’s deck, instruments, and landing site on Elysium Planitia.',
                image('insight', 'Illustration of InSight on Elysium Planitia', '50% 52%')),
            rawsMission('cas', 'Cassini', 'Saturn',
                'Explore raw images from Cassini’s passes by Saturn, its rings, and its moons.',
                image('saturn', 'Backlit Saturn and its rings', '50% 50%', 'NASA/JPL-Caltech/Space Science Institute')),
            rawsMission('psyche', 'Psyche', 'Asteroid belt',
                'Find raw imagery from NASA’s mission to study the metal-rich asteroid Psyche.',
                image('psyche', 'Illustration of the asteroid Psyche', '50% 49%')),
        ],
    },
}

export const getHomeConfig = (instance = getAppInstanceKey()) => home[instance]

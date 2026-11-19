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
        cards: [{
            id: 'mars_2020',
            title: 'Mars 2020 · Perseverance',
            target: 'Mars',
            description: 'Browse raw rover images from the drive across Jezero Crater.',
            image: image('perseverance', 'Panorama of the terrain at Jezero Crater', '68% 52%'),
            query: { [MISSION]: ['mars_2020'] },
            preset: 'mars-2020',
            destinations: { search: {} },
        }],
    },
}

export const getHomeConfig = (instance = getAppInstanceKey()) => home[instance]

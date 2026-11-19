import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import { getAppConfig } from '../../core/appConfig'
import { getPublicUrl } from '../../core/runtimeConfig'
import { resetArchiveExplorer } from '../../core/redux/actions/actions'
import { getHomeConfig } from '../../config/home'
import { getHomeDestination } from './homeLinks'
import './home.css'

const fromHome = { fromHome: true }

const HomeAction = ({ destination, to, label, card, secondary }) => {
    const dispatch = useDispatch()
    return (
        <Button
            component={Link}
            to={to}
            state={destination === 'search' ? fromHome : undefined}
            onClick={destination === 'archive' ? (event) => {
                if (!event.defaultPrevented && event.button === 0 && !event.metaKey &&
                    !event.ctrlKey && !event.shiftKey && !event.altKey) dispatch(resetArchiveExplorer())
            } : undefined}
            variant={secondary ? 'outlined' : 'contained'}
            disableElevation
            aria-label={card ? `${label} ${card.title}` : undefined}
            endIcon={<ArrowForwardIcon />}
            className="home-action"
        >
            {label}
        </Button>
    )
}

const CuratedCard = ({ card, labels, archiveEnabled }) => {
    const search = getHomeDestination('search', card)
    const archive = archiveEnabled && getHomeDestination('archive', card)
    return (
        <article className="home-card">
            {search && <Link to={search} state={fromHome} className="home-photo"
                aria-label={`${labels.cardSearch} ${card.title} using the mission image`}>
                <img src={`${getPublicUrl()}/images/missions/${card.image.file}`}
                    alt={card.image.alt} title={card.image.credit}
                    style={{ objectPosition: card.image.position }} />
            </Link>}
            <div className="home-card-copy">
                <p className="home-target">{card.target}</p>
                <h3>{search ? <Link to={search} state={fromHome}>{card.title}</Link> : card.title}</h3>
                <p className="home-card-description">{card.description}</p>
                <div className="home-actions">
                    {search && <HomeAction destination="search" to={search} label={labels.cardSearch} card={card} />}
                    {archive && <HomeAction destination="archive" to={archive} label={labels.cardArchive} card={card} secondary />}
                </div>
            </div>
        </article>
    )
}

const Home = () => {
    const { appTitle, enableArchiveExplorer } = getAppConfig()
    const { heading, description, labels, cards } = getHomeConfig()
    useEffect(() => { document.title = `${appTitle} | PDS-IMG` }, [appTitle])

    return (
        <Box component="main" className="atlas-home">
            <section className="home-intro">
                <div className="home-wrap">
                    <h1>{appTitle}</h1>
                    <p>{description}</p>
                    <div className="home-actions">
                        <HomeAction destination="search" to={getHomeDestination('search')} label={labels.launchSearch} />
                        {enableArchiveExplorer && <HomeAction destination="archive" to={getHomeDestination('archive')}
                            label={labels.launchArchive} secondary />}
                    </div>
                </div>
            </section>
            <section className="home-wrap home-missions" aria-labelledby="home-missions-title">
                <div className="home-section-head">
                    <h2 id="home-missions-title">{heading}</h2>
                    <Link to={getHomeDestination('search')} state={fromHome}>{labels.searchAll} <span aria-hidden="true">→</span></Link>
                </div>
                <div className="home-grid">
                    {cards.map((card) => <CuratedCard key={card.id} card={card} labels={labels} archiveEnabled={enableArchiveExplorer} />)}
                </div>
            </section>
        </Box>
    )
}

export default Home

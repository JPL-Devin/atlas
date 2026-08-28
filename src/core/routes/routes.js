import React, { useEffect, Suspense, lazy } from 'react'
import { useDispatch } from 'react-redux'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Topbar from '../../components/Topbar'
import SnackBar from '../../components/SnackBar/SnackBar'

import InformationModal from '../../pages/Search/Modals/InformationModal/InformationModal'
import FeedbackModal from '../../pages/Search/Modals/FeedbackModal/FeedbackModal'

import { getPublicUrl } from '../runtimeConfig'
import { getAppConfig } from '../appConfig'
import { loadMappings } from '../redux/actions/actions.js'

import './routes.css'

// Route-level code splitting keeps each page's heavy deps out of the main bundle
const Search = lazy(() => import('../../pages/Search/Search'))
const Record = lazy(() => import('../../pages/Record/Record'))
const FileExplorer = lazy(() => import('../../pages/FileExplorer/FileExplorer'))
const Cart = lazy(() => import('../../pages/Cart/Cart'))

export const AppRoutes = () => {
    const dispatch = useDispatch()
    const publicUrl = getPublicUrl()

    // On first load, grab all the atlas index mappings
    useEffect(() => {
        dispatch(loadMappings('atlas'))
    }, [])

    return (
        <div className="Routes">
            <Router
                basename={publicUrl}
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
                <div className="routeMain">
                    <Topbar />
                    <div className="routeContent">
                        <Suspense fallback={null}>
                            <Routes>
                                <Route path="/search" element={<Search />} />
                                <Route path="/record" element={<Record />} />
                                {getAppConfig().enableCart && (
                                    <Route path="/cart" element={<Cart />} />
                                )}
                                {getAppConfig().enableArchiveExplorer && (
                                    <Route
                                        path="/archive-explorer"
                                        element={<FileExplorer />}
                                    />
                                )}
                            </Routes>
                        </Suspense>
                    </div>
                </div>
            </Router>
            <InformationModal />
            <FeedbackModal />
            <SnackBar />
        </div>
    )
}

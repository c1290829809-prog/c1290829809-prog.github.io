import {BrowserRouter,HashRouter,Route,Routes,useLocation} from 'react-router-dom'
import {HomePage} from './pages/Home'
import {IdolPage} from './pages/Idol'
import {PlacePage} from './pages/Place'
import {ProfilePage} from './pages/Profile'
import {RouteBuilderPage} from './pages/RouteBuilder'
import {SearchPage} from './pages/Search'
import {WorkPage} from './pages/Work'
import {CityPage} from './pages/City'
import {WorksPage} from './pages/Works'
import {MapExplorePage} from './pages/MapExplore'
import {FeedbackPage} from './pages/Feedback'
import {AdminFeedbackPage} from './pages/AdminFeedback'
import {AdminContentPage,AdminDashboardPage,AdminPlaceFormPage,AdminReviewPage} from './pages/Admin'
import {AdminCityFormPage,AdminCityListPage,AdminIdolFormPage,AdminIdolListPage,AdminWorkFormPage,AdminWorkListPage} from './pages/AdminBaseData'
import {AppErrorBoundary} from './components/AppErrorBoundary'
import {CloudSync} from './components/CloudSync'
function AppRoutes(){const location=useLocation(),admin=location.pathname.startsWith('/admin');return <div className={admin?'min-h-[100dvh]':'mx-auto min-h-[100dvh] w-full max-w-md bg-paper text-ink shadow-[0_0_60px_rgba(53,44,39,.10)] lg:max-w-6xl lg:shadow-[0_0_80px_rgba(53,44,39,.12)]'}><Routes><Route path="/" element={<HomePage/>}/><Route path="/works" element={<WorksPage/>}/><Route path="/map" element={<MapExplorePage/>}/><Route path="/feedback" element={<FeedbackPage/>}/><Route path="/idol/:id" element={<IdolPage/>}/><Route path="/work/:id" element={<WorkPage/>}/><Route path="/city/:id" element={<CityPage/>}/><Route path="/place/:id" element={<PlacePage/>}/><Route path="/route/builder" element={<RouteBuilderPage/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/admin" element={<AdminDashboardPage/>}/><Route path="/admin/dashboard" element={<AdminDashboardPage/>}/><Route path="/admin/place/new" element={<AdminPlaceFormPage/>}/><Route path="/admin/place/ai" element={<AdminPlaceFormPage/>}/><Route path="/admin/new" element={<AdminPlaceFormPage/>}/><Route path="/admin/review" element={<AdminReviewPage/>}/><Route path="/admin/content" element={<AdminContentPage/>}/><Route path="/admin/feedback" element={<AdminFeedbackPage/>}/><Route path="/admin/idol" element={<AdminIdolFormPage/>}/><Route path="/admin/idol/:id/edit" element={<AdminIdolFormPage/>}/><Route path="/admin/idol/list" element={<AdminIdolListPage/>}/><Route path="/admin/work" element={<AdminWorkFormPage/>}/><Route path="/admin/work/list" element={<AdminWorkListPage/>}/><Route path="/admin/city" element={<AdminCityFormPage/>}/><Route path="/admin/city/list" element={<AdminCityListPage/>}/><Route path="/admin/*" element={<AdminDashboardPage/>}/><Route path="*" element={<HomePage/>}/></Routes></div>}
export default function App(){
 const Router=import.meta.env.PROD?HashRouter:BrowserRouter
 return <AppErrorBoundary><CloudSync/><Router><AppRoutes/></Router></AppErrorBoundary>
}

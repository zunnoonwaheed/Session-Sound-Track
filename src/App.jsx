import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Admin from "./pages/Admin"
import AdminPlaylists from "./pages/AdminPlaylists"
import AdminLogin from "./pages/AdminLogin"
import AdminFilters from "./pages/AdminFilters"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Subscription from "./pages/Subscription"
import Learn from "./pages/Learn"
import AdminLearn from "./pages/AdminLearn"
import AdminSubs from "./pages/AdminSubs"
import StripeProvider from "./components/stripeProvider"
import SubscriptionSuccess from "./pages/SubscriptionSuccess" 

function App() {
  return (
    <StripeProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} /> 
        <Route path="/adminplaylists" element={<AdminPlaylists />} />
        <Route path="/admin-learn" element={<AdminLearn />} />
        <Route path="/admin-subs" element={<AdminSubs />} />
        <Route path="/admin-filters" element={<AdminFilters />} />
        <Route path="/admin-login" element={<AdminLogin />} />
      </Routes>
    </StripeProvider>
  )
}

export default App

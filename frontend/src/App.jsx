import { Routes, Route, Navigate } from "react-router-dom";
 
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import PropertyMarketplace from "./pages/propertyMarketplace";
import Properties from "./pages/properties";
import AddProperty from "./pages/addProperty";
import PropertyDetails from "./pages/propertyDetails";
import Chat from "./pages/chat";
import HostChatInbox from "./pages/hostChatInbox";
import AdminDashboard from "./pages/adminDashboard";
import Wishlist from "./pages/wishlist";
import Compare from "./pages/compare";
import MyBookings from "./pages/myBookings";
import ManageAvailability from "./pages/manageAvailability";
import HostRevenue from "./pages/hostRevenue";
import Wallet from "./pages/wallet";
import MapSearch from "./pages/mapSearch";
import DashboardLayout from "./components/dashboardLayout";
 
function App() {
    return (
        <Routes>
            {/* Public routes — no nav */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
 
            {/* Authenticated routes — all share the persistent navbar */}
            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/addProperty" element={<AddProperty />} />
                <Route path="/properties" element={<PropertyMarketplace />} />
                <Route path="/properties/manage" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/properties/:id/availability" element={<ManageAvailability />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/inbox" element={<HostChatInbox />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/bookings" element={<MyBookings />} />
                <Route path="/revenue" element={<HostRevenue />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/map-search" element={<MapSearch />} />
            </Route>
        </Routes>
    );
}
 
export default App;

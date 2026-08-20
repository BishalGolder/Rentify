import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import PropertyMarketplace from "./pages/propertyMarketplace";
import Properties from "./pages/properties";
import AddProperty from "./pages/addProperty";
import PropertyDetails from "./pages/propertyDetails"; // created in E.6
import AdminDashboard from "./pages/adminDashboard";   // created in E.3
import Wishlist from "./pages/wishlist";
import Compare from "./pages/compare"; 


function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/addProperty"element={<AddProperty />} />
            <Route path="/properties" element={<PropertyMarketplace />} />
            <Route path="/properties/manage" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} /> 

        </Routes>
    );
}

export default App;
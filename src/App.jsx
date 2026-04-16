import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

//all page imports
import HomePage from "./pages/HomePage";
import IroncladPageStats from "./pages/IroncladPageStats";
import SilentPageStats from "./pages/SilentPageStats";
import DefectPageStats from "./pages/DefectPageStats";
import WatcherPageStats from "./pages/WatcherPageStats";
import ProfilePage from "./pages/ProfilePage";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/character/ironclad" element={<IroncladPageStats />} />
        <Route path="/character/silent" element={<SilentPageStats />} />
        <Route path="/character/defect" element={<DefectPageStats />} />
        <Route path="/character/watcher" element={<WatcherPageStats />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
}

export default App;
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

//all page imports
import HomePage from "./pages/HomePage";
import IroncladStatsPage from "./pages/IroncladStatsPage";
import SilentStatsPage from "./pages/SilentStatsPage";
import DefectStatsPage from "./pages/DefectStatsPage";
import WatcherStatsPage from "./pages/WatcherStatsPage";
import ProfilePage from "./pages/ProfilePage";
import ErrorPage from "./pages/ErrorPage";
import UploadRunPage from "./pages/UploadRunPage";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/character/ironclad" element={<IroncladStatsPage />} />
        <Route path="/character/silent" element={<SilentStatsPage />} />
        <Route path="/character/defect" element={<DefectStatsPage />} />
        <Route path="/character/watcher" element={<WatcherStatsPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/upload" element={<UploadRunPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  );
}

export default App;
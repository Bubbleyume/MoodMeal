import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "./lib/router";
import BottomNavigation from "./components/BottomNavigation";

import WelcomePage from "./pages/WelcomePage";
import MoodSelectionPage from "./pages/MoodSelectionPage";
import AnalysisTransitionPage from "./pages/AnalysisTransitionPage";
import MoodResultPage from "./pages/MoodResultPage";
import FoodsPage from "./pages/FoodsPage";
import MealsPage from "./pages/MealsPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import GroceryListPage from "./pages/GroceryListPage";
import MoodHistoryPage from "./pages/MoodHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import AvatarEditorPage from "./pages/AvatarEditorPage";

import WellnessPage from "./pages/WellnessPage";
import HealthPage from "./pages/HealthPage";
import TrackingPage from "./pages/TrackingPage";
import RemindersPage from "./pages/RemindersPage";
import SelfCarePage from "./pages/SelfCarePage";
import GlossaryPage from "./pages/GlossaryPage";
import ReminderAlerts from "./components/ReminderAlerts";

const NO_NAV_ROUTES = ["/", "/analyzing", "/onboarding", "/profile/avatar"];

function Shell() {
  const { pathname } = useLocation();
  const showNav = !NO_NAV_ROUTES.includes(pathname);

  return (
    <div className="app-shell">
      <ReminderAlerts />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/mood" element={<MoodSelectionPage />} />
        <Route path="/analyzing" element={<AnalysisTransitionPage />} />
        <Route path="/result" element={<MoodResultPage />} />
        <Route path="/foods" element={<FoodsPage />} />
        <Route path="/meals" element={<MealsPage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/grocery" element={<GroceryListPage />} />
        <Route path="/history" element={<MoodHistoryPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/self-care" element={<SelfCarePage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/glossary/:id" element={<GlossaryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/avatar" element={<AvatarEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNavigation />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

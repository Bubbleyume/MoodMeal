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

const NO_NAV_ROUTES = ["/", "/analyzing", "/onboarding", "/profile/avatar"];

function Shell() {
  const { pathname } = useLocation();
  const showNav = !NO_NAV_ROUTES.includes(pathname);

  return (
    <div className="app-shell">
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

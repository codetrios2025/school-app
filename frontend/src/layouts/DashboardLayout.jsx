import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar/Sidebar";
import Header from "./Header/Header";
import Style from "./DashboardLayout.module.css";

export default function DashboardLayout() {
  return (
    <div className={Style.layoutContainer}>
      <aside className={Style.mainSidebar}>
        <Sidebar />
      </aside>
      <div className={Style.mainWrapper}>
        <div className={Style.mainHeader}>
          <Header />
        </div>
        <main className={Style.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
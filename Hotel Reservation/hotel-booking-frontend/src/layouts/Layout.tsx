import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLocation } from "react-router-dom";
// import Hero from "../components/Hero";
// import SearchBar from "../components/SearchBar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  const location = useLocation();
  // const isAnalyticsPage = location.pathname === "/analytics";
  // const isSearchPage = location.pathname === "/search";
  const isHomePage = location.pathname === "/";

  return (
    <div className="relative flex flex-col min-h-screen">
      <div className="absolute inset-0 aurora-veil animate-aurora -z-10" />
      <Header />
      {/* <Hero /> */}
      {/* <div className="px-4 mx-auto max-w-8xl sm:px-6 lg:px-8">
        <SearchBar />
      </div> */}
      {isHomePage ? (
        <div className="flex-1">{children}</div>
      ) : (
        <div className="flex-1 w-full px-2 py-10 sm:px-6 lg:px-8">
          {children}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Layout;

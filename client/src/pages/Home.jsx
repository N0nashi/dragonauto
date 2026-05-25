import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainFrame1 from "../components/MainFrame1";
import MainFrame2 from "../components/MainFrame2";
import ReviewsBlock from "../components/ReviewsBlock";
import FAQBlock from "../components/FAQBlock";
import MainFrame4 from "../components/MainFrame4";

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#reviews") {
      const target = document.getElementById("reviews");
      if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location]);

  return (
    <main className="flex flex-col">
      <MainFrame1 />
      <ReviewsBlock />
      <MainFrame2 />
      <FAQBlock />
      <MainFrame4 />
    </main>
  );
}

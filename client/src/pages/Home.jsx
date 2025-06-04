import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainFrame1 from "../components/MainFrame1";
import MainFrame2 from "../components/MainFrame2";
import ReviewsBlock from "../components/ReviewsBlock"; // можно переименовать в MainFrame3
import MainFrame4 from "../components/MainFrame4";

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#reviews") {
      const target = document.getElementById("reviews");
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <main className="flex flex-col gap-16 lg:gap-24">
      <section>
        <MainFrame1 />
      </section>

      <section>
        <MainFrame2 />
      </section>

      <section id="reviews">
        <ReviewsBlock />
      </section>
      <section>
        <MainFrame4 />
      </section>
    </main>
  );
}
